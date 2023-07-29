const path = require('path');
const fs = require('fs');

/**
 * A class that generates an index file with export statements based on default exports found in a directory and its subdirectories.
 */
module.exports = class ExportsGenerator {
  constructor(dirPath) {
    this.PATH = path.join(process.cwd(), dirPath);
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
        return `export { default as ${defaultExportName} } from './${basename}';`;
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
        (file) => /\.(js|jsx)$/.test(file) && !/^index\.(js|jsx)$/.test(file)
      );
      let currentTsFiles = files.filter(
        (file) => /\.(ts|tsx)$/.test(file) && !/^index\.(ts|tsx)$/.test(file)
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

      if (exportStatements.length > 0) {
        let indexFileName = false;
        if (this.tsFiles.length > 0 && this.jsFiles.length === 0) {
          indexFileName = 'index.ts';
        } else if (this.jsFiles.length > 0 && this.tsFiles.length === 0) {
          indexFileName = 'index.js';
        } else {
          console.error(
            'Conflict between TypeScript and JavaScript files please resolve before exports can be created'
          );
          return;
        }
        const indexFilePath = path.join(this.PATH, indexFileName);
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
