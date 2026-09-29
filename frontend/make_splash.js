const fs = require('fs');
const sharp = require('sharp');
const svg = '<svg width=\"1024\" height=\"1024\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M512 100 Q800 300 800 600 Q800 900 512 900 Q224 900 224 600 Q224 300 512 100 Z\" fill=\"white\"/></svg>';
fs.mkdirSync('assets', { recursive: true });
sharp(Buffer.from(svg)).png().toFile('assets/splash.png').then(() => console.log('Done')).catch(e => console.error(e));
