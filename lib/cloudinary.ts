const CLOUDINARY_UPLOAD_SEGMENT = '/upload/';
const CLOUDINARY_HOST = 'res.cloudinary.com';
const KNOWN_TRANSFORMATION_KEYS = new Set([
  'a',
  'ac',
  'af',
  'ao',
  'ar',
  'b',
  'bl',
  'bo',
  'br',
  'c',
  'co',
  'd',
  'dl',
  'dn',
  'dpr',
  'du',
  'e',
  'eo',
  'f',
  'fl',
  'fn',
  'fps',
  'g',
  'h',
  'if',
  'ki',
  'l',
  'o',
  'p',
  'pg',
  'q',
  'r',
  'so',
  'sp',
  't',
  'u',
  'vc',
  'vs',
  'w',
  'x',
  'y',
  'z'
]);

function isCloudinaryDeliveryUrl(url: string): boolean {
  return url.includes(CLOUDINARY_HOST) && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

function isTransformationSegment(segment: string): boolean {
  if (!segment || !segment.includes('_')) {
    return false;
  }

  const tokens = segment.split(',');
  return tokens.every((token) => {
    const underscoreIndex = token.indexOf('_');
    if (underscoreIndex <= 0) {
      return false;
    }

    const key = token.slice(0, underscoreIndex);
    return KNOWN_TRANSFORMATION_KEYS.has(key);
  });
}

function replaceCloudinaryTransformation(url: string, transformation: string): string {
  const trimmed = url.trim();
  if (!isCloudinaryDeliveryUrl(trimmed) || !transformation) {
    return trimmed;
  }

  const [prefix, remainder] = trimmed.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (remainder === undefined) {
    return trimmed;
  }

  const segments = remainder.split('/');
  const firstSegment = segments[0] || '';
  const pathSegments = isTransformationSegment(firstSegment) ? segments.slice(1) : segments;
  const cleanedPath = pathSegments.join('/');

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/${cleanedPath}`;
}

export function optimizeCloudinaryForProductCardImage(url: string): string {
  return replaceCloudinaryTransformation(url, 'f_auto,q_auto,w_500,c_limit');
}

export function optimizeCloudinaryForHeroBannerImage(url: string): string {
  return replaceCloudinaryTransformation(url, 'f_auto,q_auto,w_1600,c_limit');
}

export function optimizeCloudinaryForVideoStorage(url: string): string {
  return replaceCloudinaryTransformation(url, 'f_auto,q_auto');
}

export function optimizeCloudinaryForImageStorage(url: string): string {
  return replaceCloudinaryTransformation(url, 'f_auto,q_auto');
}

export function optimizeCloudinaryImage(url: string, width = 1200): string {
  const trimmed = url.trim();
  if (!isCloudinaryDeliveryUrl(trimmed)) {
    return trimmed;
  }

  const transformation = `f_auto,q_auto,w_${width},c_limit`;
  return replaceCloudinaryTransformation(trimmed, transformation);
}

export function optimizeCloudinaryVideo(url: string, width = 1920): string {
  const trimmed = url.trim();
  if (!isCloudinaryDeliveryUrl(trimmed)) {
    return trimmed;
  }

  const cappedWidth = Math.min(width, 1920);
  const transformation = `f_auto,q_auto,w_${cappedWidth},h_1080,c_limit`;
  return replaceCloudinaryTransformation(trimmed, transformation);
}
