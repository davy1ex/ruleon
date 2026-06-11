# Ruleon — onboarding

Краткое введение в проект для новых разработчиков.

## Что это

**Ruleon** (v0.1.0) — local-first outliner и productivity-приложение. Заметки хранятся в иерархическом дереве блоков, работают офлайн, а при необходимости синхронизируются между устройствами через CR-SQLite.

Основные возможности:

- **Outliner** — страницы и вложенные блоки, drag-and-drop, сворачивание веток
- **Задачи** — статус `TODO` / `DONE` на уровне блока (чекбокс вне редактора)
- **WikiLinks** — `[[Название страницы]]` с обратными ссылками
- **Query portals** — `{{query: Target}}` — живые запросы по дереву заметок
- **Журнал** — ежедневные страницы, лента активности
- **Pomodoro** — таймер с записью сессий в журнал
- **Геймификация** — XP за выполнение задач и активность
- **Синхронизация** — опциональный WebSocket sync-server между Electron, браузером и Android
- **Бэкапы** — в Electron: SQLite + Markdown каждые 15 минут

Платформы: **браузер** (Vite dev), **Electron** (Linux AppImage), **Android** (Capacitor).

## Стек

| Слой | Технологии |
|------|------------|
| UI | React 19, Tailwind CSS, lucide-react |
| Состояние | Zustand |
| Редактор | Tiptap (один экземпляр на сфокусированную строку) |
| База данных | CR-SQLite WASM (`@vlcn.io/crsqlite-wasm`) в Web Worker |
| Реактивность | `@vlcn.io/rx-tbl` — подписки на изменения таблиц |
| Синк | `@vlcn.io/ws-client`, Node sync-server |
| DnD | `@dnd-kit` |
| Сборка | Vite 6, TypeScript 5.7 |
| Desktop | Electron 35 + electron-builder |
| Mobile | Capacitor 8 (Android) |
| Тесты | Vitest (unit), Playwright (e2e) |

## Быстрый старт

```bash
npm install
npm run dev          # браузер на localhost:5173
npm run dev:electron # Electron-оболочка
```

Если после неудачной загрузки появляется ошибка схемы CR-SQLite — очистите site data для `localhost` (частичный `ruleon.db` нужно пересоздать).

### Полезные команды

| Команда | Назначение |
|---------|------------|
| `npm run build` | Typecheck + production build |
| `npm run build:electron` | Linux AppImage → `release/` |
| `npm run cap:apk` | Сборка debug APK для Android |
| `npm run test` | Unit + E2E |
| `npm run test:logic` | Только Vitest |
| `npm run test:e2e` | Только Playwright |
| `npm run lint` | ESLint |
| `npm run check:lines` | Проверка лимита 200 строк на файл в `src/` |

Подробнее о слоях — в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Архитектура (кратко)

```
React UI (src/ui/)
    ↓ props / callbacks
Zustand store (src/store/)
    ↓ RPC postMessage
DB Worker (src/domain/db/worker.ts)  ←→  CR-SQLite WASM (ruleon.db)
    ↓ rx-tbl events
Store обновляется реактивно
```

**Главное правило:** React-компоненты **никогда** не импортируют SQLite и не выполняют SQL. Весь доступ к БД — через Web Worker и RPC-клиенты (`dbClient`, `stmtClient`, `txClient`).

Отдельный **backup worker** (`backupWorker.ts`) генерирует двойной бэкап (бинарный SQLite + Markdown) без блокировки основного worker.

### Слои

| Слой | Путь | Ответственность |
|------|------|-----------------|
| UI | `src/ui/` | Визуальные компоненты. Только props и callbacks. |
| Features | `src/features/` | Чистая логика: дерево, drag projection, расширения редактора, геймификация |
| Domain | `src/domain/` | Схема БД, queries/mutations, backup, настройки |
| Store | `src/store/` | Zustand; подписка на `rx-tbl` через `RxBridge` |
| Modules | `src/modules/` | Плагины: sync, backup scheduler, pomodoro |
| Electron | `electron/` | Main process, IPC для бэкапов на диск |
| Sync server | `sync-server/` | WebSocket-хаб репликации CR-SQLite |

### Поток данных

1. Пользователь редактирует блок → store вызывает mutation в domain
2. Mutation уходит в DB worker по RPC
3. CR-SQLite пишет в `outline_nodes` / `block_links` / `kv_state`
4. `rx-tbl` шлёт событие в renderer → store обновляет UI

### Workspace

Приложение использует модель **workspace** с вкладками-листьями (`editor`, `journal`, `trash`, `search`, `settings`). Раскладка и открытые вкладки персистятся в `localStorage` (`ruleon.workspace`). На мобильных — отдельный `MobileLayout`.

Точка входа: `src/App.tsx` → bootstrap outliner store → `AppLayout` / `MobileLayout`.

## База данных

Файл схемы: `src/domain/db/schema.sql`.

Основные таблицы:

- `outline_nodes` — дерево блоков (CRR, реплицируется)
- `block_links` — WikiLinks между блоками (CRR)
- `kv_state` — key-value (pomodoro, прочее) (CRR)
- `app_settings` — настройки приложения (CRR)
- `node_links` — ссылки на страницы по имени (не CRR)
- `favorites`, `trashed_nodes` — избранное и корзина

Системные страницы с фиксированными ID (для merge при синке):

- Welcome: `00000000-0000-4000-8000-000000000001`
- Inbox: `00000000-0000-4000-8000-000000000002`

