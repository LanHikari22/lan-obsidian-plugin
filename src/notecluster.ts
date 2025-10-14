import { MarkdownView, TFile, TFolder } from "obsidian";

import * as comm from "./common";

export const CONTEXT_TYPE_FOLDERS = [
	"concepts",
	"entries",
	"howtos",
	"ideas",
	"inferences",
	"investigations",
	"issues",
	"judgments",
	"tasks",
];

export const CONTEXT_TYPE_BLOCK_IDENTIFIER_CODE = [
	"cncpt",
	"entry",
	"howto",
	"idea",
	"infer",
	"invst",
	"issue",
	"jdgmt",
	"task",
];

export const CONTEXT_TYPE_HEADINGS_SINGULAR = [
	"Concept",
	"Entry",
	"HowTo",
	"Idea",
	"Inference",
	"Investigation",
	"Issue",
	"Judgment",
	"Task",
];

export const CONTEXT_TYPE_HEADINGS = [
	"Concepts",
	"Entries",
	"HowTos",
	"Ideas",
	"Inferences",
	"Investigations",
	"Issues",
	"Judgments",
	"Tasks",
];

export enum ContextType {
	Concept,
	Entry,
	HowTo,
	Idea,
	Inference,
	Investigation,
	Issue,
	Judgment,
	Task,
}

export function context_type_from_singular(s: string): ContextType | undefined {
	let s_lower = s.toLowerCase();

	if (s_lower === "concept") {
		return ContextType.Concept;
	} else if (s_lower === "entry") {
		return ContextType.Entry;
	} else if (s_lower === "howto") {
		return ContextType.HowTo;
	} else if (s_lower === "idea") {
		return ContextType.Idea;
	} else if (s_lower === "inference") {
		return ContextType.Inference;
	} else if (s_lower === "investigation") {
		return ContextType.Investigation;
	} else if (s_lower === "issue") {
		return ContextType.Issue;
	} else if (s_lower === "Judgment") {
		return ContextType.Judgment;
	} else if (s_lower === "Task") {
		return ContextType.Task;
	} else {
		return undefined;
	}
}

export function context_type_to_str(
	context_type: ContextType
): string | undefined {
	switch (context_type) {
		case ContextType.Concept:
			return "concept";
		case ContextType.Entry:
			return "entry";
		case ContextType.HowTo:
			return "howto";
		case ContextType.Idea:
			return "idea";
		case ContextType.Inference:
			return "inference";
		case ContextType.Investigation:
			return "investigation";
		case ContextType.Issue:
			return "issue";
		case ContextType.Judgment:
			return "judgment";
		case ContextType.Task:
			return "task";
		default:
			return undefined;
	}
}

