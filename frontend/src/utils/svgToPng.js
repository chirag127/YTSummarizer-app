/**
 * Utility script to convert SVG files to PNG using sharp
 * 
 * Usage:
 * 1. Place SVG files in the assets/svg directory
 * 2. Run this script with Node.js
 * 3. PNG files will be generated in the assets/png directory
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directories
const SVG_DIR = path.join(__dirname, '../../assets/svg');
const PNG_DIR = path.join(__dirname, '../../assets/png');

// Create directories if they don't exist
if (!fs.existsSync(SVG_DIR)) {
  fs.mkdirSync(SVG_DIR, { recursive: true });
  console.log(`Created directory: ${SVG_DIR}`);
}

if (!fs.existsSync(PNG_DIR)) {
  fs.mkdirSync(PNG_DIR, { recursive: true });
  console.log(`Created directory: ${PNG_DIR}`);
}

// Convert SVG to PNG
async function convertSvgToPng(svgPath, pngPath, width = 256, height = 256) {
  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Convert to PNG using sharp
    await sharp(svgBuffer)
      .resize(width, height)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted: ${path.basename(svgPath)} → ${path.basename(pngPath)}`);
  } catch (error) {
    console.error(`Error converting ${path.basename(svgPath)}:`, error.message);
  }
}

// Process all SVG files in the directory
async function processAllSvgFiles() {
  try {
    // Check if SVG directory exists
    if (!fs.existsSync(SVG_DIR)) {
      console.error(`SVG directory not found: ${SVG_DIR}`);
      return;
    }
    
    // Get all SVG files
    const svgFiles = fs.readdirSync(SVG_DIR).filter(file => file.endsWith('.svg'));
    
    if (svgFiles.length === 0) {
      console.log('No SVG files found in the directory.');
      return;
    }
    
    console.log(`Found ${svgFiles.length} SVG files. Converting to PNG...`);
    
    // Process each SVG file
    for (const svgFile of svgFiles) {
      const svgPath = path.join(SVG_DIR, svgFile);
      const pngFile = svgFile.replace('.svg', '.png');
      const pngPath = path.join(PNG_DIR, pngFile);
      
      await convertSvgToPng(svgPath, pngPath);
    }
    
    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error('Error processing SVG files:', error.message);
  }
}

// Run the conversion process
processAllSvgFiles();
