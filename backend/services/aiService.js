const logger = require('../config/logger');

// ─── Language-aware details for prompts & fallbacks ────────────────────────
const BOILERPLATE = {
  javascript: { name: 'JavaScript', runtime: 'Node.js / V8' },
  python:     { name: 'Python',     runtime: 'CPython 3.x' },
  cpp:        { name: 'C++',        runtime: 'g++ / clang++' },
  java:       { name: 'Java',       runtime: 'JDK 17+' },
};

/**
 * Clean markdown code blocks from model JSON outputs
 */
const cleanJsonString = (str) => {
  if (!str) return '';
  return str
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
};

/**
 * Call Groq API endpoint
 */
const callGroqAPI = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('Groq API Key missing. Falling back to Mock service.');
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Groq API response error', { status: response.status, error: errText });
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    logger.error('Failed calling Groq API', { error: error.message });
    return null;
  }
};

// ─── Explain Code ───────────────────────────────────────────────────────────

const explainCode = async (code, language) => {
  logger.info('AI Service: explainCode requested', { language });

  const systemPrompt = `You are a Senior Software Engineer. Explain the code provided by the user. Provide a concise, structured markdown response. Focus on readability, structure, runtime parameters, and runtime flow.`;
  const userPrompt = `Language: ${language}\nCode:\n${code}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    return { explanation: content, confidence: 0.95 };
  }

  // Fallback to mock
  const lang = BOILERPLATE[language] || BOILERPLATE.javascript;
  const lines = code.split('\n').filter(Boolean);
  const functionCount = (code.match(/function |const \w+ ?= ?\(|def |void |public static/g) || []).length;
  const loopCount = (code.match(/for |while |\.forEach|\.map/g) || []).length;

  return {
    explanation: [
      `## Code Explanation (${lang.name}) [Simulation Fallback]`,
      '',
      `This ${lang.name} program contains **${lines.length} lines** of code with approximately **${functionCount} function(s)** and **${loopCount} loop(s)**.`,
      '',
      '### Observations',
      `- **Runtime Environment**: Targets ${lang.runtime}`,
      `- **Complexity Indicators**: Loop Count: ${loopCount}, Functions: ${functionCount}`,
      '',
      '*(Note: Provide a valid GROQ_API_KEY in the .env file to enable dynamic AI generation.)*'
    ].join('\n'),
    confidence: 0.6,
  };
};

// ─── Bug Fix Suggestions ────────────────────────────────────────────────────

const suggestBugFixes = async (code, language) => {
  logger.info('AI Service: suggestBugFixes requested', { language });

  const systemPrompt = `You are an automated code auditor. Scan the code for bugs, type issues, memory safety violations, and security flaws.
Return a valid JSON array of objects. Respond ONLY with raw JSON (no markdown ticks, no extra sentences).
Format schema:
[
  { "severity": "error" | "warning" | "info", "message": "Short description of the bug and how to fix it" }
]`;
  const userPrompt = `Language: ${language}\nCode:\n${code}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    try {
      const cleaned = cleanJsonString(content);
      const suggestions = JSON.parse(cleaned);
      return { suggestions, analyzedLines: code.split('\n').length };
    } catch (parseError) {
      logger.error('Failed to parse Groq bugfix JSON response', { response: content });
    }
  }

  // Fallback to mock
  const suggestions = [];
  if (language === 'javascript') {
    if (code.includes('var ')) suggestions.push({ severity: 'warning', message: 'Replace `var` with `let`/`const` to avoid hoisting bugs and scope leakage.' });
    if (code.includes('==') && !code.includes('===')) suggestions.push({ severity: 'error', message: 'Use strict equality `===` instead of `==` to prevent type coercion bugs.' });
  } else {
    suggestions.push({ severity: 'info', message: 'No obvious bugs detected in simulation mode. Insert a valid GROQ_API_KEY for dynamic checks.' });
  }
  return { suggestions, analyzedLines: code.split('\n').length };
};

// ─── Code Optimization ──────────────────────────────────────────────────────

const optimizeCode = async (code, language) => {
  logger.info('AI Service: optimizeCode requested', { language });

  const systemPrompt = `You are a Senior Systems Architect. Suggest performance, memory, or readability optimizations for this code.
Return a valid JSON array of objects. Respond ONLY with raw JSON (no markdown ticks, no extra sentences).
Format schema:
[
  { "area": "Performance" | "Memory" | "Clean Code", "suggestion": "Description of optimization", "impact": "high" | "medium" | "low" }
]`;
  const userPrompt = `Language: ${language}\nCode:\n${code}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    try {
      const cleaned = cleanJsonString(content);
      const optimizations = JSON.parse(cleaned);
      return { optimizations };
    } catch (parseError) {
      logger.error('Failed to parse Groq optimization JSON response', { response: content });
    }
  }

  // Fallback to mock
  return {
    optimizations: [
      {
        area: 'Performance',
        suggestion: 'Ensure nested loop iterations are bounded. Enable GROQ_API_KEY to generate specific performance refactoring ideas.',
        impact: 'medium',
      }
    ],
  };
};

