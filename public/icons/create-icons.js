// Simple Node.js script to generate PWA icons
// Run with: node public/icons/create-icons.js
// Requires: canvas package (npm install canvas)

const fs = require('fs')
const path = require('path')

// Check if canvas is available
let Canvas
try {
  Canvas = require('canvas')
} catch (e) {
  console.log('Canvas package not found. Please install it with: npm install canvas')
  console.log('Alternatively, use the generate-icons.html file in your browser to generate icons.')
  process.exit(1)
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname)

function createIcon(size) {
  const canvas = Canvas.createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#2563eb')
  gradient.addColorStop(1, '#7c3aed')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Add rounded corners by creating a clipping path
  const radius = size * 0.15
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(size - radius, 0)
  ctx.quadraticCurveTo(size, 0, size, radius)
  ctx.lineTo(size, size - radius)
  ctx.quadraticCurveTo(size, size, size - radius, size)
  ctx.lineTo(radius, size)
  ctx.quadraticCurveTo(0, size, 0, size - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.clip()

  // Redraw gradient after clipping
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Draw "TP" text
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.5}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TP', size / 2, size / 2)

  return canvas
}

// Generate all icons
sizes.forEach((size) => {
  const canvas = createIcon(size)
  const buffer = canvas.toBuffer('image/png')
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`)
  fs.writeFileSync(filename, buffer)
  console.log(`Created: ${filename}`)
})

console.log('\nAll icons generated successfully!')





