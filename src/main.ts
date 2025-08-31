import { Platform, Plugin, View } from "obsidian";
import { AppHelper } from "./app-helper";
import { DEFAULT_SETTINGS, MFDISettingTab, Settings } from "./settings";
import { MFDIView, VIEW_TYPE_MFDI } from "./ui/MDFIView";

export default class MFDIPlugin extends Plugin {
  appHelper: AppHelper;
  settings: Settings;
  settingTab: MFDISettingTab;
  view?: MFDIView;

  async onload() {
    this.appHelper = new AppHelper(this.app);

    await this.loadSettings();
    this.settingTab = new MFDISettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.registerView(VIEW_TYPE_MFDI, (leaf) => {
      this.view = new MFDIView(leaf, this.settings);
      return this.view;
    });

    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.autoStartOnLaunch) {
        await this.attachMFDIView();
      }
      if (Platform.isMobile && this.settings.autoOpenInputOnMobile) {
        await this.attachMFDIView();
      }
    });
    this.addRibbonIcon("pencil", "Mobile Memo", async () => {
      await this.attachMFDIView();
    });
    this.addCommand({
      id: "open-mobile-memo",
      name: "Mobile Memoを開く",
      callback: async () => {
        await this.attachMFDIView();
      },
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MFDI);
  }

  /**
   * MFDIのViewをアタッチします
   */
  async attachMFDIView() {
    const existed = this.app.workspace.getLeavesOfType(VIEW_TYPE_MFDI).at(0);
    if (existed) {
      await existed.setViewState({ type: VIEW_TYPE_MFDI, active: true });
      // Ensure the leaf becomes visible even if sidebars are hidden (mobile)
      this.app.workspace.revealLeaf(existed);
      return;
    }

    let targetLeaf =
      this.settings.leaf === "left"
        ? this.app.workspace.getLeftLeaf(true)
        : this.settings.leaf === "current"
        ? this.app.workspace.getActiveViewOfType(View)?.leaf
        : this.settings.leaf === "right"
        ? this.app.workspace.getRightLeaf(true)
        : undefined;
    if (!targetLeaf) {
      // Fallback: create/open a main-area leaf
      targetLeaf = this.app.workspace.getLeaf(true);
    }

    await targetLeaf.setViewState({
      type: VIEW_TYPE_MFDI,
      active: true,
    });
    // Ensure the leaf is visible (especially on mobile where sidebars may be hidden)
    this.app.workspace.revealLeaf(targetLeaf);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async loadSettings(): Promise<void> {
    const currentSettings = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...currentSettings };
  }

  rerenderView() {
    this.view?.updateSettings(this.settings);
  }
}
