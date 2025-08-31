import { App, Modal, Notice, moment } from "obsidian";
import { ensureDailyNote, getDailyNoteFile } from "src/obsutils/daily-notes";
import { PostFormat, Settings, postFormatMap } from "src/settings";
import { parseHeadingSpec } from "src/utils/markdown";
import { AppHelper } from "../app-helper";
import { toText } from "./ReactView";
import { replaceDayToJa } from "src/utils/strings";

export class QuickPostModal extends Modal {
  private readonly settings: Settings;
  private readonly appHelper: AppHelper;
  private inputEl!: HTMLTextAreaElement;
  private date = moment();
  private dateInputEl!: HTMLInputElement;
  private weekdayEl!: HTMLSpanElement;
  private vv?: VisualViewport;
  private adjust?: () => void;
  private baseHeight = 0;
  private keyboardHeight = 0;
  private isKeyboardOpen = false;
  private resizeTimeout?: number;

  constructor(app: App, settings: Settings) {
    super(app);
    this.settings = settings;
    this.appHelper = new AppHelper(app);
  }

  onOpen() {
    const { contentEl, titleEl } = this;
    // Hide modal title and header completely
    titleEl.remove();
    
    // Also remove modal-header if it exists
    const modalHeader = this.modalEl.querySelector('.modal-header');
    if (modalHeader) {
      modalHeader.remove();
    }
    
    contentEl.style.paddingTop = "0.5rem";

    const wrapper = contentEl.createDiv({ cls: "mobile-memo-quick-post" });
    // Match main view spacing: vertical stack with 0.75rem gap
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "0.75rem";

    // Date controls (align with main view)
    const dateRow = wrapper.createDiv({ cls: "mobile-memo-quick-post-date" });
    dateRow.style.display = "flex";
    dateRow.style.alignItems = "center";
    dateRow.style.justifyContent = "center";
    dateRow.style.gap = "0.5em";

    const prevBtn = dateRow.createEl("button", { text: "‹" });
    prevBtn.style.fontSize = "1.5em";
    prevBtn.style.cursor = "pointer";
    prevBtn.style.background = "none";
    prevBtn.style.border = "none";
    prevBtn.addEventListener("click", () => {
      this.date = this.date.clone().subtract(1, "day");
      this.updateDateControls();
    });

    const todayBtn = dateRow.createEl("button", { text: "今日" });
    todayBtn.style.fontSize = "80%";
    todayBtn.style.width = "3em";
    todayBtn.style.height = "2em";
    todayBtn.style.cursor = "pointer";
    todayBtn.style.marginRight = "0.3em";
    todayBtn.addEventListener("click", () => {
      this.date = moment();
      this.updateDateControls();
    });

    this.dateInputEl = dateRow.createEl("input", { type: "date" });
    this.dateInputEl.style.width = "9em";
    this.dateInputEl.style.height = "2em";
    this.dateInputEl.addEventListener("change", () => {
      this.date = moment(this.dateInputEl.value);
      this.updateDateControls(false);
    });

    this.weekdayEl = dateRow.createEl("span");
    this.weekdayEl.style.fontSize = "95%";
    this.weekdayEl.style.marginLeft = "0.2em";

    const nextBtn = dateRow.createEl("button", { text: "›" });
    nextBtn.style.fontSize = "1.5em";
    nextBtn.style.cursor = "pointer";
    nextBtn.style.background = "none";
    nextBtn.style.border = "none";
    nextBtn.addEventListener("click", () => {
      this.date = this.date.clone().add(1, "day");
      this.updateDateControls();
    });
    const textarea = wrapper.createEl("textarea");
    textarea.placeholder = "思ったことなどを記入 (Ctrl+Enterで投稿)";
    textarea.style.minHeight = "10em";
    textarea.style.fontSize = "1.05em";
    textarea.style.width = "100%";
    this.inputEl = textarea;

    const buttons = wrapper.createDiv({
      cls: "mobile-memo-quick-post-actions",
    });
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "0.5em";

    const cancelBtn = buttons.createEl("button", { text: "キャンセル" });
    cancelBtn.addEventListener("click", () => this.close());

    const submitBtn = buttons.createEl("button", { text: "投稿" });
    submitBtn.className = "mod-cta";
    submitBtn.addEventListener("click", () => this.submit());

    this.setupKeyboardHandling(buttons, wrapper);

    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.submit();
      }
    });

    // Initialize and focus
    this.updateDateControls(false);
    setTimeout(() => textarea.focus(), 0);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.cleanupKeyboardHandling();
  }

  private setupKeyboardHandling(buttons: HTMLElement, wrapper: HTMLElement) {
    this.baseHeight = window.innerHeight;
    
    // Visual Viewport API (現代的なアプローチ)
    const vv = window.visualViewport;
    if (vv) {
      const adjustWithVisualViewport = () => {
        const currentViewportHeight = vv.height;
        const keyboardHeight = this.baseHeight - currentViewportHeight;
        const offset = Math.max(0, keyboardHeight);
        
        this.updateModalPosition(buttons, wrapper, offset);
        this.keyboardHeight = offset;
        this.isKeyboardOpen = offset > 0;
      };
      
      vv.addEventListener("resize", adjustWithVisualViewport);
      vv.addEventListener("scroll", adjustWithVisualViewport);
      adjustWithVisualViewport();
      
      this.vv = vv;
      this.adjust = adjustWithVisualViewport;
    } else {
      // フォールバック: window.innerHeight変化を監視
      this.setupFallbackKeyboardDetection(buttons, wrapper);
    }
  }

  private setupFallbackKeyboardDetection(buttons: HTMLElement, wrapper: HTMLElement) {
    const adjustWithInnerHeight = () => {
      if (this.resizeTimeout) {
        window.clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = window.setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDifference = this.baseHeight - currentHeight;
        const offset = Math.max(0, heightDifference);
        
        this.updateModalPosition(buttons, wrapper, offset);
        this.keyboardHeight = offset;
        this.isKeyboardOpen = offset > 100; // 100px閾値でキーボード判定
      }, 150); // デバウンス
    };
    
    window.addEventListener("resize", adjustWithInnerHeight);
    window.addEventListener("orientationchange", adjustWithInnerHeight);
    
    this.adjust = () => {
      window.removeEventListener("resize", adjustWithInnerHeight);
      window.removeEventListener("orientationchange", adjustWithInnerHeight);
    };
  }

  private updateModalPosition(buttons: HTMLElement, wrapper: HTMLElement, keyboardOffset: number) {
    // モーダル全体を上に移動
    if (keyboardOffset > 0) {
      // キーボードが表示されている場合
      const modalEl = this.modalEl;
      modalEl.style.transform = `translateY(-${keyboardOffset * 0.3}px)`;
      modalEl.style.transition = "transform 0.3s ease-out";
      modalEl.classList.add("keyboard-open");
      
      // ボタンエリアの追加マージン
      buttons.style.marginBottom = `${keyboardOffset * 0.2}px`;
      buttons.style.transition = "margin-bottom 0.3s ease-out";
      
      // ラッパーの最大高さ調整
      const availableHeight = window.innerHeight - keyboardOffset;
      wrapper.style.maxHeight = `${availableHeight * 0.8}px`;
      wrapper.style.overflowY = "auto";
    } else {
      // キーボードが非表示の場合
      const modalEl = this.modalEl;
      modalEl.style.transform = "translateY(0)";
      modalEl.classList.remove("keyboard-open");
      
      buttons.style.marginBottom = "0";
      wrapper.style.maxHeight = "none";
      wrapper.style.overflowY = "visible";
    }
  }

  private cleanupKeyboardHandling() {
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }
    
    if (this.vv && this.adjust) {
      this.vv.removeEventListener("resize", this.adjust);
      this.vv.removeEventListener("scroll", this.adjust);
    } else if (this.adjust) {
      this.adjust(); // フォールバックのクリーンアップを実行
    }
  }

  private getEffectivePostFormat(): PostFormat {
    const postFormat = postFormatMap[this.settings.postFormatOption];
    if (postFormat.type !== "header") return postFormat;
    const parsed = parseHeadingSpec(this.settings.appendSectionSpec);
    if (parsed && this.settings.autoDemotePostHeading) {
      const lvl = postFormat.level;
      return {
        type: "header",
        level: Math.max(lvl, parsed.level + 1),
      } as PostFormat;
    }
    return postFormat;
  }

  private async submit() {
    const input = this.inputEl.value.trim();
    if (!input) return;

    const asTask = false; // タスク投稿は不要
    const effectivePostFormat = this.getEffectivePostFormat();
    const text = toText(
      input,
      asTask,
      effectivePostFormat,
      this.settings.timestampFormat
    );

    const targetDate = this.date.clone();
    let note = getDailyNoteFile(this.app, targetDate, this.settings);
    if (!note) {
      new Notice("デイリーノートが存在しなかったので新しく作成しました");
      note = await ensureDailyNote(this.app, targetDate, this.settings);
    }
    if (!note) return;

    const spec = this.settings.appendSectionSpec?.trim();
    if (spec) {
      await this.appHelper.insertTextUnderSection(
        note,
        spec,
        text,
        effectivePostFormat,
        this.settings.appendSectionEnd
      );
    } else {
      await this.appHelper.insertTextToEnd(note, text);
    }

    new Notice("投稿しました");
    this.close();
  }

  private updateDateControls(updateInput: boolean = true) {
    if (updateInput) {
      this.dateInputEl.value = this.date.format("YYYY-MM-DD");
    } else {
      if (!this.dateInputEl.value) {
        this.dateInputEl.value = this.date.format("YYYY-MM-DD");
      }
    }
    this.weekdayEl.setText(replaceDayToJa(this.date.format("(ddd)")));
  }
}
