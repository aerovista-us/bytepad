<!-- 4997e856-6507-4e1a-92f1-29e187a43ba1 0685a1cf-520b-4128-95fb-caa5a8ea2442 -->
# BytePad Master Plan — Phase 4 v2 (Yarn + Hardening + Multi-Surface OS Finish)

**Overall Completion:** ~85%

**Goal of Phase 4:** Turn a feature-complete BytePad into a **stable, multi-surface, multi-storage, production-ready system** (Web/PWA + Electron Desktop + NXCore Panel + NXDrive).

---

## 0) Current Status Snapshot

### ✅ Completed (Phases 0–3)

- **Security:** DOMPurify XSS protection, Zod validation, HTML sanitization
- **Core UX:** notes/boards CRUD, search/filter, undo/redo, pagination, virtual scrolling
- **Data Protection:** backups, transaction support, retry logic, legacy migration
- **Performance:** debouncing, monitoring, virtual scroll/pagination
- **PWA:** service worker + manifest + offline + install prompt
- **CLI:** export/import/flush-sync
- **E2E:** Playwright smoke tests
- **Electron:** structure exists + partial integration
- **Backup/Restore UI:** complete
- **Legacy Migration UI:** complete

### ⚠️ Partially Complete / Needs Verification

- **Electron Studio:** IPC + preload + window mgmt exist, needs full bridge verification
- **NXCore Panel:** uses IndexedDB now; must switch to NXDrive when available
- **Visual Assets:** icons exist; legacy styles/tokens not extracted
- **Docs:** status docs exist; missing formal API/arch/plugin/deploy guides
- **Service Worker updates + error boundary logging:** low-priority enhancements

### ❌ Not Started

- **Unit + Integration Tests**
- **NXDrive driver real implementation (blocked on NXCore API)**

---

# Phase 4A — Environment Drift Hardening + Doctor CLI (CRITICAL FOUNDATION)

**Why:** Your real blockers have been environment/drive drift, not app logic.

### Tasks

1. **Local-only repo enforcement**

