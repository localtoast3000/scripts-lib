const path = require('path');
const fs = require('fs');

/**
 * @class ExportsGenerator
 *
 * Searches for all ES6 export default modules within the given directory
 * and generates an exports directory with an index file containing
 * all export statements of the default exports at the same directory.
 * Support for JavaScript and TypeScript.
 *-  <-------------------------------------------------------->
 *-   Example 1:
 *-  <-------------------------------------------------------->
 *-  Result at given directory path /directory
 *-    -- + /directory-1
 *-    ------ module-1.ts
 *-    ------ module-2.ts
 *-    ------ module-3.ts
 *-    ------  + /exports
 *-    ----------- index.ts
 *-  Content in index.ts:
 *-  -------- export { default as Module1 } from '../module-1'
 *-  -------- export { default as Module2 } from '../module-2'
 *-  -------- export { default as Module3 } from '../module-3'
 *-  <-------------------------------------------------------->
 *-  Example 2:
 *-  <-------------------------------------------------------->
 *-  Result at given directory path /directory
 *-    -- + /directory-2
 *-    ------ + /module-1
 *-    ---------- index.jsx
 *-    ------ + /module-2
 *-    ---------- index.jsx
 *-    ------ + /module-3
 *-    ---------- index.jsx
 *-    ------  + /exports
 *-    ----------- index.js
 *-  Content in index.ts:
 *-  -------- export { default as Module1 } from '../module-1'
 *-  -------- export { default as Module2 } from '../module-2'
 *-  -------- export { default as Module3 } from '../module-3'
 *-  <--------------------------------------------------------->
 *-  It will only generate an exports file on either root level export default modules or one level down
 *-  sub-directorys containing an export default module named index.
 *-  <--------------------------------------------------------->
 *- Valide file types are:
 *- ------------ .js
 *- ------------ .jsx
 *- ------------ .ts
 *- ------------ .tsx
 *- <---------------------------------------------------------->
 *- An exports file will only be generated if all valid file types are of one type, so if there are js files with ts files
 *- the exports file will not be generated and a conflict error will be displayed in the console.
 *- Any other file that is not ts, tsx, js or jsx will be ignored.
 *
 * @example
 * const generator = new ExportsGenerator('/directory', 'exports', 'index');
 * generator.generate();
 */

