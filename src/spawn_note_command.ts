import {
	Editor,
	MarkdownView,
	App,
	Setting,
	Modal,
	FuzzySuggestModal,
	Notice,
    normalizePath,
} from "obsidian";

import * as path from "path";

import * as bignote from "./bignote";


import * as comm from "./common";

async function run_with_user_input(editor: Editor, view: MarkdownView, selected_context: string, new_note_name: string) {
    const opt_spawner_file = view.file;
    if (!opt_spawner_file) {
        new Notice(`Error: Please use this command from within a note to spawn from`);
        return;
    }
    const spawner_file = opt_spawner_file;

    if (!bignote.is_bignote_small_note_file(view, spawner_file)) {
        new Notice(`Error: Spawner file is not a small note`);
        return;
    }

    const opt_index_file = bignote.get_bignote_index_file_from_child(view, spawner_file);
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

    const opt_context_folder_name = bignote.context_type_heading_to_folder(selected_context);
    if (!opt_context_folder_name) {
        new Notice(`Error: Failed to retrieve context folder`);
        return;
    }
    const context_folder_name = opt_context_folder_name;

    const opt_context_block_identifier_code = bignote.context_type_heading_to_block_identifier_code(selected_context);
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
    if (bignote.context_type_heading_is_doer(selected_context)) {
        automatic_status = `status: todo\n`;
    }

    await fs.write(new_file_path, 
        `---\n` +
        `parent: "[[${index_file.basename}]]"\n` +
        `spawned_by: "[[${spawner_file.basename}]]"\n` +
        automatic_status +
        `---\n\n` +
        `Parent: [[${index_file.basename}]]\n\n` +
        `Spawned in [[${spawner_file.basename}#${block_identifier}|${block_identifier}]]\n\n`
    );
}

export class InputNoteNameModal extends Modal {
    editor: Editor;
    view: MarkdownView;

	constructor(app: App, editor: Editor, view: MarkdownView, onSubmit: (result: string) => void) {
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

	constructor(app: App, editor: Editor, view: MarkdownView) {
        super(app)
        this.editor = editor;
        this.view = view;
    }

	getItems(): string[] {
		return bignote.CONTEXT_TYPE_HEADINGS;
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
		new InputNoteNameModal(this.app, this.editor, this.view, (result) => {
            run_with_user_input(this.editor, this.view, item, result);
		}).open();
	}
}

export async function run(editor: Editor, view: MarkdownView) {
	new SelectContextTypeModal(view.app, editor, view).open();
}
