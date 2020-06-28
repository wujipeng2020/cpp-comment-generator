import * as vscode from 'vscode';
import { CppCommentGenerator } from './cpp_comment_generator';

async function showInputBox(context: vscode.ExtensionContext) {
	const result = await vscode.window.showInputBox({
		value: '',
		valueSelection: [2, 4],
		placeHolder: 'input author name',
		validateInput: text => {
			return null;
		}
	});
	let author = '';
	if(result){ author = result;}
	context.environmentVariableCollection.append('author_name', author);
	vscode.window.showInformationMessage(`CppCommentGenerator: author name changed to : ${result}`);
}

export function activate(context: vscode.ExtensionContext) {
	// generates comments for either class or function for the selected declaration
	let write_comments = vscode.commands.registerCommand('cpp-comment-generator.writeComments', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) { return; }
		const author_name_env = context.environmentVariableCollection.get('author_name');
		let author = '';
		if(author_name_env) {
			author = author_name_env.value;
		}
		let cpp_comment_generator: CppCommentGenerator = new CppCommentGenerator(editor, author);
		if (cpp_comment_generator.InvalidLanguage()) { return; }
		if (!cpp_comment_generator.WriteComments()) {
			vscode.window.showInformationMessage('Comment generation failed!');
		}
	});

	// set author name so we can generate class comments with author info 
	let config_author = vscode.commands.registerCommand('cpp-comment-generator.configAuthor', () => {
		showInputBox(context);
	});
	context.subscriptions.push(write_comments);
	context.subscriptions.push(config_author);
}


export function deactivate() {
	vscode.window.showInformationMessage('Your extension "cpp-comment-generator" is now deactivated!');
}
