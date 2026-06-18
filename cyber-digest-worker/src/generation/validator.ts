import type { CyberEvent } from '../types';
import type { GeneratedContent as GenContentLocal } from './generator';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateContent(content: GenContentLocal, sourceEvents: CyberEvent[], type: 'news' | 'blog' | 'article'): ValidationResult {
  // 1. Confidence Threshold
  if (content.confidence_score < 0.6) {
    return { isValid: false, reason: `Low confidence score (${content.confidence_score})` };
  }

  // 2. Minimum length checks based on type
  const wordCount = content.content.split(/\s+/).length;
  if (type === 'news' && wordCount < 250) {
    return { isValid: false, reason: `News content too short (${wordCount} words, min 250)` };
  }
  if (type === 'blog' && wordCount < 500) {
    return { isValid: false, reason: `Blog content too short (${wordCount} words, min 500)` };
  }
  if (type === 'article' && wordCount < 800) {
    return { isValid: false, reason: `Article content too short (${wordCount} words, min 800)` };
  }

  const contentLower = content.content.toLowerCase();

  // 3. Blocklist check (no attack instructions)
  const blocklist = ['step 1: exploit', 'how to hack', 'compile the exploit', 'payload generation'];
  for (const term of blocklist) {
    if (contentLower.includes(term)) {
      return { isValid: false, reason: 'Contains blocked terms (potential attack instructions)' };
    }
  }

  // 4. CVE Validation (if it mentions a CVE, ensure it's in the source data)
  const cveMatches = content.content.match(/CVE-\d{4}-\d{4,7}/gi);
  if (cveMatches) {
    const sourceCves = new Set(sourceEvents.map(e => e.cve_id).filter(Boolean));
    for (const match of cveMatches) {
      const cve = match.toUpperCase();
      // Only strictly enforce if the source data actually had CVEs.
      // If sources had CVEs, and the generated content mentions a DIFFERENT one, that's a hallucination.
      if (sourceCves.size > 0 && !sourceCves.has(cve)) {
         // Allow a bit of leeway if it's just mentioning a historic CVE as context,
         // but strictly, it's safer to reject.
         return { isValid: false, reason: `Hallucinated CVE detected: ${cve}` };
      }
    }
  }

  return { isValid: true };
}
