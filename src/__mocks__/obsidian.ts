import moment from "moment";

export { moment };

export class App {}
export class Editor {}
export class MarkdownView {}
export class TFile { path = ""; }
export class Notice {
  constructor(_msg?: string) {}
}
export class Plugin {}
export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
  }
}

