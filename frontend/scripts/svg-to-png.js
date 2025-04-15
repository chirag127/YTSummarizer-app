const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { JSDOM } = require('jsdom');
const { SVGPathData } = require('svg-pathdata');
const { createCanvas } = require('canvas');

// Configuration for different icon sizes
const iconConfigs = [
  { 
    input: 'assets/icon.svg', 
    output: 'assets/icon.png', 
    width: 1024, 
    height: 1024 
  },
  { 
    input: 'assets/adaptive-icon.svg', 
    output: 'assets/adaptive-icon.png', 
    width: 1024, 
    height: 1024 
  },
  { 
    input: 'assets/favicon.svg', 
    output: 'assets/favicon.png', 
    width: 64, 
    height: 64 
  },
  { 
    input: 'assets/splash-icon.svg', 
    output: 'assets/splash-icon.png', 
    width: 2048, 
    height: 2048 
  }
];

// Function to convert SVG to PNG
async function convertSvgToPng(svgPath, pngPath, width, height) {
  try {
    console.log(`Converting ${svgPath} to ${pngPath}...`);
    
    // Read SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Convert SVG to PNG using sharp
    await sharp(Buffer.from(svgContent))
      .resize(width, height)
      .png()
      .toFile(pngPath);
    
    console.log(`Successfully converted ${svgPath} to ${pngPath}`);
  } catch (error) {
    console.error(`Error converting ${svgPath} to ${pngPath}:`, error);
  }
}

// Process all icons
async function processIcons() {
  for (const config of iconConfigs) {
    await convertSvgToPng(config.input, config.output, config.width, config.height);
  }
  console.log('All SVG files have been converted to PNG!');
}

// Run the conversion
processIcons();
