import { createHash } from 'node:crypto';

/** Identificador estável para deduplicar imagens (hash da URL img_src). */
export function imageIdFromSrc(imgSrc: string): string {
  return createHash('sha256').update(imgSrc.trim()).digest('hex').slice(0, 16);
}

export function pickImageSrc(result: {
  img_src?: string;
  thumbnail_src?: string;
}): string | null {
  return result.img_src ?? result.thumbnail_src ?? null;
}

export function shouldUseImageSearch(searchType: string): boolean {
  return ['suppliers', 'market_research', 'comparison'].includes(searchType);
}
