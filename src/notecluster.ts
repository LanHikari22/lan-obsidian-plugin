import { MarkdownView, TFile, TFolder } from "obsidian";

import * as comm from "./common";

export const CONTEXT_TYPE_FOLDERS = [
	"entries",
	"howtos",
	"ideas",
	"inferences",
	"investigations",
	"issues",
	"tasks",
];

export const CONTEXT_TYPE_BLOCK_IDENTIFIER_CODE = [
	"entry",
	"howto",
	"idea",
	"infer",
	"invst",
	"issue",
	"task",
];

export const CONTEXT_TYPE_HEADINGS_SINGULAR = [
	"Entry",
	"HowTo",
	"Idea",
	"Inference",
	"Investigation",
	"Issue",
	"Task",
];


export const CONTEXT_TYPE_HEADINGS = [
	"Entries",
	"HowTos",
	"Ideas",
	"Inferences",
	"Investigations",
	"Issues",
	"Tasks",
];

export function context_type_singular_convert(
	context_type: string,
    new_type_strings: string[]
): string | undefined {
	const index = CONTEXT_TYPE_HEADINGS_SINGULAR.findIndex((elem) => elem === context_type);
	if (index == -1) {
		return undefined;
	}

	if (index < 0 || index >= new_type_strings.length) {
		console.log(
			`Error: Unexpected value for ${index} for context type lookup`
		);
        return undefined;
	}

	return new_type_strings[index];
}

export function context_type_heading_singular_is_doer(heading: string): boolean {
    const doers = [
        // "Entry",
        "HowTo",
        // "Idea",
        // "Inference",
        "Investigation",
        "Issue",
        "Task",
    ];

    return doers.contains(heading);
}

export function folder_has_note_of_same_name(folder: TFolder): boolean {
	for (var i = 0; i < folder.children.length; i++) {
		const child = folder.children[i];

		if (child instanceof TFile) {
			if (folder.name == child.basename) {
				return true;
			}
		}
	}

	return false;
}

export function is_cluster_root_folder(folder: TFolder): boolean {
	if (
		!folder_has_note_of_same_name(folder) ||
		comm.get_folder_child_file_count_non_recursive(folder) != 1
	) {
		return false;
	}

	return true;
}

export function is_cluster_category_folder(folder: TFolder): boolean {
	if (!CONTEXT_TYPE_FOLDERS.includes(folder.name)) {
		return false;
	}

	const opt_parent = folder.parent;
	if (!opt_parent) {
		return false;
	}
	const parent = opt_parent;

	if (!is_cluster_root_folder(parent)) {
		return false;
	}

	return true;
}

/// Checks that the given file complies with the expected folder structure.
/// and is its root file.
/// See ^concept-cluster-root-folder-structure in docs/spec.md
export function is_cluster_root_file(file: TFile): boolean {
	const opt_parent = file.parent;
	if (!opt_parent) {
		return false;
	}
	const parent = opt_parent;

	if (!is_cluster_root_folder(parent)) {
		return false;
	}

	if (parent.name != file.basename) {
		return false;
	}

	return true;
}

export function get_cluster_core_file_from_peripheral(
	view: MarkdownView,
	peripheral_file: TFile
): TFile | undefined {
	const opt_parent_file = comm.get_file_frontmatter_note_property(
		view,
		peripheral_file,
		"parent"
	);
	if (!opt_parent_file) {
        console.log(`Error: Could not retrieve frontmatter note property parent for ${peripheral_file.name}`);
		return undefined;
	}
	const parent_file = opt_parent_file;

	if (!is_cluster_root_file(parent_file)) {
        console.log(`Error: ${parent_file.name} is not a bignote index file`);
		return undefined;
	}

	return parent_file;
}

export function get_cluster_core_file_from_cluster_root_folder(folder: TFolder): TFile | undefined {
    if (!is_cluster_root_folder(folder)) {
        console.log(`Error: Expected ${folder.name} to be a bignote root folder`);
        return undefined;
    }

    for (var i=0; i<folder.children.length; i++) {
        const child = folder.children[i];

        if (child instanceof TFile && child.basename == folder.name) {
            return child;
        }
    }

    console.log(`Assertion Failed: No index file found in bignote root folder`);
    return undefined;
}

/// Checks that the given file complies with the expected folder structure.
/// and is a small note in it, so it complies with ^concept-small-note-content-requirements
export function is_cluster_non_index_file(
	view: MarkdownView,
	file: TFile
): boolean {
	const opt_parent = file.parent;
	if (!opt_parent) {
        console.log(`Error: Failed to retrieve parent folder for ${file.name}`);
		return false;
	}
	const parent_folder = opt_parent;

	if (!is_cluster_category_folder(parent_folder)) {
        console.log(`Error: ${parent_folder.name} is not a bignote category folder`);
		return false;
	}

	const opt_parent_file = get_cluster_core_file_from_peripheral(view, file);
	if (!opt_parent_file) {
        console.log(`Error: Could not get big note index file for ${file.name}`);
		return false;
	}
	const parent_file = opt_parent_file;

	const opt_grandparent_folder = parent_folder.parent;
	if (!opt_grandparent_folder) {
        console.log(`Error: Could not get grandparent for ${file.name}`);
		return false;
	}
	const grandparent_folder = opt_grandparent_folder;

	if (grandparent_folder != parent_file.parent) {
        console.log(`Error: Expected grandparent ${grandparent_folder.name} to be identical to parent folder of ${parent_file.path}`);
		return false;
	}

	return true;
}

export function display_triplet_id(id: number): string  {
    if (id < 10) {
        return "00" + id.toString();
    } else if (id < 100) {
        return "0" + id.toString();
    } else {
        return id.toString();
    }
}

export function get_next_triplet_id_for_folder(
	context_folder_name: string,
	index_file: TFile
): string | undefined {
	if (!CONTEXT_TYPE_FOLDERS.includes(context_folder_name)) {
		return undefined;
	}

    const opt_bignote_root_folder = index_file.parent;
    if (!opt_bignote_root_folder) {
        return undefined;
    }
    const bignote_root_folder = opt_bignote_root_folder;

    const opt_context_folder = comm.get_child_folder_by_name(bignote_root_folder, context_folder_name);
    if (!opt_context_folder) {
        return undefined;
    }
    const context_folder = opt_context_folder;

    const num_files_in_context_folder = comm.get_folder_child_file_count_non_recursive(context_folder);

    return display_triplet_id(num_files_in_context_folder);
}

export function get_all_index_folders_in_vault(view: MarkdownView): TFolder[] {
    const folders = view.app.vault.getAllFolders(false)
        .filter((folder) => is_cluster_root_folder(folder));

    return folders;
}