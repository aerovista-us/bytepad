# Icons Directory

This directory should contain PWA icons for the BytePad web app.

## Required Icons

- `icon-192.png` - 192x192 pixels (for app icons)
- `icon-512.png` - 512x512 pixels (for splash screens)

## Development

Icons are optional during development. The app will function without them, but you'll see 404 warnings in the console.

## Production

For production builds, create proper icons:
1. Use a design tool to create 192x192 and 512x512 PNG images
2. Place them in this directory
3. The manifest.json will automatically reference them

## Quick Placeholder Generation

You can create simple placeholder icons using ImageMagick or any image editor:
- Solid color squares with "BP" text
- Or use an online icon generator