module.exports = class ExportsGenerator {
  /**
   * Creates an instance of ExportsGenerator.
   * @constructor
   * @param {string} dirPath - The path of the directory to search for ES6 export default modules.
   * @param {string} [outputDirName='exports'] - The name of the output directory where the index file will be generated.
   * @param {string} [outputFileName='index'] - The name of the output file that will contain the export statements.
   */
  constructor(dirPath, outputDirName = 'exports', outputFileName = 'index') {
    this.PATH = path.join(process.cwd(), dirPath);
    this.outputDirName = outputDirName;
    this.outputFileName = outputFileName;
    this.jsFiles = [];
    this.tsFiles = [];
  }

  get path() {
    return this.PATH;
  }

  set path(dirPath) {
    this.PATH = dirPath;
  }

  /**
   * Get the content of the directory.
   * @returns {string[]} An array containing the names of files and directories in the directory.
   */
  get content() {
    try {
      const files = fs.readdirSync(this.PATH);
      return files;
    } catch (err) {
      console.error('Error reading directory:', err);
      return [];
    }
  }

  addJsFiles(files) {
    for (let file of files) {
      this.jsFiles.push(file);
    }
  }
  addTsFiles(files) {
    for (let file of files) {
      this.tsFiles.push(file);
    }
  }

  /**
   * Generate an export statement for a given file path.
   * @param {string} filePath - The absolute file path.
   * @returns {?string} The export statement or null if no default export found.
   */
  generateExportStatement(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const defaultExportMatch = data.match(
        /export\s+default\s+(?:(function|class|const|let|var)?\s*(\w+)|\(([^)]+)\)\s*=>\s*{)/
      );

      if (defaultExportMatch) {
        let basename = path.basename(filePath).split('.')[0];
        if (path.basename(filePath).split('.').includes('index')) {
          basename = path.basename(path.dirname(filePath));
        }

        const defaultExportName = defaultExportMatch[2];
        return `export { default as ${defaultExportName} } from '../${basename}';`;
      }

      return null;
    } catch (err) {
      console.error('Error reading file:', err);
      return null;
    }
  }

  /**
   * Process the directory and its subdirectories to generate export statements for files with default exports.
   * @param {string} directoryPath - The absolute path of the directory to process.
   * @returns {string[]} An array of export statements.
   */
  processDirectory(directoryPath) {
    try {
      const files = fs.readdirSync(directoryPath);
      const exportStatements = [];

      let currentJsFiles = files.filter(
        (file) =>
          /\.(js|jsx)$/.test(file) &&
          !new RegExp(`^${this.outputFileName}\\.(js|jsx)$`).test(file)
      );

      let currentTsFiles = files.filter(
        (file) =>
          /\.(ts|tsx)$/.test(file) &&
          !new RegExp(`^${this.outputFileName}\\.(js|jsx)$`).test(file)
      );

      const subdirectories = files.filter((file) => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        return stats.isDirectory();
      });

      for (const file of currentJsFiles) {
        const filePath = path.join(directoryPath, file);
        const exportStatement = this.generateExportStatement(filePath);
        if (exportStatement) {
          exportStatements.push(exportStatement);
        }
      }

      for (const file of currentTsFiles) {
        const filePath = path.join(directoryPath, file);
        const exportStatement = this.generateExportStatement(filePath);
        if (exportStatement) {
          exportStatements.push(exportStatement);
        }
      }

      for (const subdir of subdirectories) {
        const subdirectoryPath = path.join(directoryPath, subdir);
        try {
          const files = fs.readdirSync(subdirectoryPath);
          currentJsFiles = [
            ...currentJsFiles,
            ...files.filter((file) => /index\.(js|jsx)$/.test(file)),
          ];
          currentTsFiles = [
            ...currentTsFiles,
            ...files.filter((file) => /index\.(ts|tsx)$/.test(file)),
          ];

          let indexFileExt = '';
          const indexFileCount = files
            .map((file) => {
              const splitFile = file.split('.');
              if (splitFile[0] === 'index' && splitFile[1]) indexFileExt = splitFile[1];
              return splitFile[0];
            })
            .flat()
            .filter((name) => name === 'index').length;

          if (indexFileCount > 0 && indexFileCount < 2) {
            const exportStatement = this.generateExportStatement(
              path.join(subdirectoryPath, `index.${indexFileExt}`)
            );
            if (exportStatement) {
              exportStatements.push(exportStatement);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      this.addJsFiles(currentJsFiles);
      this.addTsFiles(currentTsFiles);

      return exportStatements;
    } catch (err) {
      console.error('Error processing directory:', err);
      return [];
    }
  }

  /**
   * Generate the index file with export statements based on the default exports found in the directory.
   */
  generate() {
    try {
      const exportStatements = this.processDirectory(this.PATH);
      const exportsDir = path.join(this.PATH, this.outputDirName);

      if (exportStatements.length > 0) {
        let indexFileName = false;
        if (this.tsFiles.length > 0 && this.jsFiles.length === 0) {
          indexFileName = `${this.outputFileName}.ts`;
        } else if (this.jsFiles.length > 0 && this.tsFiles.length === 0) {
          indexFileName = `${this.outputFileName}.js`;
        } else {
          console.error(
            'Conflict between TypeScript and JavaScript files please resolve before exports can be created'
          );
          return;
        }
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir);
        }
        const indexFilePath = path.join(this.PATH, this.outputDirName, indexFileName);
        fs.writeFileSync(indexFilePath, exportStatements.join('\n'));
        console.log(
          `Index file '${indexFileName}' with exports generated successfully in the directory '${this.PATH}'.`
        );
      } else {
        console.log(
          `No valid files with default exports found in the directory '${this.PATH}'.`
        );
      }
    } catch (err) {
      console.error('Error generating export statements:', err);
    }
  }
};
