import {
	Editor,
	MarkdownView,
    Notice,
    TFile,
} from "obsidian";

import * as notecluster from "./notecluster";
import * as notecluster_io from "./notecluster_io";
import * as comm from "./common";

export async function run(editor: Editor, view: MarkdownView) {
    let opt_core_file = notecluster.get_current_core_file(view);
    if (!opt_core_file) {
        new Notice(`Error: Please use this command from within a note cluster`);
        return;
    }
    let core_file = opt_core_file;

    let opt_cluster_folder_folder = core_file.parent;
    if (!opt_cluster_folder_folder) {
        new Notice(`Error: Failed to retrieve cluster folder`);
        return;
    }
    let cluster_folder_folder = opt_cluster_folder_folder

    let opt_cluster_folder = notecluster.ClusterFolder.new(cluster_folder_folder);
    if (!opt_cluster_folder) {
        new Notice(`Error: Failed to retrieve cluster folder`);
        return;
    }
    let cluster_folder = opt_cluster_folder;

    // We're re-generating headers "Index" and "Spawn Trees". Delete them from the file if they exist

    await notecluster_io.delete_index_and_spawn_trees_headings(core_file);

    let res_index_content = notecluster.compute_index_for_cluster(view, cluster_folder);
    if (res_index_content instanceof comm.IError) {
        console.log(`Error: ${res_index_content.to_str()}`);
        new Notice(`Error: Failed to compute index content`);
        return;
    }
    let index_content = res_index_content;
    await comm.append_content_to_file(core_file, index_content);

    // let res_spawn_trees_content = notecluster.compute_spawn_trees_for_cluster(view, cluster_folder);
    // if (res_spawn_trees_content instanceof comm.IError) {
    //     console.log(`Error: ${res_spawn_trees_content.to_str()}`);
    //     new Notice(`Error: Failed to compute spawn trees content`);
    //     return;
    // }
    // let spawn_trees_content = res_spawn_trees_content;

    // const combined_content = index_content + "\n" + spawn_trees_content;

    // await comm.append_content_to_file(core_file, combined_content);
}