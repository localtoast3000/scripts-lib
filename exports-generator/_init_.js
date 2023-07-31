#!/usr/bin/env node

/**
 *- Init script for CLI commands.
 *- Add the exports-generator script package to to your project root
 *- then create package.json scripts to run exports-generator
 *------
 *- <-------------------------------------------------------------->
 *- eg:
 *- --"scripts": {
 *- ---- "exports-gen": "node scripts/exports-generator src/pages
 *- --}
 *- Will generate exports file for all found export default modules at src/pages
 *- <-------------------------------------------------------------->
 *- Chain other paths to the command seperated by a space
 *- ------- eg: src/pages src/lib
 *- to generate multiple exports files, run the command again to update export files
 */

const ExportsGenerator = require('./class');

const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error('Error: You must provide at least one path as an argument.');
  console.log('Usage: node exports-generator <path1> <path2> ...');
  process.exit(1);
}

function generateExportsForPath(path) {
  const exportsGeneratorInstance = new ExportsGenerator(path);
  exportsGeneratorInstance.generate();
}

paths.forEach(generateExportsForPath);
