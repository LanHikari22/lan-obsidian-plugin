import {
	Editor,
	MarkdownView,
    Notice,
    TFile,
} from "obsidian";

import * as notecluster from "./notecluster";
import * as notecluster_io from "./notecluster_io";
import * as comm from "./common";

async function run_common(_editor: Editor, view: MarkdownView, core_file: notecluster.CoreFile, cluster_folder: notecluster.ClusterFolder): Promise<boolean> {
    // We're re-generating headers "Index" and "Spawn Trees". Delete them from the file if they exist

    await notecluster_io.delete_index_and_spawn_trees_headings(core_file.file);

    let res_index_content = notecluster.compute_index_for_cluster(view, cluster_folder);
    if (res_index_content instanceof comm.IError) {
        console.log(`Error: ${res_index_content.to_str()}`);
        new Notice(`Error: Failed to compute index content`);
        return false;
    }
    let index_content = res_index_content;

    let res_spawn_trees_content = notecluster.compute_spawn_trees_for_cluster(view, cluster_folder);
    if (res_spawn_trees_content instanceof comm.IError) {
        console.log(`Error: ${res_spawn_trees_content.to_str()}`);
        new Notice(`Error: Failed to compute spawn trees content`);
        return false;
    }
    let spawn_trees_content = res_spawn_trees_content;

    const combined_content = "\n" + spawn_trees_content.trim() + "\n\n" + index_content.trim();

    await comm.append_content_to_file(core_file.file, combined_content);

    return true;
}

export async function run(editor: Editor, view: MarkdownView) {
    let opt_core_file = notecluster.get_current_core_file(view);
    if (opt_core_file == undefined) {
        new Notice(`Error: Please use this command from within a note cluster`);
        return;
    }
    let core_file = opt_core_file;

    let opt_cluster_folder_folder = core_file.file.parent;
    if (opt_cluster_folder_folder == undefined) {
        new Notice(`Error: Failed to retrieve cluster folder`);
        return;
    }
    let cluster_folder_folder = opt_cluster_folder_folder

    let opt_cluster_folder = notecluster.ClusterFolder.new(cluster_folder_folder);
    if (opt_cluster_folder == undefined) {
        new Notice(`Error: Failed to retrieve cluster folder`);
        return;
    }
    let cluster_folder = opt_cluster_folder;

    let success = await run_common(editor, view, core_file, cluster_folder);

    if (!success) {
        return;
    }
}

export async function run_all(editor: Editor, view: MarkdownView) {
    let cluster_folders = notecluster.get_all_cluster_folders_in_vault(view);

    for (var i=0; i<cluster_folders.length; i++) {
        let cluster_folder = cluster_folders[i];

        let opt_core_file_file = notecluster.get_core_file_from_cluster_folder(cluster_folder.folder);
        if (opt_core_file_file == undefined) {
            new Notice(`Error: Failed to retrieve core file`);
            return;
        }
        let core_file_file = opt_core_file_file;

        let opt_core_file = notecluster.CoreFile.new(core_file_file);
        if (opt_core_file == undefined) {
            new Notice(`Error: Not a valid core file`);
            return;
        }
        let core_file = opt_core_file;

        let success = await run_common(editor, view, core_file, cluster_folder);

        if (!success) {
            return;
        }
    }

}