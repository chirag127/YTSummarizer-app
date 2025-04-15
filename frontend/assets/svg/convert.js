const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Define the output files and their dimensions
const outputFiles = [
  { name: 'icon.png', width: 1024, height: 1024 },
  { name: 'adaptive-icon.png', width: 1024, height: 1024 },
  { name: 'favicon.png', width: 48, height: 48 },
  { name: 'splash-icon.png', width: 1242, height: 1242 }
];

// Path to the SVG file
const svgPath = path.join(__dirname, 'logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Convert SVG to PNG for each output file
async function convertSvgToPng() {
  try {
    for (const file of outputFiles) {
      const outputPath = path.join(__dirname, '..', file.name);
      
      console.log(`Converting SVG to ${file.name} (${file.width}x${file.height})...`);
      
      await sharp(Buffer.from(svgContent))
        .resize(file.width, file.height)
        .png()
        .toFile(outputPath);
      
      console.log(`Successfully created ${file.name}`);
    }
    
    console.log('All conversions completed successfully!');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

// Run the conversion
convertSvgToPng();