// ─── Complexity Analysis ────────────────────────────────────────────────────

const analyzeComplexity = async (code, language) => {
  logger.info('AI Service: analyzeComplexity requested', { language });

  const systemPrompt = `You are an algorithm analysis bot. Evaluate the Big-O Time and Space complexities of this code.
Return a valid JSON object. Respond ONLY with raw JSON (no markdown ticks, no extra sentences).
Format schema:
{
  "timeComplexity": "O(N) etc",
  "spaceComplexity": "O(1) etc",
  "details": {
    "loops": 0,
    "nestedLoops": 0,
    "recursivePatterns": 0,
    "totalLines": 0
  }
}`;
  const userPrompt = `Language: ${language}\nCode:\n${code}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    try {
      const cleaned = cleanJsonString(content);
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse Groq complexity JSON response', { response: content });
    }
  }

  // Fallback to mock
  return {
    timeComplexity: 'O(N) (Simulation)',
    spaceComplexity: 'O(1) (Simulation)',
    details: {
      loops: 1,
      nestedLoops: 0,
      recursivePatterns: 0,
      totalLines: code.split('\n').length,
    },
  };
};

// ─── Autocomplete Simulation ────────────────────────────────────────────────

const autocomplete = async (code, language, cursorPosition) => {
  logger.info('AI Service: autocomplete requested', { language });

  const systemPrompt = `You are a code completion system. Predict useful next tokens or lines.
Return a valid JSON object. Respond ONLY with raw JSON (no markdown ticks, no extra sentences).
Format schema:
{
  "suggestions": [
    { "label": "console.log()", "detail": "Print to stdout" }
  ]
}`;
  const userPrompt = `Language: ${language}\nCode:\n${code}\nCursorPosition: ${JSON.stringify(cursorPosition)}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    try {
      const cleaned = cleanJsonString(content);
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse Groq autocomplete JSON response', { response: content });
    }
  }

  // Fallback
  return {
    suggestions: [
      { label: 'console.log()', detail: 'Fallback print statement' }
    ],
  };
};

// ─── Interview Hints ────────────────────────────────────────────────────────

const interviewHints = async (code, language) => {
  logger.info('AI Service: interviewHints requested', { language });

  const systemPrompt = `You are a Technical Interviewer. Analyze the user's coding approach and suggest structural questions, edge cases, trade-offs, or follow-ups.
Return a valid JSON object. Respond ONLY with raw JSON (no markdown ticks, no extra sentences).
Format schema:
{
  "hints": [
    "What happens if the array is empty?",
    "Can we reduce space using a hashmap?"
  ]
}`;
  const userPrompt = `Language: ${language}\nCode:\n${code}`;

  const content = await callGroqAPI(systemPrompt, userPrompt);
  if (content) {
    try {
      const cleaned = cleanJsonString(content);
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse Groq hints JSON response', { response: content });
    }
  }

  // Fallback
  return {
    hints: [
      'Think about edge cases (null inputs, empty values).',
      'Be prepared to justify the time/space trade-offs.',
    ],
  };
};

const chat = async (code, language, message, history = []) => {
  logger.info('AI Service: chat requested', { language, historyLength: history?.length || 0 });

  const systemPrompt = `You are an AI coding chatbot assistant inside a real-time IDE. 
The current code written by the developer is:
\`\`\`${language}
${code}
\`\`\`

Analyze the code above and reply to the user's query. You can tell them errors, debug bugs, explain code structures, or write code snippets as requested. Respond in concise, developer-friendly markdown.`;

  const thread = [
    { role: 'system', content: systemPrompt }
  ];

  if (Array.isArray(history)) {
    history.forEach((msg) => {
      thread.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });
  }

  thread.push({ role: 'user', content: message });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('Groq API Key missing. Falling back to Mock chatbot response.');
    return {
      text: `🤖 **CodeCollab Chatbot [Simulation Mode]**\n\nI received your query: *"${message}"*\n\nTo enable live conversational queries with Llama-3, please configure a valid \`GROQ_API_KEY\` in your \`.env\` file.`
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: thread,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Groq Chatbot API response error', { status: response.status, error: errText });
      return { text: 'Sorry, I encountered an issue communicating with the AI service.' };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';
    return { text: reply };
  } catch (error) {
    logger.error('Failed calling Groq Chatbot API', { error: error.message });
    return { text: 'Sorry, I experienced a network error trying to reach the AI chatbot.' };
  }
};

module.exports = {
  explainCode,
  suggestBugFixes,
  optimizeCode,
  analyzeComplexity,
  autocomplete,
  interviewHints,
  chat,
};