- Detect and warn/block if running from:
- UNC/SMB paths
- Windows mapped drives (Z:, Y:, X:)
- Tailscale mounts
- WSL mounts (/mnt/*)
- External USB/removable drives

2. **Toolchain pinning**

- Ensure:
- `.nvmrc` (Node version)
- `package.json.engines.node`
- `package.json.packageManager` remains Yarn

3. **Doctor CLI commands**

- New CLI group:
- Files:
- `apps/cli/src/commands/doctor.ts`
- `apps/cli/src/commands/doctor/env.ts`
- `apps/cli/src/commands/doctor/storage.ts`
- `apps/cli/src/commands/doctor/electron.ts`
- Checks:
- Node version matches `.nvmrc`
- Yarn present + version compatible
- `yarn.lock` consistent with `package.json`
- Clean install sanity
- Repo location safe
- Required folders exist

4. **Standard clean-install script**

- Document one blessed reset path for both OSes.

### Deliverables

- `bytepad doctor` command (`doctor`, `doctor electron`, `doctor storage`, `doctor env`)
- Toolchain pin files (`.nvmrc`, `package.json` engines)
- Repo-location enforcement warnings

### Success Criteria

- Fresh clone installs cleanly on **local disk** in both Windows + Linux.
- Doctor flags drift before it breaks builds.

---

# Phase 4B — Electron Studio Verification + Bridge Stability (HIGH PRIORITY / HIGH RISK)

**Why:** Electron is the multi-surface keystone.

### Tasks

1. **Launch + dev server connection**

- Desktop app builds + launches without drift errors.
- Confirms connection to Next.js dev server.

2. **IPC bridge verification**

- Renderer ⇄ preload ⇄ main roundtrip stable.

3. **Unified bridge wrapper**

- Create `apps/web/lib/bridge.ts`
- Refactor `apps/web/lib/electron-bridge.ts` to call wrapper.
- Wrapper owns:
- Timeout
- Retry
- Error classification

4. **Electron lifecycle tests**

- Board CRUD end-to-end via IPC
- FS driver write/read in Electron
- Backup/restore cycle in Electron
- Window state persistence
- Native menu integration

5. **Bridge diagnostics route**

- `apps/web/app/debug/bridge/page.tsx`
- Dev-only / debug-flag gated.

6. **Error boundary improvements**

- Enhance boundary to log IPC failures.
- Friendly recovery UI for bridge/storage failures.

### Files to Review/Update

- `apps/desktop/src/main/core/setup.ts`
- `apps/desktop/src/main/ipc/handlers.ts`
- `apps/desktop/src/main/window.ts`
- `apps/desktop/src/preload/index.ts`
- `apps/web/lib/electron-bridge.ts`
- `apps/web/lib/bridge.ts` (new unified bridge wrapper)

### Deliverables

- Electron app runs end-to-end
- Bridge wrapper + diagnostics screen
- Updated `ELECTRON_LAUNCH_INSTRUCTIONS.md`

### Success Criteria

- ✅ Electron window opens without errors
- ✅ IPC bridge responds within 100ms
- ✅ Board CRUD works end-to-end
- ✅ Backup/restore cycle completes
- ✅ Window state persists across restarts
- ✅ No DevTools console errors

---

# Phase 4C — Storage Contract + Driver Manager + Diagnostics (CRITICAL)

**Why:** Multi-driver system needs a single truth + fallback.

### Tasks

1. **Contract extension**

- In `packages/bytepad-types/src/index.ts`
- Add:
- `supportsTransactions()`
- `supportsBackup()`
- `healthCheck()`

2. **Driver manager**

- `packages/bytepad-storage/src/driver-manager.ts`
- Implements:
- NXDrive → FS → IndexedDB cascade
- Availability detection rules
- Partial-failure handling (read ok / write fail)
- Optional migration-on-fallback behavior

3. **Storage diagnostics route**

- `apps/web/app/debug/storage/page.tsx`
- Shows:
- Active driver
- Driver health
- Fallback reason
- Last error

4. **Cross-surface debug overlay**

- React overlay (toggle Ctrl+Alt+D)
- Surface type + driver + IPC health + offline state.

### Deliverables

- `StorageDriverContract` interface (extended in types package)
- Fallback routing logic (in storage package)
- Driver test matrix + diagnostics UI

### Success Criteria

- Drivers behave identically under the contract.
- Failures automatically fall back safely.
- Diagnostics make failures visible instantly.

---

# Phase 4D — Vitest Unit + Integration Testing (MEDIUM PRIORITY)

**Why:** Quality + regression protection.

### Tasks

1. **Set up Vitest**

- Root `vitest.config.ts` (workspace aware)

2. **Core unit tests**

- `packages/bytepad-core/src/__tests__/`
- Boards CRUD
- Notes CRUD
- History / undo-redo
- Plugin system
- Validation + sanitization

3. **Storage integration tests**

- `packages/bytepad-storage/src/__tests__/`
- IndexedDB driver
- Filesystem driver
- Migration logic
- Fallback ordering

4. **Optional UI/component tests**

- `apps/web/__tests__/` only if needed.

5. **Coverage + CI**

- Coverage reporting target **>80%**
- Optional CI test runner.

### Files to Create

- Root `vitest.config.ts`
- `packages/bytepad-core/src/__tests__/`
- `packages/bytepad-storage/src/__tests__/`
- Fixtures/utilities

### Deliverables

- Test suite + coverage report
- CI hooks if desired

### Success Criteria

- > 80% core coverage.
- Storage behaviors verified across drivers.

---

# Phase 4E — NXDrive Driver Completion (MEDIUM PRIORITY / BLOCKED)

**Why:** Needed for NXCore panel + multi-surface sync.

### Tasks

1. **Review NXCore API docs** (if available)

2. **Implement real JSON storage**

- Load boards
- Save boards
- Delete boards

3. **Health check + retry**

- Graceful handling of NXCore offline states.

4. **Panel switches to NXDrive**

- Auto-fallback to IndexedDB if NXDrive unavailable.

5. **Conflict + merge strategy**

- Document expected behavior.

6. **If API absent: document block + ship safely with fallback.**

### Files to Update

- `packages/bytepad-storage/src/nxdrive.ts`
- `packages/bytepad-storage/src/driver-manager.ts`
- `apps/web/app/panel/page.tsx`
- `apps/web/app/providers.tsx`

### Deliverables

- Real NXDrive driver (or clearly documented block)
- Panel uses NXDrive when available

### Success Criteria

- Panel reads/writes NXDrive safely.
- Offline NXCore doesn't corrupt data.

---

# Phase 4F — Documentation (MEDIUM PRIORITY)

**Why:** Maintainability + plugin ecosystem.

### Tasks

1. Add JSDoc to core/storage public APIs

2. Generate TypeDoc → `docs/API.md`

3. Create Mermaid architecture diagram → `docs/ARCHITECTURE.md`

4. Plugin development guide → `docs/PLUGIN_GUIDE.md`

5. Deployment guides for Web + Electron → `docs/DEPLOYMENT.md`

6. Environment Safety Checklist → `docs/ENVIRONMENT_SAFETY.md` (drift rules + doctor usage)

7. Update README with feature list + doc links

### Deliverables

- Complete docs pack
- Architecture diagram
- Plugin + deployment guides

### Success Criteria

- Docs cover usage + development + deployment across surfaces.

---

# Phase 4G — Legacy Visual Assets Extraction (LOW PRIORITY / OPTIONAL)

**Why:** Polish only.

### Tasks

1. Extract legacy CSS + animations

2. Convert to Tailwind tokens / CSS vars

3. Organize icons + apply tokens globally

4. Verify visual consistency

### Deliverables

- Tailwind design token layer
- Updated globals + icons

### Success Criteria

- Visual parity with legacy BytePad (optional).

---

# Implementation Order (Recommended)

**Week 1**

1. Phase 4A — Environment Drift Hardening
2. Phase 4B — Electron Studio Verification

**Week 1–2**

3. Phase 4C — Storage Contract + fallback
4. Phase 4D — Unit/Integration Tests

**Week 2**

5. Phase 4E — NXDrive Driver (if API available; otherwise document block)

**Week 2–3**

6. Phase 4F — Documentation

**Week 3**

7. Phase 4G — Visual Assets (optional)

---

# Cross-Surface Debug Mode (Add-On)

**Permanent dev overlay toggled with `Ctrl+Alt+D`:**

- Surface type (web/pwa/electron/panel)
- Active driver + health
- IPC latency + failures
- Offline/online state
- Backup queue status
- NXCore connectivity

This is the "no more invisible failures" layer.

---

# Final Success Criteria (Phase 4 Complete When…)

✅ Electron Desktop matches web feature-for-feature
✅ IPC bridge stable + diagnostics present
✅ Storage contract unified + safe fallback in place
✅ Unit tests + integration tests >80% coverage
✅ NXDrive driver implemented or formally blocked + documented
✅ API docs + architecture + plugin + deploy guides done
✅ Visual assets extracted or intentionally deferred

---

# Risk Assessment (Realistic)

- **High Risk:** Electron Studio verification (environment-dependent)
- **Medium Risk:** Testing infra + storage contract (scope clear)
- **Medium Risk / Blocked:** NXDrive driver (requires NXCore API)
- **Low Risk:** Docs + visual assets

### To-dos

- [ ] Implement environment detection for network/mapped/external drives (UNC, SMB, Windows mapped drives, Tailscale, WSL, USB)
- [ ] Add .nvmrc, package.json engines.node, verify packageManager field for Yarn
- [ ] Create doctor CLI commands (doctor.ts, doctor/env.ts, doctor/storage.ts, doctor/electron.ts) with checks for Node version, Yarn, lockfile, repo location, folders
- [ ] Document standard clean-install script for Windows + Linux
- [ ] Verify Electron app builds + launches without drift errors, confirms Next.js dev server connection
- [ ] Verify renderer ⇄ preload ⇄ main IPC roundtrip stability
- [ ] Create apps/web/lib/bridge.ts unified wrapper with timeout/retry/error classification, refactor electron-bridge.ts to use it
- [ ] Test Electron lifecycle: Board CRUD via IPC, FS driver write/read, backup/restore cycle, window state persistence, native menu
- [ ] Create apps/web/app/debug/bridge/page.tsx for IPC diagnostics (dev-only/debug-flag gated)
- [ ] Enhance error boundary to log IPC failures and provide friendly recovery UI for bridge/storage failures
- [ ] Extend StorageDriver interface in packages/bytepad-types/src/index.ts with supportsTransactions(), supportsBackup(), healthCheck()
- [ ] Create packages/bytepad-storage/src/driver-manager.ts implementing NXDrive → FS → IndexedDB cascade with availability detection, partial-failure handling, optional migration-on-fallback
- [ ] Create apps/web/app/debug/storage/page.tsx showing active driver, health, fallback reason, last error
- [ ] Create React debug overlay (Ctrl+Alt+D toggle) showing surface type, driver, IPC health, offline state
- [ ] Set up root vitest.config.ts with workspace configuration
- [ ] Create packages/bytepad-core/src/__tests__/ with tests for boards CRUD, notes CRUD, history/undo-redo, plugin system, validation/sanitization
- [ ] Create packages/bytepad-storage/src/__tests__/ with tests for IndexedDB driver, filesystem driver, migration logic, fallback ordering
- [ ] Configure coverage reporting (>80% target) and optional CI test runner
- [ ] Implement real NXDrive driver in packages/bytepad-storage/src/nxdrive.ts (or document block if API unavailable)
- [ ] Update apps/web/app/panel/page.tsx and providers.tsx to use NXDrive when available, auto-fallback to IndexedDB
- [ ] Add JSDoc to core/storage public APIs
- [ ] Generate TypeDoc → docs/API.md
- [ ] Create Mermaid architecture diagram → docs/ARCHITECTURE.md
- [ ] Create plugin development guide → docs/PLUGIN_GUIDE.md
- [ ] Create deployment guides for Web + Electron → docs/DEPLOYMENT.md
- [ ] Create Environment Safety Checklist → docs/ENVIRONMENT_SAFETY.md (drift rules + doctor usage)
- [ ] Update README with feature list + doc links
- [ ] Extract legacy CSS + animations, convert to Tailwind tokens/CSS vars, organize icons (OPTIONAL)