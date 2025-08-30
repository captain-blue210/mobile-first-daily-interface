export interface HeadingSpec {
  level: number;
  title: string;
}

export function parseHeadingSpec(spec: string): HeadingSpec | null {
  if (!spec) return null;
  const s = spec.trim();
  const m = s.match(/^(#{1,6})\s+(.+)$/);
  if (!m) return null;
  const level = m[1].length;
  const title = m[2].trim();
  return { level, title };
}

export function buildHeadingLine(level: number, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

