# Ruleon

Local-first outliner built with CR-SQLite, React, and Zustand.

![Ruleon screenshot](./screenshot.png)

## Setup

```bash
npm install
npm run dev
```

Desktop app (Electron):

```bash
npm run dev:electron
npm run build:electron   # Linux AppImage → release/
```

**Download (stable):** tag a commit and push the tag — CI publishes a [GitHub Release](https://github.com/davy1ex/ruleon/releases) with **Linux AppImage**, **macOS** (`.dmg` + `.zip`), and **Android APK**:

```bash
git tag v0.1.0
git push origin v0.1.0
```

**Dev channel:** every push to `dev` runs [Dev Release](.github/workflows/dev-release.yml) — same platforms, published as **pre-releases** tagged `dev-<run>`.

**CI artifacts:** every push to `master` also uploads a Linux AppImage under [Actions → Build](.github/workflows/build.yml).

Android APK locally:

```bash
npm run cap:apk
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dev:electron` | Electron dev mode |
| `npm run build` | Typecheck and production build |
| `npm run build:electron` | Typecheck + build Linux AppImage |
| `npm run build:electron:ci` | Build desktop app (no `tsc`, for CI) |
| `npm run cap:apk` | Build Capacitor web bundle + Android debug APK |
| `npm run test` | Unit + E2E tests |
| `npm run check:lines` | Fail if any `src/` file exceeds 200 lines |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for layer boundaries and module map.

If the app shows a CR-SQLite schema error after an earlier failed load, clear site data for `localhost` in your browser (the partial `ruleon.db` must be recreated).
