
/**
 * Security Utilities for ScamShield Pro
 * Implements defensive programming and input sanitization.
 */

const MAX_INPUT_LENGTH = 10000; // Limit to prevent DoS/overflow
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Sanitizes string input to prevent injection and remove control characters.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 1. Length enforcement
  let sanitized = input.slice(0, MAX_INPUT_LENGTH);
  
  // 2. Remove non-printable control characters (except newlines/tabs)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 3. Trim whitespace
  return sanitized.trim();
};

/**
 * Validates base64 image data.
 */
export const validateImageData = (base64: string): boolean => {
  if (!base64) return false;
  
  // Basic check for data URI format
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) return false;
  
  const mimeType = matches[1];
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Validates the structure of the AI response to prevent logic errors.
 */
export const validateAIResponse = (data: any): boolean => {
  const required = ['verdict', 'riskScore', 'reasoning', 'advice', 'indicators'];
  const hasFields = required.every(field => field in data);
  const validVerdict = ['SAFE', 'SUSPICIOUS', 'SCAM'].includes(data.verdict);
  const validScore = typeof data.riskScore === 'number' && data.riskScore >= 0 && data.riskScore <= 100;
  
  return hasFields && validVerdict && validScore;
};
