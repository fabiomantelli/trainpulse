# TrainPulse PWA Icons

This directory contains the icons for the TrainPulse Progressive Web App.

## Generating Icons

You have three options to generate the required PNG icons:

### Option 1: Using the HTML Generator (Recommended)

1. Open `generate-icons.html` in your web browser
2. Click "Download All Icons" or download individual icons
3. Place all downloaded PNG files in this directory

### Option 2: Using Node.js Script

1. Install canvas package: `npm install canvas`
2. Run: `node public/icons/create-icons.js`
3. Icons will be generated in this directory

### Option 3: Manual Creation

Create PNG icons with the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (required)
- 384x384
- 512x512 (required)

Design specifications:
- Background: Gradient from #2563eb to #7c3aed
- Text: "TP" in white, bold, centered
- Rounded corners: ~15% border radius
- Format: PNG with transparency support

## Required Files

The following icon files must exist for the PWA to work correctly:
- `icon-192x192.png` (minimum required)
- `icon-512x512.png` (minimum required)

Additional sizes improve the experience on different devices.





