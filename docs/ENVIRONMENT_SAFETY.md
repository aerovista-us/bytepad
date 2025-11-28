# Environment Safety Checklist

This document describes BytePad's environment requirements and how to use the `bytepad doctor` command to verify your setup.

## Critical Requirements

### Repository Location

⚠️ **BytePad MUST be installed on a local disk drive.**

**DO NOT install on:**
- Network shares (UNC paths like `\\server\share`)
- Mapped network drives (Z:, Y:, X:)
- Tailscale mounts
- WSL mount points (`/mnt/c`, `/mnt/d`)
- External USB drives

**Why?** These can cause:
- File system latency issues
- Build failures
- Environment drift
- Electron IPC failures
- Node module resolution problems

**Recommended locations:**
- Windows: `C:\Projects\bytepad` or `D:\Projects\bytepad`
- Linux: `~/projects/bytepad` or `/home/user/projects/bytepad`

### Toolchain Requirements

- **Node.js 20.x** (see `.nvmrc`)
- **Yarn 1.22.22+** (see `package.json` packageManager field)
- **Local disk** (not network/mapped drive)

## Using `bytepad doctor`

The `bytepad doctor` command checks your environment and reports any issues.

### Running Doctor

```bash
# Run all checks
yarn cli:doctor

# Or specific checks
yarn cli:doctor env      # Environment checks only
yarn cli:doctor storage  # Storage checks only
yarn cli:doctor electron # Electron checks only
```

### What Doctor Checks

#### Environment Checks (`doctor env`)

- ✅ Repository location (local vs network drive)
- ✅ Node.js version matches `.nvmrc`
- ✅ Yarn installation and version
- ✅ `yarn.lock` consistency
- ✅ `package.json` engines field
- ✅ `package.json` packageManager field
- ✅ Required folders exist

#### Storage Checks (`doctor storage`)

- ✅ Storage directory accessibility
- ✅ Storage directory writability
- ✅ Platform-specific storage paths

#### Electron Checks (`doctor electron`)

- ✅ Electron app structure
- ✅ Electron dependencies installed
- ✅ Electron build status

### Interpreting Results

- **✓ Pass** (green): Check passed, no action needed
- **⚠ Warn** (yellow): Non-critical issue, review recommended
- **✗ Fail** (red): Critical issue, must fix before proceeding

### Common Issues and Fixes

#### "Repository is on a network share"

**Fix:** Move repository to a local drive:
```bash
# Windows
cd C:\Projects
git clone <repository-url> bytepad

# Linux
cd ~/projects
git clone <repository-url> bytepad
```

#### "Node.js version mismatch"

**Fix:** Install correct Node.js version:
```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

#### "Yarn is not installed"

**Fix:** Install Yarn:
```bash
npm install -g yarn

# Or use Corepack (Node 16.10+)
corepack enable
corepack prepare yarn@1.22.22 --activate
```

#### "yarn.lock is missing"

**Fix:** Run yarn install:
```bash
yarn install
```

#### "Electron dependencies not installed"

**Fix:** Install Electron dependencies:
```bash
cd apps/desktop
yarn install
```

## Clean Install Process

If you encounter persistent issues, perform a clean install:

See [CLEAN_INSTALL.md](./CLEAN_INSTALL.md) for detailed instructions.

## Prevention

1. **Always check repository location** before cloning
2. **Use `bytepad doctor`** after cloning or moving the repository
3. **Pin Node.js version** using `.nvmrc` and `package.json` engines
4. **Keep Yarn version consistent** using `packageManager` field
5. **Run doctor before major operations** (build, test, deploy)

## Integration with CI/CD

The `bytepad doctor` command exits with code 1 if any checks fail, making it suitable for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Check environment
  run: yarn cli:doctor
```

## Related Documentation

- [CLEAN_INSTALL.md](./CLEAN_INSTALL.md) - Clean installation guide
- [ELECTRON_LAUNCH_INSTRUCTIONS.md](../ELECTRON_LAUNCH_INSTRUCTIONS.md) - Electron setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment requirements