## Ключевые фичи — где искать код

### Outliner

- Domain: `src/domain/outliner/` — queries, mutations, seed, metadata
- Features: `src/features/outliner/` — flattenTree, dragProjection, smartSplit
- UI: `src/ui/BlockTree.tsx`, `OutlinerRow`, `PageFeed.tsx`
- Store: `src/store/outlinerStore.ts`, `blockActions.ts`

### Редактор (Tiptap)

- `src/features/editor/` — contentCodec, расширения (wikiLink, queryPortal)
- `src/hooks/useBlockEditor.ts` — создание редактора на строку

### Порталы и бэклинки

- `src/domain/outliner/portalQueries.ts`
- `src/ui/QueryPortalPanel.tsx`
- `src/store/portalActions.ts`, `backlinkActions.ts`
- E2E: `e2e/portals.spec.ts`, `e2e/backlinks.spec.ts`

### Pomodoro

- `src/modules/pomodoro/`, `src/domain/kv/pomodoroState.ts`
- `src/store/pomodoroStore.ts`, `pomodoroPersistence.ts`

### Геймификация

- `src/features/gamification/` — xpEngine, levelCurve, calculateNodeXP
- `src/store/gamificationStore.ts`, `src/ui/XpToast.tsx`

### Календарь

- `src/features/calendar/CalendarWidget.tsx`

### Настройки

- `src/domain/settings/settingsRepo.ts` — хранение в `app_settings`
- `src/store/settingsStore.ts` — тема, sync, плагины

### Бэкапы (только Electron)

- `src/domain/backup/` — generateDualBackup, astToMarkdown, backupScheduler
- `electron/main.ts` — IPC `backup:save` → `userData/Backups/`

## Синхронизация

Опциональный **sync-server** (`sync-server/`) — Node.js + WebSocket.

```bash
cd sync-server
cp .env.example .env   # задать API_KEY
./setup.sh --start
```

В клиенте: Settings → Sync → URL и API key. Клиент отправляет `authToken` и `schema_version` при handshake. Несовпадение версии схемы отклоняет подключение.

Быстрое добавление в Inbox с сервера: `POST /api/inbox` с `{"text":"…"}`.

Модуль: `src/modules/sync/syncModule.ts`, конфиг URL: `src/config/sync.ts`.

## Платформы

### Браузер

`npm run dev` — основной режим разработки. БД в IndexedDB через wa-sqlite.

### Electron

- `electron/main.ts` — sandbox, contextIsolation, без nodeIntegration в renderer
- `electron/preload.ts` — `window.electronAPI.saveDualBackup`
- CI собирает AppImage на каждый push в `master` (см. `.github/workflows/build.yml`)

### Android

```bash
npm run cap:apk   # Vite build (capacitor mode) + Gradle assembleDebug
```

Конфиг: `capacitor.config.ts`, нативный проект: `android/`.

## Конвенции разработки

1. **Лимит 200 строк** на файл в `src/` — `npm run check:lines`. Большие модули дробятся (пример: `workspaceLeafActions.ts`, `blockActions.ts`).
2. **Нет SQL в React** — только domain + worker.
3. **Workers владеют I/O** — SQLite только в `worker.ts` и `backupWorker.ts`.
4. **Явные типы** — строки БД и AST в `src/domain/`.
5. **Обновляй ARCHITECTURE.md** при добавлении cross-cutting слоёв.

### Тестирование

- **Unit:** `src/**/*.test.ts` — Vitest, рядом с кодом или в `__tests__/`
- **E2E:** `e2e/` — Playwright (outliner, tasks, portals, backlinks)
- E2E build: `npm run build:e2e` + `npm run preview:e2e`

### CI

- `test.yml` — lint + unit + e2e
- `build.yml` — Electron AppImage artifact
- `release.yml` — релизы по тегам `v*`

## Карта каталогов

```
ruleon/
├── src/
│   ├── ui/              # React-компоненты
│   ├── store/           # Zustand stores и actions
│   ├── features/        # Чистая логика (editor, outliner, gamification, calendar)
│   ├── domain/          # БД, outliner, backup, settings, kv
│   ├── modules/         # sync, backup, pomodoro bootstrap
│   ├── hooks/           # useBlockEditor, useIsMobile, …
│   ├── config/          # sync URL и прочий конфиг
│   └── docs/            # Read-only дерево для экспорта/доков
├── electron/            # Main + preload
├── sync-server/         # WebSocket sync hub
├── android/             # Capacitor Android project
├── e2e/                 # Playwright specs
├── scripts/             # ensure-electron, build-cap, check-lines, icons
├── build/icons/         # Иконки для electron-builder
├── ARCHITECTURE.md      # Детальная архитектура
└── README.md            # Краткий README
```

## С чего начать новому разработчику

1. `npm install && npm run dev` — поднять приложение, пощупать outliner.
2. Прочитать [ARCHITECTURE.md](./ARCHITECTURE.md) — потоки данных и worker RPC.
3. Открыть `src/App.tsx` → `outlinerStore.bootstrap` — как стартует приложение.
4. Проследить путь редактирования блока: `blockActions.debouncedUpdateContent` → domain mutation → worker.
5. Запустить `npm run test:logic` — убедиться, что тесты зелёные.
6. При работе с синком — поднять `sync-server` и настроить ключ в Settings.

## Внешняя документация

Пользовательская документация (что такое Ruleon, настройка sync) — в отдельном репозитории **ruleon-landing** (статический Vite-сайт). В этот репозиторий не входит.
