# BytePad CLI

Command-line tool for BytePad 3.0 board export, import, and sync operations.

## Installation

```bash
cd apps/cli
npm install
npm run build
```

## Usage

### Export Boards

Export all boards to a JSON file:

```bash
bytepad export output.json
```

With custom boards path:

```bash
bytepad export output.json --boards-path /path/to/boards
```

### Import Boards

Import boards from a JSON file:

```bash
bytepad import input.json
```

Merge with existing boards (instead of replacing):

```bash
bytepad import input.json --merge
```

### Flush Sync Queue

Process pending sync events:

```bash
bytepad flush-sync
```

## Examples

```bash
# Export boards to backup file
bytepad export backup-$(date +%Y%m%d).json

# Import from backup
bytepad import backup-20240101.json

# Sync pending changes
bytepad flush-sync --boards-path ~/BytePad/boards
```

## Integration with NXCore

The CLI can be used in NXCore automation scripts:

```bash
# Daily backup
0 2 * * * cd /path/to/bytepad && bytepad export /backups/bytepad-$(date +\%Y\%m\%d).json
```

