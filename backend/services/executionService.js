const { execSync } = require('child_process');
const { writeFileSync, unlinkSync, mkdirSync, existsSync } = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const TIMEOUT_MS = 10000; // 10 second timeout
const MAX_OUTPUT_LENGTH = 10000; // characters

// File extensions and run commands for each language
const LANGUAGE_CONFIG = {
  javascript: {
    ext: '.js',
    compile: null,
    run: (filePath) => `node "${filePath}"`,
  },
  python: {
    ext: '.py',
    compile: null,
    run: (filePath) => `python "${filePath}"`,
  },
  cpp: {
    ext: '.cpp',
    compile: (filePath, outPath) => `g++ "${filePath}" -o "${outPath}"`,
    run: (_, outPath) => `"${outPath}"`,
  },
  java: {
    ext: '.java',
    compile: (filePath, _, dir) => `javac "${filePath}"`,
    run: (filePath, _, dir) => {
      const className = path.basename(filePath, '.java');
      return `java -cp "${dir}" ${className}`;
    },
  },
};

const ensureTempDir = () => {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

/**
 * Execute code in a sandboxed subprocess.
 * Uses child_process with strict timeouts instead of Docker
 * for simpler local development setup.
 */
const executeCode = async (code, language) => {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
      executionTime: 0,
    };
  }

  const tempDir = ensureTempDir();
  const fileId = uuidv4().slice(0, 8);

  // Java requires the filename to match the public class name
  let fileName;
  if (language === 'java') {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    fileName = classMatch ? classMatch[1] : 'Main';
  } else {
    fileName = `code_${fileId}`;
  }

  const filePath = path.join(tempDir, `${fileName}${config.ext}`);
  const outPath = path.join(tempDir, `${fileName}${process.platform === 'win32' ? '.exe' : ''}`);

  const startTime = Date.now();

  try {
    writeFileSync(filePath, code, 'utf8');

    // Compile step (for C++, Java)
    if (config.compile) {
      try {
        execSync(config.compile(filePath, outPath, tempDir), {
          timeout: TIMEOUT_MS,
          stdio: 'pipe',
          cwd: tempDir,
        });
      } catch (compileError) {
        const executionTime = Date.now() - startTime;
        return {
          stdout: '',
          stderr: (compileError.stderr?.toString() || compileError.message).slice(0, MAX_OUTPUT_LENGTH),
          exitCode: 1,
          executionTime,
        };
      }
    }

    // Run step
    const runCmd = config.run(filePath, outPath, tempDir);
    const result = execSync(runCmd, {
      timeout: TIMEOUT_MS,
      stdio: 'pipe',
      cwd: tempDir,
      maxBuffer: 1024 * 1024, // 1MB
    });

    const executionTime = Date.now() - startTime;

    return {
      stdout: result.toString().slice(0, MAX_OUTPUT_LENGTH),
      stderr: '',
      exitCode: 0,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    if (error.killed) {
      return {
        stdout: (error.stdout?.toString() || '').slice(0, MAX_OUTPUT_LENGTH),
        stderr: 'Execution timed out (10s limit exceeded)',
        exitCode: 124,
        executionTime,
      };
    }

    return {
      stdout: (error.stdout?.toString() || '').slice(0, MAX_OUTPUT_LENGTH),
      stderr: (error.stderr?.toString() || error.message).slice(0, MAX_OUTPUT_LENGTH),
      exitCode: error.status || 1,
      executionTime,
    };
  } finally {
    // Cleanup temp files
    try { unlinkSync(filePath); } catch {}
    try { unlinkSync(outPath); } catch {}
    // Java class files
    if (language === 'java') {
      try { unlinkSync(path.join(tempDir, `${fileName}.class`)); } catch {}
    }
  }
};

module.exports = { executeCode };
