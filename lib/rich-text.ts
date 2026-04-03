const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4',
  'a',
  'span',
  'div'
]);

function hasHtmlTags(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function convertPlainTextToHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`);

  return paragraphs.join('');
}

export function sanitizeRichTextHtml(value: string): string {
  const raw = value || '';
  if (!raw.trim()) {
    return '';
  }

  let sanitized = raw;

  sanitized = sanitized.replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
  sanitized = sanitized.replace(
    /\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi,
    ' $1="#"'
  );

  sanitized = sanitized.replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (full, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    const isClosing = full.startsWith('</');

    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    if (tag === 'a') {
      const hrefMatch = attrs.match(/\shref\s*=\s*(['"])(.*?)\1/i);
      const href = hrefMatch?.[2]?.trim() || '#';
      const safeHref = /^https?:\/\//i.test(href) ? href : '#';
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">`;
    }

    return `<${tag}>`;
  });

  return sanitized.trim();
}

export function normalizeDescriptionForEditor(value: string): string {
  if (!value?.trim()) {
    return '';
  }

  if (hasHtmlTags(value)) {
    return sanitizeRichTextHtml(value);
  }

  return convertPlainTextToHtml(value);
}

export function renderRichTextHtml(value: string): string {
  if (!value?.trim()) {
    return '';
  }

  if (hasHtmlTags(value)) {
    return sanitizeRichTextHtml(value);
  }

  return convertPlainTextToHtml(value);
}

export function stripRichTextToPlainText(value: string): string {
  if (!value?.trim()) {
    return '';
  }

  const html = hasHtmlTags(value) ? sanitizeRichTextHtml(value) : convertPlainTextToHtml(value);
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h2|h3|h4|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

