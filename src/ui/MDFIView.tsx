import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { Settings } from "src/settings";
import { ReactView } from "./ReactView";

export const VIEW_TYPE_MFDI = "mfdi-view";

// Why private?
type IconName = string;

export class MFDIView extends ItemView {
  private root: Root;
  private settings: Settings;

  constructor(leaf: WorkspaceLeaf, settings: Settings) {
    super(leaf);
    this.settings = settings;
  }

  getIcon(): IconName {
    return "pencil";
  }

  getViewType() {
    return VIEW_TYPE_MFDI;
  }

  getDisplayText() {
    return "Mobile Memo";
  }

  async onOpen() {
    this.renderNewView();
  }

  async onClose() {
    this.root.unmount();
    this.contentEl.removeClass("mfdi-view");
  }

  renderNewView() {
    // Use contentEl for robustness across desktop/mobile layouts
    // Mark this view's content for scoped CSS overrides
    this.contentEl.addClass("mfdi-view");
    this.root = createRoot(this.contentEl);
    this.root.render(<ReactView app={this.app} settings={this.settings} />);
  }

  updateSettings(settings: Settings) {
    this.settings = settings;
    this.root.unmount();
    this.renderNewView();
  }
}
