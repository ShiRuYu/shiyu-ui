# shiyu-ui Project Documentation

> AI Education Platform Frontend built on Vben Admin v5.7

## Tech Stack

| Technology              | Purpose           |
| ----------------------- | ----------------- |
| Vue 3 + Composition API | UI Framework      |
| TypeScript              | Type System       |
| Vite                    | Bundler           |
| Naive UI                | Component Library |
| Pinia                   | State Management  |
| Vue Router              | Routing           |
| Vben Admin v5.7         | Admin Framework   |
| Vxe Table               | Data Table        |

## Project Structure

```
apps/web-naive/src/
├── adapter/       # UI Adapters (Naive UI)
├── api/           # API Layer
├── composables/   # Composable Functions
├── layouts/       # Layout Components
├── locales/       # i18n
├── router/        # Router Configuration
├── store/         # Pinia Stores
└── views/         # View Pages
```

## Module Overview

| Module          | Prefix             | Files | Description                   |
| --------------- | ------------------ | :---: | ----------------------------- |
| agent           | `/agent`           |  17   | Agent Management              |
| ai-tutor        | `/ai-tutor`        |   5   | AI Tutoring                   |
| analytics       | `/analytics`       |   4   | Analytics                     |
| workbench       | `/workbench`       |   7   | Workbench                     |
| education-admin | `/education-admin` |  34   | Education Admin               |
| exam            | `/exam`            |   4   | Exams                         |
| knowledge       | `/knowledge`       |   9   | Enterprise Knowledge Platform |
| learning        | `/learning`        |  10   | Learning                      |
| practice        | `/practice`        |   2   | Practice                      |
| record          | `/record`          |  15   | Growth Records                |
| review          | `/review`          |   2   | Review                        |
| system          | `/system`          |  21   | System Admin                  |
| \_core          | `/`                |  14   | Core Pages                    |

## Quick Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type Check
pnpm typecheck
```

## Documentation Index

| Doc                                          | Description           |
| -------------------------------------------- | --------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | Architecture Overview |
| [MODULES.md](./MODULES.md)                   | Module Details        |
| [API.md](./API.md)                           | API Layer Guide       |
| [ROUTER.md](./ROUTER.md)                     | Routing System        |
| [STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md) | State Management      |
| [COMPOSABLES.md](./COMPOSABLES.md)           | Composable Functions  |
| [COMPONENTS.md](./COMPONENTS.md)             | Component Guide       |
| [STREAMING.md](./STREAMING.md)               | AI Streaming          |
| [CODING-STANDARDS.md](./CODING-STANDARDS.md) | Coding Standards      |
| [QUICK-START.md](./QUICK-START.md)           | Getting Started       |
