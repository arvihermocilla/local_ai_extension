// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const ollama = require('Ollama');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "local-ai" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	const disposable = vscode.commands.registerCommand('local-ai.start', function () {
		const panel = vscode.window.createWebviewPanel(
			'aiChat',
			'AI Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		)
		
		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async(message)=> {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = '';

				try {
					const streamResponse = await ollama.default.chat({
						model: 'codellama:7b', // best to use deepseek-r1:1.5b or other lightweight models
						messages: [{role:'user', content: userPrompt}],
						stream: true
					})

					for await (const part of streamResponse){
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				}
				catch(error){
					console.log('error here')
					panel.webview.postMessage({ command: 'chatResponse', text: 'Error:' + error.message})
				}
			}
		})
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

function getWebviewContent(){
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
		</head>
		<body>
			<h5>AI CHATBOX:</h5>
			<textarea id="prompt" name="largeText" class="form-control" rows="10" style="width: 100%; max-width: 800px;" placeholder="Prompt here..."></textarea><br>
			<button id="submitBtn" type="submit" class="btn btn-primary w-100">Submit</button>
			<div id="response"></div>

			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('submitBtn').addEventListener('click', () => {
					const text = document.getElementById('prompt').value;
					vscode.postMessage({ command: 'chat', text });
					console.log('should send message');
				});

				window.addEventListener('message', event => {
					const { command, text } = event.data;
					if (command === 'chatResponse'){
						document.getElementById('response').innerText = text;
					}
				});
			</script>
		</body>
		</html>
	`
}

module.exports = {
	activate,
	deactivate
}
