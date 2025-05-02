import { encode } from 'gpt-tokenizer';

export function estimateTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return text.length; // fallback
  }
}