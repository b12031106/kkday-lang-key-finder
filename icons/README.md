# Extension Icons

This directory contains the icons for the I18n Key Finder Chrome Extension.

## Files

- `icon16.svg/png` - 16x16 toolbar icon
- `icon32.svg/png` - 32x32 standard icon
- `icon48.svg/png` - 48x48 management page icon
- `icon128.svg/png` - 128x128 Chrome Web Store icon
- `favicon.svg` - Popup page favicon

## Design

The icon design features:
- Blue background (#007bff) representing the KKday brand colors
- Magnifying glass symbolizing search functionality
- Key symbol representing translation keys
- Subtle dots representing multiple language support

## Usage

The PNG files are used in the Chrome extension manifest. The SVG files are source files that can be used to generate PNGs at different sizes.

## Converting SVG to PNG

To convert the SVG files to PNG (for production use):

```bash
# Using Inkscape
inkscape --export-png=icon16.png --export-width=16 --export-height=16 icon16.svg

# Using ImageMagick
convert -background none -size 16x16 icon16.svg icon16.png

# Using Node.js with sharp
npm install sharp
node -e "require('sharp')('icon16.svg').png().resize(16,16).toFile('icon16.png')"
```
