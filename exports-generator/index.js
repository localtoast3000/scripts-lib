const ExportsGenerator = require('./class');

// Get the paths from the command line arguments (start from index 2 to skip 'node' and 'index.js')
const paths = process.argv.slice(2);

// Check if any paths are provided as arguments
if (paths.length === 0) {
  console.error('Error: You must provide at least one path as an argument.');
  console.log('Usage: node exports-generator <path1> <path2> ...');
  process.exit(1); // Exit the process with an error status code
}

// Function to generate exports for a single path
function generateExportsForPath(path) {
  const exportsGeneratorInstance = new ExportsGenerator(path);
  exportsGeneratorInstance.generate();
}

// Generate exports for each provided path
paths.forEach(generateExportsForPath);
