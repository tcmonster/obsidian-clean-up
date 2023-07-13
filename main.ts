import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import markdownToTxt from 'markdown-to-txt';

interface CleanUpSettings {
	isCleanHTML: boolean;
	isCleanMarkdown: boolean;
}

const DEFAULT_SETTINGS: CleanUpSettings = {
	isCleanHTML: true,
	isCleanMarkdown: false
}

export default class CleanUp extends Plugin {
	settings: CleanUpSettings;

	async onload() {
		await this.loadSettings();

		// Creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('eraser', 'Clean Up', (evt: MouseEvent) => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				const editor = markdownView.editor;
				this.cleanSelectContent(editor);
			}
		});

		//  adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'clean-up-selection',
			name: 'Clean Up Selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.cleanSelectContent(editor);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CleanUpSettingTab(this.app, this));

	}

	onunload() {

	}

	cleanSelectContent(editor: Editor) {
		// Get plugin settings
		const isCleanHTML = this.settings.isCleanHTML;
		const isCleanMarkdown = this.settings.isCleanMarkdown;

		// Get the selected content
		const selectedContent = editor.getSelection();
		const selectedContentLines = selectedContent.split('\n').length;
		let cleanedContent = selectedContent;

		if (isCleanHTML) {
			cleanedContent = selectedContent.replace(/<[^>]+>/g, '');
		}

		if (isCleanMarkdown) {
			cleanedContent = markdownToTxt(selectedContent);
		}

		editor.replaceSelection(cleanedContent);
		new Notice(selectedContentLines + ' rows cleaned');

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class CleanUpSettingTab extends PluginSettingTab {
	plugin: CleanUp;

	constructor(app: App, plugin: CleanUp) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for cleanable content.' });

		//Switch button for clean HTML
		new Setting(containerEl)
			.setName('Clean HTML')
			.setDesc('Will clear all HTML tags if enabled')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isCleanHTML)
					.onChange(async (value) => {
						this.plugin.settings.isCleanHTML = value;
						await this.plugin.saveSettings();
					});
			});

		//Switch button for clean Markdown
		new Setting(containerEl)
			.setName('Clean Markdown')
			.setDesc('Will clear all Markdown formats if enabled')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isCleanMarkdown)
					.onChange(async (value) => {
						this.plugin.settings.isCleanMarkdown = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