export function context_type_singular_convert(
	context_type: string,
	new_type_strings: string[]
): string | undefined {
	const index = CONTEXT_TYPE_HEADINGS_SINGULAR.findIndex(
		(elem) => elem === context_type
	);
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

export function context_type_heading_singular_is_doer(
	heading: string
): boolean {
	const doers = [
		// "Concept",
		// "Entry",
		"HowTo",
		// "Idea",
		"Inference",
		"Investigation",
		"Issue",
		"Judgment",
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

export function is_cluster_folder(folder: TFolder): boolean {
	if (
		!folder_has_note_of_same_name(folder) ||
		comm.get_folder_child_file_count_non_recursive(folder) != 1
	) {
		return false;
	}

	return true;
}

export class ClusterFolder {
	folder: TFolder;

	static new(folder: TFolder): ClusterFolder | undefined {
		if (is_cluster_folder(folder)) {
			var res = new ClusterFolder();
			res.folder = folder;
			return res;
		} else {
			return undefined;
		}
	}
}

export function is_category_folder(folder: TFolder): boolean {
	if (!CONTEXT_TYPE_FOLDERS.includes(folder.name)) {
		return false;
	}

	const opt_parent = folder.parent;
	if (!opt_parent) {
		return false;
	}
	const parent = opt_parent;

	if (!is_cluster_folder(parent)) {
		return false;
	}

	return true;
}

export class CategoryFolder {
	folder: TFolder;

	static new(folder: TFolder): CategoryFolder | undefined {
		if (is_category_folder(folder)) {
			var res = new CategoryFolder();
			res.folder = folder;
			return res;
		} else {
			return undefined;
		}
	}
}

/// Checks that the given file complies with the expected folder structure.
/// and is its root file.
/// See ^concept-cluster-folder-structure in docs/spec.md
export function is_core_file(file: TFile): boolean {
	const opt_parent = file.parent;
	if (!opt_parent) {
		return false;
	}
	const parent = opt_parent;

	if (!is_cluster_folder(parent)) {
		return false;
	}

	if (parent.name != file.basename) {
		return false;
	}

	return true;
}

export class CoreFile {
	file: TFile;

	static new(file: TFile): CoreFile | undefined {
		if (is_core_file(file)) {
			var res = new CoreFile();
			res.file = file;
			return res;
		} else {
			return undefined;
		}
	}
}

export function get_core_file_from_peripheral_file(
	view: MarkdownView,
	peripheral_file: TFile
): TFile | undefined {
	let res_parent_file = comm.get_file_frontmatter_note_property(
		view,
		peripheral_file,
		"parent"
	);
	if (res_parent_file instanceof comm.IError) {
		console.log(
			`Error: Could not retrieve frontmatter note property parent for ${
				peripheral_file.name
			}: ${res_parent_file.to_str()}`
		);
		return undefined;
	}
	const parent_file = res_parent_file;

	if (!is_core_file(parent_file)) {
		console.log(`Error: ${parent_file.name} is not a bignote index file`);
		return undefined;
	}

	return parent_file;
}

export function get_core_file_from_cluster_root_folder(
	folder: TFolder
): TFile | undefined {
	if (!is_cluster_folder(folder)) {
		console.log(
			`Error: Expected ${folder.name} to be a bignote root folder`
		);
		return undefined;
	}

	for (var i = 0; i < folder.children.length; i++) {
		const child = folder.children[i];

		if (child instanceof TFile && child.basename == folder.name) {
			return child;
		}
	}

	console.log(`Assertion Failed: No index file found in bignote root folder`);
	return undefined;
}

export function get_current_core_file(view: MarkdownView): TFile | undefined {
	const opt_cur_file = view.file;

	if (!opt_cur_file) {
		return undefined;
	}

	const cur_file = opt_cur_file;

	if (is_core_file(cur_file)) {
		return cur_file;
	} else if (is_peripheral_file(view, cur_file)) {
		return get_core_file_from_peripheral_file(view, cur_file);
	} else {
		return undefined;
	}
}

/// Checks that the given file complies with the expected folder structure.
/// and is a peripheral note in it, so it complies with ^concept-peripheral-note-content-requirements in docs/spec.md
export function is_peripheral_file(view: MarkdownView, file: TFile): boolean {
	const opt_parent = file.parent;
	if (!opt_parent) {
		console.log(`Error: Failed to retrieve parent folder for ${file.name}`);
		return false;
	}
	const parent_folder = opt_parent;

	if (!is_category_folder(parent_folder)) {
		console.log(
			`Error: ${parent_folder.name} is not a bignote category folder`
		);
		return false;
	}

	const opt_parent_file = get_core_file_from_peripheral_file(view, file);
	if (!opt_parent_file) {
		console.log(
			`Error: Could not get big note index file for ${file.name}`
		);
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
		console.log(
			`Error: Expected grandparent ${grandparent_folder.name} to be identical to parent folder of ${parent_file.path}`
		);
		return false;
	}

	return true;
}

export class PeripheralFile {
	file: TFile;

	static new(view: MarkdownView, file: TFile): PeripheralFile | undefined {
		if (is_peripheral_file(view, file)) {
			var res = new PeripheralFile();
			res.file = file;
			return res;
		} else {
			return undefined;
		}
	}
}

export enum NoteStatus {
	Todo,
	Paused,
	Blocked,
	Rejected,
	Done,
}

export function note_status_from_str(s: string): NoteStatus | undefined {
	let s_lower = s.toLowerCase();

	if (s_lower === "todo") {
		return NoteStatus.Todo;
	} else if (s_lower === "paused") {
		return NoteStatus.Paused;
	} else if (s_lower === "blocked") {
		return NoteStatus.Blocked;
	} else if (s_lower === "rejected") {
		return NoteStatus.Rejected;
	} else if (s_lower === "done") {
		return NoteStatus.Done;
	} else {
		console.log(`"${s}" "${s_lower}" howwwww`);
		return undefined;
	}
}

export function note_status_to_str(status: NoteStatus): string | undefined {
	switch (status) {
		case NoteStatus.Todo:
			return "todo";
		case NoteStatus.Paused:
			return "paused";
		case NoteStatus.Blocked:
			return "blocked";
		case NoteStatus.Rejected:
			return "rejected";
		case NoteStatus.Done:
			return "done";
		default:
			return undefined;
	}
}

export enum CompletePeripheralFileErrorType {
	NotAPeripheralFile, // (TFile)
	NoParentProp, // (TFile, GetFileFrontmatterNotePropertyError)
	NoContextTypeProp, // (TFile, GetFrontmatterNotePropertyError)
	InvalidContextType, // (TFile, string)
	InvalidNoteStatus, // (TFile, string)
}

export class CompletePeripheralFileError extends comm.IError<CompletePeripheralFileErrorType> {
	to_str(): string {
		switch (this.type) {
			case CompletePeripheralFileErrorType.NotAPeripheralFile:
				return `Not a peripheral file: "${this.data[0]}"`;
			case CompletePeripheralFileErrorType.NoParentProp:
				return `Peripheral ${
					this.data[0].name
				} does not have a parent: ${this.data[1].to_str()}`;
			case CompletePeripheralFileErrorType.NoContextTypeProp:
				return `Peripheral "${
					this.data[0].name
				}" does not have a context type: ${this.data[1].to_str()}`;
			case CompletePeripheralFileErrorType.InvalidContextType:
				return `Peripheral "${this.data[0].name}" has an invalid context type: "${this.data[1]}"`;
			case CompletePeripheralFileErrorType.InvalidNoteStatus:
				return `Peripheral "${this.data[0].name}" has an invalid status: "${this.data[1]}"`;
			default:
				return `Unhandled Error Type`;
		}
	}
}

export class CompletePeripheralFile {
	file: TFile;
	parent: TFile;
	opt_spawner: TFile | undefined;
	context_type: ContextType;
	opt_status: NoteStatus | undefined;

	static new(
		view: MarkdownView,
		file: TFile
	): CompletePeripheralFile | CompletePeripheralFileError {
		let FnErr = CompletePeripheralFileError;
		let FnErrTy = CompletePeripheralFileErrorType;

		if (!is_peripheral_file(view, file)) {
			return new FnErr(FnErrTy.NotAPeripheralFile, [file]);
		}

		let res_parent = comm.get_file_frontmatter_note_property(
			view,
			file,
			"parent"
		);
		if (res_parent instanceof comm.IError) {
			return new FnErr(FnErrTy.NoParentProp, [file, res_parent]);
		}
		let parent = res_parent;

		let res_spawner = comm.get_file_frontmatter_note_property(
			view,
			file,
			"spawned_by"
		);
		let opt_spawner: TFile | undefined;
		if (res_spawner instanceof comm.IError) {
			opt_spawner = undefined;
		} else {
			opt_spawner = res_spawner;
		}

		let res_context_type_s = comm.get_frontmatter_note_property(
			view,
			file,
			"context_type"
		);
		if (res_context_type_s instanceof comm.IError) {
			return new FnErr(FnErrTy.NoContextTypeProp, [
				file,
				res_context_type_s,
			]);
		}
		let context_type_s = res_context_type_s;

		let opt_context_type = context_type_from_singular(context_type_s);
		if (!opt_context_type) {
			return new FnErr(FnErrTy.InvalidContextType, [
				file,
				context_type_s,
			]);
		}
		let context_type = opt_context_type;

		let res_status_s = comm.get_frontmatter_note_property(
			view,
			file,
			"status"
		);

		let opt_status: NoteStatus | undefined;
		if (res_status_s instanceof comm.IError) {
			opt_status = undefined;
		} else {
			let opt_status1 = note_status_from_str(res_status_s);
			if (!opt_status1) {
				return new FnErr(FnErrTy.InvalidNoteStatus, [
					file,
					res_status_s,
				]);
			}
			opt_status = opt_status1;
		}

		var res = new CompletePeripheralFile();
		res.file = file;
		res.parent = parent;
		res.opt_spawner = opt_spawner;
		res.context_type = context_type;
		res.opt_status = opt_status;
		return res;
	}
}

export function display_triplet_id(id: number): string {
	if (id < 10) {
		return "00" + id.toString();
	} else if (id < 100) {
		return "0" + id.toString();
	} else {
		return id.toString();
	}
}

export enum GetNextTripletIdForFolderErrorType {
	NotAContextFolder,
	NoParentForCorefile,
	InvalidContextFolder,
}

export class GetNextTripletIdForFolderError extends comm.IError<GetNextTripletIdForFolderErrorType> {
	to_str(): string {
		let FnErrTy = GetNextTripletIdForFolderErrorType;

		if (this.type == FnErrTy.InvalidContextFolder) {
			return `Not a context folder: ${this.data[0]}`;
		} else if (this.type == FnErrTy.NoParentForCorefile) {
			return `No parent for core file ${this.data[0]}`;
		} else if (this.type == FnErrTy.NotAContextFolder) {
			return `No context folder for ${this.data[0]}`;
		} else {
			return "Unhandled error type";
		}
	}
}

export function get_next_triplet_id_for_folder(
	context_folder_name: string,
	core_file: TFile
): string | GetNextTripletIdForFolderError {
	let FnErr = GetNextTripletIdForFolderError;
	let FnErrTy = GetNextTripletIdForFolderErrorType;

	if (!CONTEXT_TYPE_FOLDERS.includes(context_folder_name)) {
		return new FnErr(FnErrTy.InvalidContextFolder, [context_folder_name]);
	}

	const opt_cluster_folder = core_file.parent;
	if (!opt_cluster_folder) {
		return new FnErr(FnErrTy.NoParentForCorefile, [core_file]);
	}
	const cluster_folder = opt_cluster_folder;

	const opt_context_folder = comm.get_child_folder_by_name(
		cluster_folder,
		context_folder_name
	);
	if (!opt_context_folder) {
		return new FnErr(FnErrTy.NotAContextFolder, [context_folder_name]);
	}
	const context_folder = opt_context_folder;

	const num_files_in_context_folder =
		comm.get_folder_child_file_count_non_recursive(context_folder);

	return display_triplet_id(num_files_in_context_folder);
}

export function get_all_cluster_folders_in_vault(
	view: MarkdownView
): ClusterFolder[] {
	const folders = view.app.vault
		.getAllFolders(false)
		.map((folder) => ClusterFolder.new(folder))
		.filter((folder) => folder != undefined)
		.map((folder) => folder as ClusterFolder);

	return folders;
}

export enum GetallCategoryFoldersForClusterErrorType {
	NonCategoryFolderInCluster, // (TFolder, ClusterFolder)
}

export class GetallCategoryFoldersForClusterError extends comm.IError<GetallCategoryFoldersForClusterErrorType> {
	to_str(): string {
		let FnErrTy = GetallCategoryFoldersForClusterErrorType;

		switch (this.type) {
			case FnErrTy.NonCategoryFolderInCluster:
				return `Non Category Folder ${this.data[0]} found in cluster ${this.data[1]}`;
			default:
				return `Invalid Error Type`;
		}
	}
}

export function get_all_category_folders_for_cluster(
	cluster_folder: ClusterFolder
): CategoryFolder[] | GetallCategoryFoldersForClusterError {
	let FnErrTy = GetallCategoryFoldersForClusterErrorType;
	let FnErr = GetallCategoryFoldersForClusterError;

	var mut_results = [];

	for (var i = 0; i < cluster_folder.folder.children.length; i++) {
		const child = cluster_folder.folder.children[i];

		if (child instanceof TFolder) {
			let opt_category_folder = CategoryFolder.new(child);
			if (!opt_category_folder) {
				return new FnErr(FnErrTy.NonCategoryFolderInCluster, [
					child,
					cluster_folder,
				]);
			}
			let category_folder = opt_category_folder;

			mut_results.push(category_folder);
		}
	}

	return mut_results;
}

export enum GetAllCompletePeripheralFilesForClusterErrorType {
	FailedToGetCategoryFolders, // (GetallCategoryFoldersForClusterError)
	CategoryFolderContainsNonFiles, // (CategoryFolder)
	InvalidCompletePeripheralFile, // (CategoryFolder, CompletePeripheralFileError)
}

export class GetAllCompletePeripheralFilesForClusterError extends comm.IError<GetAllCompletePeripheralFilesForClusterErrorType> {
	to_str(): string {
		let FnErrTy = GetAllCompletePeripheralFilesForClusterErrorType;

		switch (this.type) {
			case FnErrTy.FailedToGetCategoryFolders:
				return `Failed to get category folders: ${this.data[0]}`;
			case FnErrTy.CategoryFolderContainsNonFiles:
				return `Category folder ${this.data[0]} contains non files`;
			case FnErrTy.InvalidCompletePeripheralFile:
				return `Not a valid complete peripheral file in Category folder ${
					this.data[0].folder.name
				}: ${this.data[1].to_str()}`;
			default:
				return `Unhandled Error Type`;
		}
	}
}

export function get_all_complete_peripheral_files_for_cluster(
	view: MarkdownView,
	cluster_folder: ClusterFolder
): CompletePeripheralFile[] | GetAllCompletePeripheralFilesForClusterError {
	let FnErrTy = GetAllCompletePeripheralFilesForClusterErrorType;
	let FnErr = GetAllCompletePeripheralFilesForClusterError;

	let res_category_folders =
		get_all_category_folders_for_cluster(cluster_folder);
	if (res_category_folders instanceof comm.IError) {
		return new FnErr(FnErrTy.FailedToGetCategoryFolders, [
			res_category_folders,
		]);
	}
	let category_folders = res_category_folders;

	var mut_results = [];

	for (var i = 0; i < category_folders.length; i++) {
		let category_folder = category_folders[i];

		for (var j = 0; j < category_folder.folder.children.length; j++) {
			const child = category_folder.folder.children[j];

			if (child instanceof TFile) {
				let res_peripheral_file = CompletePeripheralFile.new(
					view,
					child
				);
				if (res_peripheral_file instanceof comm.IError) {
					return new FnErr(FnErrTy.InvalidCompletePeripheralFile, [
						category_folder,
						res_peripheral_file,
					]);
				}
				let periphreal_file = res_peripheral_file;

				mut_results.push(periphreal_file);
			} else {
				return new FnErr(FnErrTy.CategoryFolderContainsNonFiles, [
					category_folder,
				]);
			}
		}
	}

	return mut_results;
}

export function is_markdown_file(file: TFile): boolean {
	return file.extension == "md";
}

export class MarkdownFile {
	file: TFile;

	static new(file: TFile): MarkdownFile | undefined {
		if (is_markdown_file(file)) {
			var res = new MarkdownFile();
			res.file = file;
			return res;
		} else {
			return undefined;
		}
	}
}

export type NoteFile = MarkdownFile | CoreFile | PeripheralFile;

export enum ComputeIndexForClusterInternalErrorType {
	FailedToDisplayStatus,
	FailedToDisplayContextType,
}

export class ComputeIndexForClusterInternalError extends comm.IError<ComputeIndexForClusterInternalErrorType> {
	to_str(): string {
		switch (this.type) {
			case ComputeIndexForClusterInternalErrorType.FailedToDisplayStatus:
				return `Status invariants must guarantee display`;
			case ComputeIndexForClusterInternalErrorType.FailedToDisplayContextType:
				return `Context Type invariants must guarantee display`;
			default:
				return `Unhandled InternalError Type`;
		}
	}
}

export enum ComputeIndexForClusterErrorType {
	FailedToGetPeripherals, // (IError)
	InternalError, // (IError)
}

export class ComputeIndexForClusterError extends comm.IError<ComputeIndexForClusterErrorType> {
	to_str(): string {
		switch (this.type) {
			case ComputeIndexForClusterErrorType.FailedToGetPeripherals:
				return `Failed to get peripherals: ${this.data[0].to_str()}`;
			case ComputeIndexForClusterErrorType.InternalError:
				return `Internal Error: ${this.data[0].to_str()}`;
			default:
				return `Unhandled Error Type`;
		}
	}
}

export function compute_index_for_cluster(
	view: MarkdownView,
	cluster_folder: ClusterFolder
): string | ComputeIndexForClusterError {
	let FnErr = ComputeIndexForClusterError;
	let FnErrTy = ComputeIndexForClusterErrorType;
	let IntFnErr = ComputeIndexForClusterInternalError;
	let IntFnErrTy = ComputeIndexForClusterInternalErrorType;

	let res_peripheral_files = get_all_complete_peripheral_files_for_cluster(
		view,
		cluster_folder
	);
	if (res_peripheral_files instanceof comm.IError) {
		return new FnErr(FnErrTy.FailedToGetPeripherals, [
			res_peripheral_files,
		]);
	}
	let peripheral_files = res_peripheral_files;

	var mut_result = "# Index\n\n";
	var mut_last_context_type_s = "";

	for (var i = 0; i < peripheral_files.length; i++) {
		let file = peripheral_files[i];

		let status_s = (() => {
			if (file.opt_status) {
				let opt_status_s = note_status_to_str(file.opt_status);
				if (!opt_status_s) {
					return new FnErr(FnErrTy.InternalError, [
						new IntFnErr(IntFnErrTy.FailedToDisplayStatus, []),
					]);
				}
				return opt_status_s.replace("done", "");
			} else {
				return "";
			}
		})();

		let opt_context_type_s = context_type_to_str(file.context_type);
		if (!opt_context_type_s) {
			return new FnErr(FnErrTy.InternalError, [
				new IntFnErr(IntFnErrTy.FailedToDisplayContextType, []),
			]);
		}
		let context_type_s = opt_context_type_s;

		if (context_type_s != mut_last_context_type_s) {
			mut_result += `**${context_type_s}**\n\n`;

			mut_last_context_type_s = context_type_s;
		}

		if (status_s != "") {
			mut_result += `${status_s} [[${file.file.name}]]\n\n`;
		} else {
			mut_result += `[[${file.file.name}]]\n\n`;
		}
	}

	return mut_result;
}

class NoteFileWithSpawned {
	file: NoteFile;
	spawned: NoteFile[];

	constructor(file: NoteFile) {
		this.file = file;
		this.spawned = [];
	}
}

export enum GetAllNotesWithChildrenForClusterErrorType {
	FailedToGetPeripheralFiles, // (IError)
	DuplicateSpawned, // (CompletePeripheralFile)
	InvalidSpawnerForPeripheral, // (CompletePeripheralFile)
}

export class GetAllNotesWithChildrenForClusterError extends comm.IError<GetAllNotesWithChildrenForClusterErrorType> {
	to_str(): string {
		let FnErrTy = GetAllNotesWithChildrenForClusterErrorType;

		switch (this.type) {
			case FnErrTy.FailedToGetPeripheralFiles:
				return `Failed to get peripheral files: ${this.data[0].to_str()}`;
			case FnErrTy.DuplicateSpawned:
				return `Duplicate Child: ${
					(this.data[0] as CompletePeripheralFile).file.name
				}`;
			case FnErrTy.InvalidSpawnerForPeripheral:
				return `Peripheral file ${
					(this.data[0] as CompletePeripheralFile).file.name
				} has an invalid parent`;
			default:
				return `Invalid Error Type`;
		}
	}
}

export function get_all_notes_with_spawned_for_cluster(
	view: MarkdownView,
	cluster_folder: ClusterFolder
): NoteFileWithSpawned[] | GetAllNotesWithChildrenForClusterError {
	let FnErr = GetAllNotesWithChildrenForClusterError;
	let FnErrTy = GetAllNotesWithChildrenForClusterErrorType;

	let res_peripheral_files = get_all_complete_peripheral_files_for_cluster(
		view,
		cluster_folder
	);
	if (res_peripheral_files instanceof comm.IError) {
		return new FnErr(FnErrTy.FailedToGetPeripheralFiles, [
			res_peripheral_files,
		]);
	}
	let peripheral_files = res_peripheral_files;

	var mut_results: NoteFileWithSpawned[] = [];

	for (var i = 0; i < peripheral_files.length; i++) {
		let peripheral_file = peripheral_files[i];

		if (peripheral_file.opt_spawner) {
			let spawner = peripheral_file.opt_spawner;
			// Check if we already have the spawner
			let opt_spawner_with_spawned = mut_results.find(
				(note) => note.file.file.path === spawner.path
			);

			if (opt_spawner_with_spawned) {
				let spawner_with_spawned = opt_spawner_with_spawned;

				let spawned_already_exists = (() => {
					return (
						spawner_with_spawned.spawned.find(
							(note) =>
								note.file.path === peripheral_file.file.path
						) != undefined
					);
				})();

				if (spawned_already_exists) {
					return new FnErr(FnErrTy.DuplicateSpawned, [
						peripheral_file,
					]);
				}

				spawner_with_spawned.spawned.push(peripheral_file);
			} else {
				// We need to create a spawner
				let opt_spawner_note = (() => {
					let opt_core_file = CoreFile.new(spawner);
					if (opt_core_file) {
						return opt_core_file;
					}

					let res_peripheral_file = CompletePeripheralFile.new(
						view,
						spawner
					);
					if (res_peripheral_file instanceof CompletePeripheralFile) {
						return res_peripheral_file;
					}

					let opt_markdown_file = MarkdownFile.new(spawner);
					if (opt_markdown_file) {
						return opt_markdown_file;
					}

					return undefined;
				})();
				if (!opt_spawner_note) {
					return new FnErr(FnErrTy.InvalidSpawnerForPeripheral, [
						peripheral_file,
					]);
				}
				let spawner_note = opt_spawner_note;

				let spawner_with_spawned = new NoteFileWithSpawned(
					spawner_note
				);

				spawner_with_spawned.spawned.push(peripheral_file);

				mut_results.push(spawner_with_spawned);
			}
		} else {
			// There is no spawner, so just add this peripheral
			let res = new NoteFileWithSpawned(peripheral_file);
			mut_results.push(res);
		}
	}

	return mut_results;
}

export function get_spawn_roots(
	note_files: NoteFileWithSpawned[]
): NoteFileWithSpawned[] {
	var mut_results = [];

	for (var i = 0; i < note_files.length; i++) {
		let note_file1 = note_files[i];

		let is_spawned = (() => {
			for (var j = 0; j < note_files.length; j++) {
				let note_file2 = note_files[j];

				if (note_file1.file.file.path === note_file2.file.file.path) {
					return false;
				}
			}

			return true;
		})();

		if (!is_spawned) {
			mut_results.push(note_file1);
		}
	}

	return mut_results;
}

export enum DisplayNotefileForSpawnTreesInternalErrorType {
	FailedToDisplayStatus,
	FailedToDisplayContextType,
	InvalidNoteFile,
}

export class DisplayNotefileForSpawnTreesInternalError extends comm.IError<DisplayNotefileForSpawnTreesInternalErrorType> {
	to_str(): string {
		switch (this.type) {
			case DisplayNotefileForSpawnTreesInternalErrorType.FailedToDisplayStatus:
				return `Failed to display status`;
			case DisplayNotefileForSpawnTreesInternalErrorType.FailedToDisplayContextType:
				return `Failed to context type`;
			case DisplayNotefileForSpawnTreesInternalErrorType.InvalidNoteFile:
				return `Invalid note file`;
			default:
				return `Invalid Error Type`;
		}
	}
}

export function display_note_file_for_spawn_trees(
	note_file: NoteFileWithSpawned,
	indent_level: number
): string | DisplayNotefileForSpawnTreesInternalError {
	let FnIntErr = DisplayNotefileForSpawnTreesInternalError;
	let FnIntErrTy = DisplayNotefileForSpawnTreesInternalErrorType;

	let file = note_file.file;

	let tab_level_s = (() => {
		var mut_result = "";

		for (var i = 0; i < indent_level; i++) {
			mut_result += "  ";
		}

		return mut_result;
	})();

	if (file instanceof MarkdownFile) {
		return `${tab_level_s}- [[${file.file.name}]]`;
	} else if (file instanceof CoreFile) {
		return `[[${file.file.name}]]`;
	} else if (file instanceof CompletePeripheralFile) {
		if (file.opt_status) {
			let opt_status_s = note_status_to_str(file.opt_status);
			if (!opt_status_s) {
				return new FnIntErr(FnIntErrTy.FailedToDisplayStatus, []);
			}
			let status_s = opt_status_s.replace("done", "");

			let opt_context_type_s = context_type_to_str(file.context_type);
			if (!opt_context_type_s) {
				return new FnIntErr(FnIntErrTy.FailedToDisplayContextType, []);
			}
			let context_type_s = opt_context_type_s;

			if (status_s != "") {
				return `${tab_level_s}- ${status_s} ${context_type_s} [[${file.file.name}]]`;
			} else {
				return `${tab_level_s}- ${context_type_s} [[${file.file.name}]]`;
			}
		} else {
			let opt_context_type_s = context_type_to_str(file.context_type);
			if (!opt_context_type_s) {
				return new FnIntErr(FnIntErrTy.FailedToDisplayContextType, []);
			}
			let context_type_s = opt_context_type_s;

			return `${tab_level_s}- ${context_type_s} [[${file.file.name}]]`;
		}
	} else {
		return new FnIntErr(FnIntErrTy.InvalidNoteFile, []);
	}
}

export enum ComputeSpawnTreesForClusterRecursiveInternalErrorType {
	FailedToDisplayNoteFile, // (IError)
	NoteFileNotFound,
}

export class ComputeSpawnTreesForClusterRecursiveInternalError extends comm.IError<ComputeSpawnTreesForClusterRecursiveInternalErrorType> {
	to_str(): string {
		switch (this.type) {
			case ComputeSpawnTreesForClusterRecursiveInternalErrorType.FailedToDisplayNoteFile:
				return `Invariants for display must hold: ${this.data[0].to_str()}`;
			case ComputeSpawnTreesForClusterRecursiveInternalErrorType.NoteFileNotFound:
				return `All note files under consideration must be accounted for`;
			default:
				return `Invalid InternalError Type`;
		}
	}
}

export function compute_spawn_trees_for_cluster_recursive(
	indent_level: number,
	note_files: NoteFileWithSpawned[],
	cur_note_file: NoteFileWithSpawned
): string | ComputeSpawnTreesForClusterRecursiveInternalError {
	let IntFnErr = ComputeSpawnTreesForClusterRecursiveInternalError;
	let IntFnErrTy = ComputeSpawnTreesForClusterRecursiveInternalErrorType;

	var mut_result = "";

	let res_item_disp = display_note_file_for_spawn_trees(
		cur_note_file,
		indent_level
	);
	if (res_item_disp instanceof comm.IError) {
		return new IntFnErr(IntFnErrTy.FailedToDisplayNoteFile, [
			res_item_disp,
		]);
	}
	let item_disp = res_item_disp;

	mut_result += item_disp + "\n";

	for (var i = 0; i < cur_note_file.spawned.length; i++) {
		let opt_child = (() => {
			let child = cur_note_file.spawned[i];

			for (var j = 0; j < note_files.length; j++) {
				let note_file = note_files[j];

				if (child.file.path === note_file.file.file.path) {
					return note_file;
				}
			}

			return undefined;
		})();
		if (!opt_child) {
			return new IntFnErr(IntFnErrTy.NoteFileNotFound, []);
		}
		let child = opt_child;

		let res_disp = compute_spawn_trees_for_cluster_recursive(
			indent_level + 1,
			note_files,
			child
		);
		if (res_disp instanceof comm.IError) {
			return res_disp;
		}
		let disp = res_disp;

		mut_result += disp;
	}

	return mut_result;
}

export enum ComputeSpawnTreesForClusterInternalErrorType {
	RecursiveComputeError, // (ClusterFolder, IError)
}

export class ComputeSpawnTreesForClusterInternalError extends comm.IError<ComputeSpawnTreesForClusterInternalErrorType> {
	to_str(): string {
		switch (this.type) {
			case ComputeSpawnTreesForClusterInternalErrorType.RecursiveComputeError:
				return `Recursive Compute Error: ${
					(this.data[0] as ClusterFolder).folder.path
				}: ${this.data[1].to_str()}`;
			default:
				return `Unhandled Error Type`;
		}
	}
}

export enum ComputeSpawnTreesForClusterErrorType {
	FailedToProcessNoteFilesWithSpawned, // (ClusterFolder, IError)
	InternalError, // (IError)
}

export class ComputeSpawnTreesForClusterError extends comm.IError<ComputeSpawnTreesForClusterErrorType> {
	to_str(): string {
		switch (this.type) {
			case ComputeSpawnTreesForClusterErrorType.FailedToProcessNoteFilesWithSpawned:
				return `Failed to process notes with spawned in ${
					(this.data[0] as ClusterFolder).folder.path
				}: ${this.data[1].to_str()}`;
			case ComputeSpawnTreesForClusterErrorType.InternalError:
				return `Internal Error: ${this.data[0].to_str()}`;
			default:
				return `Unhandled Error Type`;
		}
	}
}

export function compute_spawn_trees_for_cluster(
	view: MarkdownView,
	cluster_folder: ClusterFolder
): string | ComputeSpawnTreesForClusterError {
	let FnErr = ComputeSpawnTreesForClusterError;
	let FnErrTy = ComputeSpawnTreesForClusterErrorType;
	let IntFnErr = ComputeSpawnTreesForClusterInternalError;
	let IntFnErrTy = ComputeSpawnTreesForClusterInternalErrorType;

	let res_note_files = get_all_notes_with_spawned_for_cluster(
		view,
		cluster_folder
	);
	if (res_note_files instanceof comm.IError) {
		return new FnErr(FnErrTy.FailedToProcessNoteFilesWithSpawned, [
			cluster_folder,
			res_note_files,
		]);
	}
	let note_files = res_note_files;

	let spawn_root_notes = get_spawn_roots(note_files);

	var mut_result = "# Spawn Tree\n\n";

	for (var i = 0; i < spawn_root_notes.length; i++) {
		let spawn_root_note = spawn_root_notes[i];

		let res_disp = compute_spawn_trees_for_cluster_recursive(
			0,
			note_files,
			spawn_root_note
		);
		if (res_disp instanceof comm.IError) {
			return new FnErr(FnErrTy.InternalError, [
				new IntFnErr(IntFnErrTy.RecursiveComputeError, [
					cluster_folder,
				]),
			]);
		}
		let disp = res_disp;

		mut_result += disp;
	}

	return mut_result;
}
