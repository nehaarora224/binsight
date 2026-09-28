import { readFile } from 'node:fs/promises';
import { config } from './config.js';

const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'OVERFLOW'];
const CATEGORIES = ['MIXED', 'ORGANIC', 'PLASTIC', 'DRY'];

const OUTCOME = {
  OVERFLOW: { priority: 'URGENT', action: 'Collect immediately' },
  HIGH: { priority: 'URGENT', action: 'Collect within 2 hours' },
  MEDIUM: { priority: 'NORMAL', action: "Collect on today's route" },
  LOW: { priority: 'LOW', action: 'No action needed today' },
};

export function levelFromFill(pct) {
  if (pct >= 95) return 'OVERFLOW';
  if (pct >= 70) return 'HIGH';
  if (pct >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Sends the image to the AI service (AI_SERVICE_URL/assess), which must answer
 * { "level": "LOW|MEDIUM|HIGH|OVERFLOW", "category": "MIXED|ORGANIC|PLASTIC|DRY" }.
 */
async function assessWithService(imagePath, mimeType) {
  const form = new FormData();
  form.append('image', new Blob([await readFile(imagePath)], { type: mimeType }), 'capture');
  const res = await fetch(new URL('/assess', config.aiServiceUrl), { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`AI service responded ${res.status}`);
  const { level, category } = await res.json();
  if (!LEVELS.includes(level) || !CATEGORIES.includes(category)) throw new Error('AI service returned an unknown level or category');
  return { level, category, source: 'model' };
}

/**
 * Returns level, category, priority and recommended action for a captured image.
 * Until a trained model is connected, the level and category come from the point's
 * last recorded condition (source: 'rules').
 */
export async function assessImage({ imagePath, mimeType, point }) {
  const base = config.aiServiceUrl
    ? await assessWithService(imagePath, mimeType)
    : { level: levelFromFill(point.fill_pct), category: point.category, source: 'rules' };
  return { ...base, ...OUTCOME[base.level] };
}
