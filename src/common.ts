import {
	Editor,
    FrontMatterCache,
    MarkdownView,
    TFile,
    TFolder,
} from "obsidian";

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

/// Gets a frontmatter property that points to a file if found
export function get_file_frontmatter_note_property(view: MarkdownView, file: TFile, prop: string): TFile | undefined {

    const opt_cache = view.app.metadataCache.getFileCache(file);
    if (!opt_cache) {
        console.log(`Error: Could not retrieve file cache for ${file.name}`);
        return undefined;
    }
    const cache = opt_cache;

    const opt_frontmatter = cache.frontmatter;
    if (!opt_frontmatter) {
        console.log(`Error: Could not retrieve frontmatter for ${file.name}`);
        return undefined;
    }
    const frontmatter: FrontMatterCache = opt_frontmatter;

    // this value could be anything but we expect a string
    const opt_value: string | undefined = frontmatter[prop];
    if (!opt_value) {
        console.log(`Error: Could not retrieve frontmatter property ${prop} for ${file.name}`);
        return undefined;
    }
    const value = opt_value.replace("[[", "").replace("]]", "");

    const opt_linked_file = file.vault.getMarkdownFiles().find(f => f.basename === value);
    if (!opt_linked_file) {
        console.log(`Error: Could not find file for link ${value}`);
        return undefined;
    }

    return opt_linked_file;
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