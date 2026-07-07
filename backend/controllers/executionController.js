const Execution = require('../models/Execution');
const User = require('../models/User');
const { executeCode } = require('../services/executionService');
const { asyncHandler, AppError } = require('../utils/helpers');
const logger = require('../config/logger');

// POST /api/execute
const runCode = asyncHandler(async (req, res) => {
  const { code, language } = req.body;

  if (!code || !code.trim()) {
    throw new AppError('Code is required', 400);
  }

  const supportedLanguages = ['javascript', 'python', 'cpp', 'java'];
  if (!supportedLanguages.includes(language)) {
    throw new AppError(`Unsupported language. Supported: ${supportedLanguages.join(', ')}`, 400);
  }

  logger.info('Code execution requested', {
    userId: req.user.id,
    language,
    codeLength: code.length,
  });

  const result = await executeCode(code, language);

  // Persist execution record
  const execution = await Execution.create({
    user: req.user.id,
    language,
    code: code.slice(0, 5000), // cap stored code size
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    executionTime: result.executionTime,
    status: result.exitCode === 0 ? 'success' : result.exitCode === 124 ? 'timeout' : 'error',
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { totalExecutions: 1 },
  });

  res.json({
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    executionTime: result.executionTime,
    executionId: execution._id,
  });
});

// GET /api/execute/history
const getHistory = asyncHandler(async (req, res) => {
  const executions = await Execution.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('-code')
    .lean();

  res.json({ executions });
});

module.exports = { runCode, getHistory };
