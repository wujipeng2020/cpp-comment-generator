import * as vscode from 'vscode';
import { ActiveEditor } from './active_editor';
export function activate(context: vscode.ExtensionContext) {
	let write_comments = vscode.commands.registerCommand('cpp-comment-generator.writeComments', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) { return; }
		let active_editor: ActiveEditor = new ActiveEditor(editor);
		if (active_editor.InvalidLanguage()) { return; }
		if (!active_editor.WriteComments()) {
			vscode.window.showInformationMessage('Comment generation failed!');
		}
	});
	context.subscriptions.push(write_comments);
}

export function deactivate() {
	vscode.window.showInformationMessage('Your extension "cpp-comment-generator" is now deactivated!');
}
