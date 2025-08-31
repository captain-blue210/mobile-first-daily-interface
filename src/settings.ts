import { App, PluginSettingTab, Setting } from "obsidian";
import MFDIPlugin from "./main";
import { TextComponentEvent } from "./obsutils/settings";
import { mirrorMap } from "./utils/collections";

export interface Settings {
  leaf: string;
  autoStartOnLaunch: boolean;
  autoOpenInputOnMobile: boolean;
  blueskyIdentifier: string;
  blueskyAppPassword: string;
  postFormatOption: PostFormatOption;
  dailyNoteDir: string;
  appendSectionSpec: string;
  appendSectionEnd: string;
  timestampFormat: string;
  autoDemotePostHeading: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  leaf: "left",
  autoStartOnLaunch: false,
  autoOpenInputOnMobile: false,
  blueskyIdentifier: "",
  blueskyAppPassword: "",
  postFormatOption: "コードブロック",
  dailyNoteDir: "",
  appendSectionSpec: "",
  appendSectionEnd: "",
  timestampFormat: "YYYY-MM-DD HH:mm",
  autoDemotePostHeading: true,
};

const leafOptions = ["left", "current", "right"];

export const postFormatMap = {
  コードブロック: { type: "codeblock" },
  見出し1: { type: "header", level: 1 },
  見出し2: { type: "header", level: 2 },
  見出し3: { type: "header", level: 3 },
  見出し4: { type: "header", level: 4 },
  見出し5: { type: "header", level: 5 },
  見出し6: { type: "header", level: 6 },
  リスト: { type: "list" },
} as const;
export type PostFormatOption = keyof typeof postFormatMap;
export type PostFormat = (typeof postFormatMap)[PostFormatOption];

export class MFDISettingTab extends PluginSettingTab {
  plugin: MFDIPlugin;

  constructor(app: App, plugin: MFDIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h3", { text: "Mobile Memo" });

    new Setting(containerEl)
      .setName("投稿形式")
      .setDesc("投稿形式を指定します。")
      .addDropdown((tc) =>
        tc
          .addOptions(mirrorMap(Object.keys(postFormatMap), (x) => x))
          .setValue(this.plugin.settings.postFormatOption)
          .onChange(async (value) => {
            this.plugin.settings.postFormatOption = value as PostFormatOption;
            await this.plugin.saveSettings();
            this.plugin.rerenderView();
          })
      );

    containerEl.createEl("h3", { text: "📝 デイリーノート" });

    new Setting(containerEl)
      .setName("デイリーノートのディレクトリ")
      .setDesc(
        "Vault相対のフォルダを指定します。空の場合はObsidianのDaily Notes設定を使用します。"
      )
      .addText((cb) => {
        TextComponentEvent.onChange(cb, async (value) => {
          this.plugin.settings.dailyNoteDir = value;
          await this.plugin.saveSettings();
        }).setValue(this.plugin.settings.dailyNoteDir);
      });

    new Setting(containerEl)
      .setName("追記先の見出し")
      .setDesc(
        "例: ## つぶやき。指定された見出し配下の末尾に追記します。空の場合はファイル末尾に追記します。"
      )
      .addText((cb) => {
        TextComponentEvent.onChange(cb, async (value) => {
          this.plugin.settings.appendSectionSpec = value;
          await this.plugin.saveSettings();
          this.plugin.rerenderView();
        })
          .setPlaceholder("例: ## つぶやき")
          .setValue(this.plugin.settings.appendSectionSpec);
      });

    new Setting(containerEl)
      .setName("追記区切り")
      .setDesc(
        "指定された見出しの下からこの区切り文字列の上までが追記先になります。"
      )
      .addText((cb) => {
        TextComponentEvent.onChange(cb, async (value) => {
          this.plugin.settings.appendSectionEnd = value;
          await this.plugin.saveSettings();
        }).setValue(this.plugin.settings.appendSectionEnd);
      });

    new Setting(containerEl)
      .setName("投稿日時フォーマット")
      .setDesc(
        "投稿時に付与する日時のフォーマットを指定します。例: YYYY-MM-DD HH:mm"
      )
      .addText((cb) => {
        TextComponentEvent.onChange(cb, async (value) => {
          this.plugin.settings.timestampFormat = value;
          await this.plugin.saveSettings();
          this.plugin.rerenderView();
        })
          .setPlaceholder("例: YYYY-MM-DD HH:mm")
          .setValue(this.plugin.settings.timestampFormat);
      });

    new Setting(containerEl)
      .setName("投稿見出しを自動で段下げ")
      .setDesc(
        "見出し形式で投稿する場合、追記先見出しより1段下のレベルに自動調整します。"
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.autoDemotePostHeading).onChange(
          async (value) => {
            this.plugin.settings.autoDemotePostHeading = value;
            await this.plugin.saveSettings();
            this.plugin.rerenderView();
          }
        );
      });

    new Setting(containerEl)
      .setName("表示リーフ")
      .setDesc("MFDI Viewを表示するリーフを指定します。")
      .addDropdown((tc) =>
        tc
          .addOptions(mirrorMap(leafOptions, (x) => x))
          .setValue(this.plugin.settings.leaf)
          .onChange(async (value) => {
            this.plugin.settings.leaf = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Obsidian起動時に自動起動・アクティブにする")
      .setDesc(
        "有効にするとObsidian起動時にMFDIのViewが自動で起動し、アクティブになります。"
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.autoStartOnLaunch).onChange(
          async (value) => {
            this.plugin.settings.autoStartOnLaunch = value;
            await this.plugin.saveSettings();
          }
        );
      });

    new Setting(containerEl)
      .setName("モバイル起動時に入力フォームを自動表示")
      .setDesc(
        "モバイルで起動したときに通常の入力フォームを自動で開きます。"
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.autoOpenInputOnMobile).onChange(
          async (value) => {
            this.plugin.settings.autoOpenInputOnMobile = value;
            await this.plugin.saveSettings();
          }
        );
      });

    containerEl.createEl("h3", { text: "🦋 Bluesky" });

    new Setting(containerEl).setName("Blueskyのidentifier").addText((cb) => {
      TextComponentEvent.onChange(cb, async (value) => {
        this.plugin.settings.blueskyIdentifier = value;
        await this.plugin.saveSettings();
        this.plugin.rerenderView();
      })
        .setValue(this.plugin.settings.blueskyIdentifier)
        .setPlaceholder("例: mfdi.bsky.social");
    });

    new Setting(containerEl)
      .setName("Blueskyのアプリパスワード")
      .addText((cb) => {
        TextComponentEvent.onChange(
          cb,
          async (value) => {
            this.plugin.settings.blueskyAppPassword = value;
            await this.plugin.saveSettings();
            this.plugin.rerenderView();
          },
          { secret: true }
        ).setValue(this.plugin.settings.blueskyAppPassword);
      });
  }
}
