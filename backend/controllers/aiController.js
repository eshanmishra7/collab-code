const aiService = require('../services/aiService');
const { asyncHandler, AppError } = require('../utils/helpers');

// POST /api/ai/explain
const explain = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.explainCode(code, language || 'javascript');
  res.json(result);
});

// POST /api/ai/bugfix
const bugfix = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.suggestBugFixes(code, language || 'javascript');
  res.json(result);
});

// POST /api/ai/optimize
const optimize = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.optimizeCode(code, language || 'javascript');
  res.json(result);
});

// POST /api/ai/complexity
const complexity = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.analyzeComplexity(code, language || 'javascript');
  res.json(result);
});

// POST /api/ai/autocomplete
const autocomplete = asyncHandler(async (req, res) => {
  const { code, language, cursorPosition } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.autocomplete(code, language || 'javascript', cursorPosition);
  res.json(result);
});

// POST /api/ai/interview-hints
const hints = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  const result = await aiService.interviewHints(code, language || 'javascript');
  res.json(result);
});

// POST /api/ai/chat
const chat = asyncHandler(async (req, res) => {
  const { code, language, message, history } = req.body;
  if (!code) throw new AppError('Code is required', 400);
  if (!message) throw new AppError('Message is required', 400);
  const result = await aiService.chat(code, language || 'javascript', message, history || []);
  res.json(result);
});

module.exports = { explain, bugfix, optimize, complexity, autocomplete, hints, chat };

