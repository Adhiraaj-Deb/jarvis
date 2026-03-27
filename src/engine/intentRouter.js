/**
 * intentRouter.js
 * Determines whether a command should go to the complex model (Llama 70B)
 * or the fast model (GLM 4.5 Air / Qwen).
 *
 * Strategy: Send to complex ONLY for heavy reasoning tasks.
 * Definitions, facts, music, reminders → fast model (cheaper, faster).
 */

/** Commands that are fast/simple → GLM Air */
const SIMPLE_KEYWORDS = [
  // Actions
  'open', 'launch', 'play', 'stop', 'pause', 'resume',
  'set alarm', 'set timer', 'set reminder', 'remind me',
  'create task', 'add task', 'add reminder',
  'call', 'time', 'date', 'day', 'weather',
  'volume', 'mute', 'turn on', 'turn off',
  'flashlight', 'torch', 'calculator', 'camera',
  // Factual lookups (short answers) → fast model is fine
  'define', 'definition', 'meaning of', 'what does', 'what is',
  'who is', 'who was', 'tell me about', 'what are',
]

/** Commands that need deep reasoning → Llama 70B */
const COMPLEX_KEYWORDS = [
  'explain', 'how do', 'how to', 'how does',
  'summarise', 'summarize', 'read', 'translate',
  'difference between', 'compare', 'analyse', 'analyze',
  'write', 'compose', 'create a', 'help me write',
  'give me a list', 'list all', 'pros and cons',
  'why does', 'why is', 'why are',
]

/**
 * @param {string} transcript
 * @returns {'simple'|'complex'}
 */
export function getComplexity(transcript) {
  const lower = transcript.toLowerCase()

  // Complex keywords checked first (override simple keywords)
  for (const kw of COMPLEX_KEYWORDS) {
    if (lower.includes(kw)) return 'complex'
  }
  for (const kw of SIMPLE_KEYWORDS) {
    if (lower.includes(kw)) return 'simple'
  }

  // Short commands (≤6 words) are likely simple
  const wordCount = transcript.trim().split(/\s+/).length
  return wordCount <= 6 ? 'simple' : 'complex'
}
