import {
	Editor,
	MarkdownView,
	App,
	Setting,
	Modal,
	FuzzySuggestModal,
	Notice,
    normalizePath,
    TFile,
    TFolder,
} from "obsidian";

import * as path from "path";

import * as bignote from "./bignote";


import * as comm from "./common";

async function run_with_user_input(editor: Editor, view: MarkdownView, opt_selected_bignote_root_folder: TFolder | undefined, selected_context: string, new_note_name: string) {
    const opt_spawner_file = view.file;
    if (!opt_spawner_file) {
        new Notice(`Error: Please use this command from within a note to spawn from`);
        return;
    }
    const spawner_file = opt_spawner_file;

    const spawner_is_index = bignote.is_bignote_index_file(spawner_file);

    // We only require it be a small note file if it's not spawned from outside or the index
    if (!spawner_is_index && !opt_selected_bignote_root_folder && !bignote.is_bignote_small_note_file(view, spawner_file)) {
        new Notice(`Error: Spawner file is not a small note`);
        return;
    }

    var opt_index_file: TFile | undefined = undefined;

    if (spawner_is_index) {
        opt_index_file = spawner_file;
    } else if (opt_selected_bignote_root_folder) {
        opt_index_file = bignote.get_bignote_index_file_from_bignote_root_folder(opt_selected_bignote_root_folder);
    } else {
        opt_index_file = bignote.get_bignote_index_file_from_child(view, spawner_file);
    }

    if (!opt_index_file) {
        new Notice(`Error: Failed to retrieve index file`);
        return;
    }
    const index_file = opt_index_file;

    const opt_bignote_root_folder = index_file.parent;
    if (!opt_bignote_root_folder) {
        new Notice(`Failed Assertion: index file has no parent`);
        return;
    }
    const bignote_root_folder = opt_bignote_root_folder;

    const opt_context_folder_name = bignote.context_type_singular_convert(selected_context, bignote.CONTEXT_TYPE_FOLDERS);
    if (!opt_context_folder_name) {
        new Notice(`Error: Failed to retrieve context folder`);
        return;
    }
    const context_folder_name = opt_context_folder_name;

    const opt_context_block_identifier_code = bignote.context_type_singular_convert(selected_context, bignote.CONTEXT_TYPE_BLOCK_IDENTIFIER_CODE);
    if (!opt_context_block_identifier_code) {
        new Notice(`Error: Failed to retrieve context block identifier code`);
        return;
    }
    const context_block_identifier_code = opt_context_block_identifier_code;

    const context_folder_path = normalizePath(path.join(bignote_root_folder.path, context_folder_name));

    const fs = spawner_file.vault.adapter;

    console.log(`context_folder_path: ${context_folder_path}`);
    await fs.mkdir(context_folder_path);

    const id6 = comm.make_hex_id(6);

    const opt_triplet_id = bignote.get_next_triplet_id_for_folder(context_folder_name, index_file);
    if (!opt_triplet_id) {
        new Notice(`Error: Failed to generate new triplet id`);
        return;
    }
    const triplet_id = opt_triplet_id;

    const new_note_basename = `${triplet_id} ${new_note_name}`;

    const block_identifier = `^spawn-${context_block_identifier_code}-${id6}`;

    comm.insert_text_at_editor_cursor_in_own_line(editor, `Spawn [[${new_note_basename}]] ${block_identifier}`);

    const new_file_path = normalizePath(path.join(context_folder_path, new_note_basename + ".md"));

    console.log(`new_file_path: ${new_file_path}`);

    // We add a "status: todo" automatically for all doer context types.
    var automatic_status = "";
    if (bignote.context_type_heading_singular_is_doer(selected_context)) {
        automatic_status = `status: todo\n`;
    }

    await fs.write(new_file_path, 
        `---\n` +
        `parent: "[[${index_file.basename}]]"\n` +
        `spawned_by: "[[${spawner_file.basename}]]"\n` +
        automatic_status +
        `---\n\n` +
        `Parent: [[${index_file.basename}]]\n\n` +
        `Spawned in [[${spawner_file.basename}#${block_identifier}|${block_identifier}]]\n\n` +
        `# Journal`
    );
}

export class InputNoteNameModal extends Modal {
	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.setTitle("New Note Name (without NNN ID)");

		let name = "";

		new Setting(this.contentEl).setName("New Note Name").addText((text) =>
			text.onChange((value) => {
				name = value;
			})
		);

		new Setting(this.contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					onSubmit(name);
				})
		);
	}
}

export class SelectContextTypeModal extends FuzzySuggestModal<string> {
    editor: Editor;
    view: MarkdownView;
    opt_selected_bignote_root_folder: TFolder | undefined;

	constructor(app: App, editor: Editor, view: MarkdownView, opt_selected_index_folder: TFolder | undefined) {
        super(app)
        this.editor = editor;
        this.view = view;
        this.opt_selected_bignote_root_folder = opt_selected_index_folder;
    }

	getItems(): string[] {
		return bignote.CONTEXT_TYPE_HEADINGS_SINGULAR;
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
		new InputNoteNameModal(this.app, (result) => {
            run_with_user_input(this.editor, this.view, this.opt_selected_bignote_root_folder, item, result);
		}).open();
	}
}

export class SelectBignoteRootFolderModal extends FuzzySuggestModal<TFolder> {
    editor: Editor;
    view: MarkdownView;

	constructor(app: App, editor: Editor, view: MarkdownView) {
        super(app)
        this.editor = editor;
        this.view = view;
    }

	getItems(): TFolder[] {
		return bignote.get_all_index_folders_in_vault(this.view);
	}

	getItemText(item: TFolder): string {
		return item.name;
	}

	onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent) {
        new SelectContextTypeModal(this.view.app, this.editor, this.view, /*opt_selected_bignote_root_folder*/ item).open();
	}
}

export async function run(editor: Editor, view: MarkdownView) {
	new SelectContextTypeModal(view.app, editor, view, /*opt_selected_bignote_root_folder*/ undefined).open();
}

export async function run_from_outside(editor: Editor, view: MarkdownView) {
    new SelectBignoteRootFolderModal(view.app, editor, view).open();
}

