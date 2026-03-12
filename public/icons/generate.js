// Generate simple SVG icons for PWA
const fs = require('fs');

function createIcon(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0a0e17"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.35}" fill="#3b82f6">TP</text>
</svg>`;
  return svg;
}

// Write SVG files (browsers accept SVG for PWA icons)
fs.writeFileSync('public/icons/icon-192.svg', createIcon(192));
fs.writeFileSync('public/icons/icon-512.svg', createIcon(512));
console.log('Icons generated');
