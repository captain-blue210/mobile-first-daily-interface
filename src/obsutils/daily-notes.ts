import { App, normalizePath, TAbstractFile, TFile } from "obsidian";
import { Moment } from "moment";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { Settings } from "src/settings";

function joinDirFile(dir: string | undefined, file: string): string {
  const d = (dir ?? "").trim();
  if (!d) return file;
  const nd = normalizePath(d);
  return `${nd}/${file}`;
}

export function resolveDailyNotePath(
  _app: App,
  date: Moment,
  settings: Settings
): string {
  const ds = getDailyNoteSettings();
  const folder = settings.dailyNoteDir?.trim() ? settings.dailyNoteDir : ds.folder ?? "";
  const fileName = `${date.format(ds.format)}.md`;
  return joinDirFile(folder, fileName);
}

export function getDailyNoteFile(
  app: App,
  date: Moment,
  settings: Settings
): TFile | null {
  const path = resolveDailyNotePath(app, date, settings);
  const file = app.vault.getAbstractFileByPath(path);
  if (file instanceof TFile) return file;

  if (!settings.dailyNoteDir?.trim()) {
    // Fallback to default provider when not overriding folder
    return (getDailyNote(date, getAllDailyNotes()) as TFile) ?? null;
  }
  return null;
}

async function ensureFolder(app: App, folder: string): Promise<void> {
  if (!folder) return;
  const parts = normalizePath(folder).split("/");
  let current = "";
  for (const p of parts) {
    current = current ? `${current}/${p}` : p;
    const abs = app.vault.getAbstractFileByPath(current);
    if (!abs) {
      await app.vault.createFolder(current);
    }
  }
}

export async function ensureDailyNote(
  app: App,
  date: Moment,
  settings: Settings
): Promise<TFile> {
  const existing = getDailyNoteFile(app, date, settings);
  if (existing) return existing;

  if (!settings.dailyNoteDir?.trim()) {
    await createDailyNote(date);
    const created = getDailyNote(date, getAllDailyNotes()) as TFile | null;
    if (!created) throw new Error("Failed to create daily note via interface");
    return created;
  }

  const path = resolveDailyNotePath(app, date, settings);
  const folder = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await ensureFolder(app, folder);
  const file = await app.vault.create(path, "");
  return file;
}

