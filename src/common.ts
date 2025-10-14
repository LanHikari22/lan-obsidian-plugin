import {
	Editor,
    FrontMatterCache,
    MarkdownView,
    TFile,
    TFolder,
} from "obsidian";


export class IError<T> extends Error {
	type: T;
	data: any[];

	constructor(type: T, data: any[]) {
		super()
		this.type = type;
		this.data = data;
	}

	to_str(): string {
        return "Not Implemented"
    }
}

/// Similar to https://stackoverflow.com/a/1349426/6944447
export function make_hex_id(length: number) {
    var result           = '';
    var characters       = 'abcdef0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export enum GetFrontmatterNotePropertyErrorType {
    NoFileCache, // (TFile)
    NoFrontMatter, // (TFile)
    PropNotInFrontMatter, // (TFile, string)
	Unimplemented,
}

export class GetFrontmatterNotePropertyError extends IError<GetFrontmatterNotePropertyErrorType> {
	to_str(): string {
		let FnErrTy = GetFrontmatterNotePropertyErrorType;

		switch (this.type) {
            case FnErrTy.NoFileCache:
                return `Could not retrieve file cache for ${this.data[0].name}`
            case FnErrTy.NoFrontMatter:
                return `Could not retrieve frontmatter for ${this.data[0].name}`
            case FnErrTy.PropNotInFrontMatter:
                return `Property ${this.data[1]} not found in ${this.data[0].name}`
			case FnErrTy.Unimplemented:
				return `Unimplemented`
			default:
				return "Invalid Error Type"
		}
    }
}

export function get_frontmatter_note_property(view: MarkdownView, file: TFile, prop: string): string | GetFrontmatterNotePropertyError {
    let FnErr = GetFrontmatterNotePropertyError;
    let FnErrTy = GetFrontmatterNotePropertyErrorType;

    const opt_cache = view.app.metadataCache.getFileCache(file);
    if (!opt_cache) {
        return new FnErr(FnErrTy.NoFileCache, [file]);
    }
    const cache = opt_cache;

    const opt_frontmatter = cache.frontmatter;
    if (!opt_frontmatter) {
        return new FnErr(FnErrTy.NoFrontMatter, [file]);
    }
    const frontmatter: FrontMatterCache = opt_frontmatter;

    // this value could be anything but we expect a string
    const opt_value: string | undefined = frontmatter[prop];
    if (!opt_value) {
        return new FnErr(FnErrTy.PropNotInFrontMatter, [file, prop])
    }
    const value = opt_value.replace("[[", "").replace("]]", "");

    return value;
}

export enum GetFileFrontmatterNotePropertyErrorType {
    NoFrontmatterProp, // (GetFrontmatterNotePropertyError)
    PropNotAFile, // (TFile, Prop)
}

export class GetFileFrontmatterNotePropertyError extends IError<GetFileFrontmatterNotePropertyErrorType> {
	to_str(): string {
		let FnErrTy = GetFileFrontmatterNotePropertyErrorType;

		switch (this.type) {
			case FnErrTy.NoFrontmatterProp:
				return `No Frontmatter property: ${this.data[0].to_str()}`
			case FnErrTy.PropNotAFile:
				return `Property is not a file: ${this.data[1]} from ${this.data[0].name}`
			default:
				return "Invalid Error Type"
		}
    }
}

/// Gets a frontmatter property that points to a file if found
export function get_file_frontmatter_note_property(view: MarkdownView, file: TFile, prop: string): TFile | GetFileFrontmatterNotePropertyError {
    let FnErr = GetFileFrontmatterNotePropertyError;
    let FnErrTy = GetFileFrontmatterNotePropertyErrorType;

    let res_value = get_frontmatter_note_property(view, file, prop);
    if (res_value instanceof IError) {
        return new FnErr(FnErrTy.NoFrontmatterProp, [res_value]);
    }
    let value = res_value;

    let opt_linked_file = file.vault.getMarkdownFiles().find(f => f.basename === value);
    if (!opt_linked_file) {
        return new FnErr(FnErrTy.PropNotAFile, [file, value]);
    }
    let linked_file = opt_linked_file

    return linked_file;
}


export function insert_text_at_editor_cursor_in_own_line(editor: Editor, text: string) {
    const cursor = editor.getCursor();

    editor.replaceRange("\n" + text + "\n", cursor);
}

export function get_child_folder_by_name(folder: TFolder, child_name: string): TFolder | undefined {
    for (var i=0; i<folder.children.length; i++) {
        const child = folder.children[i];

        if (child instanceof TFolder && child.name === child_name) {
            return child;
        }
    }

    return undefined;
}

export function get_folder_child_file_count_non_recursive(folder: TFolder): number {
    var count = 0;

    for (var i=0; i<folder.children.length; i++) {
        const child = folder.children[i];
        if (child instanceof TFile) {
            count++;
        }
    }

    return count;
}

export async function append_content_to_file(file: TFile, content: string) {
    const fs = file.vault.adapter;

    const cur_content = await fs.read(file.path);

    const new_content = cur_content + "\n" + content;

    await fs.write(file.path, new_content);
}

export function strip_autonumbered_headers(s: string): string {
    if (!s.startsWith('#')) {
        return s;
    }

    let tokens = s.split(" ");

    if (tokens.length < 3) {
        return s;
    }

    let is_numbering = (() => {
        let possible_numbering_tokens = tokens[1].split(".");

        for (var i=0; i<possible_numbering_tokens.length; i++) {
            let possible_n = possible_numbering_tokens[i];

            let isnum = /^\d+$/.test(possible_n);

            if (!isnum) {
                return false;
            }
        }

        return true;
    })();

    if (!is_numbering) {
        return s;
    }

    return "# " + tokens.slice(2).join(" ");
}