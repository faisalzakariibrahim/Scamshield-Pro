
/**
 * ScamShield Pro - Security Kernel v4.3
 * Secondary Defense Layer (Client-Side).
 * Authority always remains with the Backend.
 */

const MAX_INPUT_LENGTH = 5000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const normalizeUrls = (input: string): string => {
  return input.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    try {
      const decoded = decodeURIComponent(url);
      const urlObj = new URL(decoded);
      const paramsToRemove = ['utm_source', 'utm_medium', 'clickid', 'fbclid', 'gclid'];
      paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
      return urlObj.toString();
    } catch {
      return url;
    }
  });
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input.slice(0, MAX_INPUT_LENGTH);
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Basic HTML strip on client side
  sanitized = sanitized.replace(/<[^>]*>?/gm, '');
  sanitized = normalizeUrls(sanitized);

  return sanitized.trim();
};

export const validateImageData = (base64: string): boolean => {
  if (!base64 || base64.length > 3 * 1024 * 1024) return false; 
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) return false;
  return ALLOWED_MIME_TYPES.includes(matches[1]);
};

export const validateAIResponse = (data: any): boolean => {
  // Client side structural check
  return !!(data && data.verdict && typeof data.risk_score === 'number');
};
