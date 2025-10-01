/**
 * Icon Generator for I18n Key Finder Chrome Extension
 * Generates SVG-based icons in different sizes
 */

const fs = require('fs');
const path = require('path');

// SVG template for the extension icon
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#007bff" stroke="#0056b3" stroke-width="2"/>

  <!-- Search glass -->
  <circle cx="${size/2 - size/8}" cy="${size/2 - size/8}" r="${size/6}" fill="none" stroke="white" stroke-width="${Math.max(2, size/32)}"/>

  <!-- Search handle -->
  <line x1="${size/2 + size/12}" y1="${size/2 + size/12}" x2="${size/2 + size/4}" y2="${size/2 + size/4}"
        stroke="white" stroke-width="${Math.max(2, size/32)}" stroke-linecap="round"/>

  <!-- Key symbol -->
  <g transform="translate(${size/2 + size/8}, ${size/2 - size/4})">
    <rect x="0" y="0" width="${size/12}" height="${size/6}" rx="${size/24}" fill="white"/>
    <rect x="${size/24}" y="${size/12}" width="${size/16}" height="${size/24}" fill="white"/>
    <rect x="${size/24}" y="${size/8}" width="${size/20}" height="${size/32}" fill="white"/>
  </g>

  <!-- Translation dots -->
  <circle cx="${size/4}" cy="${size * 0.75}" r="${size/32}" fill="white" opacity="0.8"/>
  <circle cx="${size/3}" cy="${size * 0.8}" r="${size/32}" fill="white" opacity="0.8"/>
  <circle cx="${size * 0.4}" cy="${size * 0.85}" r="${size/32}" fill="white" opacity="0.6"/>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons in different sizes
const iconSizes = [16, 32, 48, 128];

iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);

  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated icon${size}.svg`);

  // For demonstration, also create placeholder PNG files
  // In a real project, you'd use a tool like sharp or similar to convert SVG to PNG
  const pngPath = path.join(iconsDir, `icon${size}.png`);
  const pngPlaceholder = `# PNG Icon Placeholder for ${size}x${size}
# In production, this would be a real PNG file generated from the SVG
# You can use tools like:
# - Inkscape CLI: inkscape --export-png=icon${size}.png --export-width=${size} --export-height=${size} icon${size}.svg
# - ImageMagick: convert -background none -size ${size}x${size} icon${size}.svg icon${size}.png
# - Online converters or design tools

Size: ${size}x${size}
Format: PNG
Purpose: Chrome Extension Icon
Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(pngPath, pngPlaceholder);
  console.log(`Created placeholder for icon${size}.png`);
});

// Generate a favicon for the popup
const faviconSVG = createSVGIcon(32);
const faviconPath = path.join(iconsDir, 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSVG);
console.log('Generated favicon.svg');

// Create a README for the icons
const iconReadme = `# Extension Icons

This directory contains the icons for the I18n Key Finder Chrome Extension.

## Files

- \`icon16.svg/png\` - 16x16 toolbar icon
- \`icon32.svg/png\` - 32x32 standard icon
- \`icon48.svg/png\` - 48x48 management page icon
- \`icon128.svg/png\` - 128x128 Chrome Web Store icon
- \`favicon.svg\` - Popup page favicon

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

\`\`\`bash
# Using Inkscape
inkscape --export-png=icon16.png --export-width=16 --export-height=16 icon16.svg

# Using ImageMagick
convert -background none -size 16x16 icon16.svg icon16.png

# Using Node.js with sharp
npm install sharp
node -e "require('sharp')('icon16.svg').png().resize(16,16).toFile('icon16.png')"
\`\`\`
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), iconReadme);
console.log('Created icons README.md');

console.log('\\n✅ Icon generation complete!');
console.log('📁 Icons created in:', iconsDir);
console.log('🎨 Design: Blue background with search glass and key symbols');
console.log('📝 Next step: Convert SVG files to PNG for production use');