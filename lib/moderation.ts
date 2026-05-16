// lib/moderation.ts
import { checkHateSpeech } from './hateSpeech';

const AUTO_BLOCK_THRESHOLD = 0.90;
const AUTO_FLAG_THRESHOLD = 0.70;

export interface ModerationResult {
  allowed: boolean;
  flagged: boolean;
  message: string | null;
  score: number;
  categories: string[];
  language: string;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const result = await checkHateSpeech(text);

  if (!result.success || !result.data) {
    // If API fails, allow the post (fail-safe)
    return {
      allowed: true,
      flagged: false,
      message: null,
      score: 0,
      categories: [],
      language: ''
    };
  }

  const score = result.data.toxicity_score;
  const categories = result.data.toxic_categories || [];

  let message: string | null = null;
  let allowed = true;
  let flagged = false;

  if (score >= AUTO_BLOCK_THRESHOLD) {
    allowed = false;
    message = "⚠️ Your content contains hate speech and cannot be posted.";
  } else if (score >= AUTO_FLAG_THRESHOLD) {
    flagged = true;
    message = "⚠️ Your post has been flagged for review.";
  }

  return {
    allowed,
    flagged,
    message,
    score,
    categories,
    language: result.data.language || ''
  };
}