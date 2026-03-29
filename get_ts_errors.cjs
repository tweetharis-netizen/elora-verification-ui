const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const allDiagnostics = ts.getPreEmitDiagnostics(program);

const errors = [];
allDiagnostics.forEach(d => {
  if (d.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    errors.push(`${d.file.fileName}:${line+1}:${character+1} - error TS${d.code}: ${msg}`);
  } else {
    errors.push(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }
});

const out = errors.join('\n') || 'NO ERRORS';
fs.writeFileSync('ts_errors_final.txt', out, 'utf8');
console.log('Found', errors.length, 'error(s)');
console.log(out);
