import { TFile } from "obsidian";

import * as comm from "./common";

export async function delete_index_and_spawn_trees_headings(core_file: TFile) {
    const fs = core_file.vault.adapter;

    const content = await fs.read(core_file.path);

    // Note that this does not take into account index or spawn trees existing in codeblocks!
    const new_content = (() => {
        var mut_in_index_or_spawn_tree_heading = false;
        var mut_new_content = "";

        let lines = content.split("\n");

        for (var i=0; i<lines.length; i++) {
            let line = lines[i];
            let line_stripped = comm.strip_autonumbered_headers(line.trim());

            if (line_stripped === "# Index" || line_stripped === "# Spawn Trees") {
                mut_in_index_or_spawn_tree_heading = true;
            } else if (line_stripped.startsWith("# ")) {
                mut_in_index_or_spawn_tree_heading = false;
            }

            if (!mut_in_index_or_spawn_tree_heading) {
                mut_new_content += line + "\n";
            }
        }

        return mut_new_content;
    })();

    await fs.write(core_file.path, new_content);
}