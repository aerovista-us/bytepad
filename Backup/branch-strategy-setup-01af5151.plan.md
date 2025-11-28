<!-- 01af5151-b099-4515-97d2-0912515f4bf4 6c377949-014f-4657-81f8-664b734be1ad -->
# Fix Electron Forge Vite Plugin Auto-Build

## Problem Analysis

The Electron Forge Vite plugin should automatically build main and preload processes during `npm start`, but it's not working. Investigation reveals:

1. **Missing Library Mode Configuration**: Vite configs lack `build.lib` configuration needed for building Node.js/Electron processes
2. **No Explicit Output Directory**: `outDir` not specified in Vite configs
3. **Monorepo Package Resolution**: Local packages may not resolve correctly during plugin build
4. **Version Mismatch**: package.json specifies `^7.2.0` but `7.10.2` is installed

## Solution

### 1. Update `vite.main.config.ts`

- Add `build.lib` configuration with entry point, CommonJS format, and output filename
- Set explicit `outDir: ".vite/build/main"`
- Ensure Node.js built-ins (`path`, `fs`, etc.) are externalized
- Keep monorepo packages external (they're installed via `file:` dependencies)

### 2. Update `vite.preload.config.ts`

- Add `build.lib` configuration similar to main config
- Set explicit `outDir: ".vite/build/preload"`
- Externalize Electron and Node.js built-ins

### 3. Verify `electron-forge.config.ts`

- Confirm VitePlugin configuration is correct (already looks good)
- Ensure entry points match actual file locations

### 4. Test and Remove Workaround

- Test that `npm start` builds automatically
- Remove `prestart` script and `build:main` script if auto-build works
- Keep manual build script as fallback if needed

## Files to Modify

1. `apps/desktop/vite.main.config.ts` - Add library mode build config
2. `apps/desktop/vite.preload.config.ts` - Add library mode build config
3. `apps/desktop/package.json` - Remove `prestart` hook (if auto-build works)
4. `apps/desktop/scripts/build-main.js` - Keep as fallback or remove if not needed

## Expected Outcome

After these changes:

- Running `npm start` should automatically build `.vite/build/main/index.js` and `.vite/build/preload/index.js`
- No manual build step required
- Electron app launches successfully without "Cannot find module" errors

## Implementation Status (Nov 22, 2025)

**✅ COMPLETED:**

1. ✅ Updated `vite.main.config.ts` with `build.lib` configuration

- Added explicit `outDir: ".vite/build/main"`
- Configured CommonJS format output
- **Critical Fix:** Changed monorepo packages from external to bundled
- This ensures all TypeScript code is transpiled to CommonJS (fixes "Cannot use import statement outside a module" error)
- Added resolve aliases for monorepo packages to ensure proper bundling

2. ✅ Updated `vite.preload.config.ts` with `build.lib` configuration

- Added explicit `outDir: ".vite/build/preload"`
- Configured CommonJS format output
- Externalized only Node.js built-ins and Electron

3. ✅ Created manual build scripts

- `build:main` - Builds main process (scripts/build-main.js)
- `build:preload` - Builds preload process (scripts/build-preload.js)
- `build:all` - Builds both processes

4. ✅ Added `prestart` hook to `package.json`

- Automatically runs `build:all` before `npm start`
- Ensures build files exist before Electron launches

**⚠️ KNOWN LIMITATION:**

- Electron Forge Vite plugin still doesn't reliably auto-build during `npm start`
- The `prestart` hook is required as a workaround
- Build is fast (~500ms) so impact is minimal
- Manual build scripts available as fallback

**Build Configuration Details:**

- **External Dependencies:** Only Node.js built-ins and npm packages (electron, eventemitter3, uuid, zod, electron-squirrel-startup)
- **Bundled Dependencies:** All monorepo packages (`bytepad-*`) are bundled to ensure proper transpilation
- **Output Format:** CommonJS (required for Electron main process)
- **Build Output:** 22+ modules transformed, ~27.50 kB output (was 1.38 kB when not bundling)
- **Resolve Aliases:** Added to vite.main.config.ts to help Vite find monorepo packages during bundling

**Key Fix Applied:**

The original error "Cannot use import statement outside a module" was caused by:

1. Monorepo packages being externalized (not bundled)
2. When Electron tried to `require("bytepad-core")`, it loaded the TypeScript source file
3. TypeScript files with ES6 imports can't be executed by Node.js

**Solution:** Bundle all monorepo packages so they're transpiled to CommonJS before being included in the build output.

### To-dos

- [x] Update vite.main.config.ts with build.lib configuration
- [x] Update vite.preload.config.ts with build.lib configuration
- [x] Test that 'npm start' automatically builds files (using prestart hook)
- [x] Keep build scripts as fallback (prestart hook required)