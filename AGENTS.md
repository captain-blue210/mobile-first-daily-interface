# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript source. Key areas: `ui/` (React components), `utils/` (helpers, parsing), `obsutils/` (Obsidian integration), `__mocks__/` (test doubles). Entry point: `src/main.ts`.
- Root: `manifest.json` (Obsidian plugin manifest), `styles.css` (plugin styles), `esbuild.config.mjs` (build/watch), `jest.config.js`, `tsconfig.json`.
- Tests: colocated as `*.test.ts(x)` next to the code under `src/`.

## Build, Test, and Development Commands
- `bun run dev`: Watch-build `main.js` and hot-copy files to your vault. Requires `.env` with `VAULT_DIR=/absolute/path/to/YourVault`.
- `bun run build`: Type-check with `tsc` then perform a production bundle.
- `bun run test`: Run Jest unit tests (jsdom + esbuild-jest).
- `bun run ci`: Install, build, and test (used in CI).
- Git hooks: `git config core.hooksPath hooks` to enable commit-msg and pre-push checks.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). JSX: React 18.
- Indentation: 2 spaces; quotes: double. Prettier is available; prefer LF endings.
- Naming: React components `PascalCase.tsx`; modules/helpers `kebab-case.ts`; tests `*.test.ts(x)` colocated.
- Linting: no ESLint; rely on `tsc --noEmit` and tests.

## Testing Guidelines
- Framework: Jest with `esbuild-jest` and `jsdom`. Obsidian APIs are mocked via `src/__mocks__/obsidian.ts`.
- Conventions: Write small, deterministic unit tests; prefer testing pure functions and serialization helpers. Name files `something.test.ts` near the code.
- Run: `bun run test`. Add tests when changing behavior or adding settings.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by `hooks/commit-msg`:
  - Format: `<type>(<scope>)?: <description>`; types: `feat|fix|style|docs|refactor|test|ci|build|dev|chore`. Example: `feat(ポストビュー): list format supports timestamp`.
- Pre-push runs type-checks and tests for changes under `src/`.
- PRs: include a clear description, linked issues, and screenshots/GIFs for UI changes. Update `README.md` if user-facing settings or behavior change. Do not commit build artifacts (`main.js`) or `.env`.
- Releases: handled by semantic-release. Do not bump versions manually in PRs.

## Security & Configuration Tips
- Local dev: create `.env` with `VAULT_DIR` for hot-reload to your Obsidian vault. `.env` is git-ignored.
- Avoid secrets in code or commits. Validate plugin `id`/`name` changes in `manifest.json` only via maintainers.
