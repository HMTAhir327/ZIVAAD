const WRITE_BLOCK_MESSAGE =
  'Admin writes are disabled in production. Update JSON locally with npm run dev, then deploy.';
const UI_BLOCK_MESSAGE = 'Admin is available only in local development mode.';

function normalizeFlag(value: string | undefined): 'true' | 'false' | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return 'true';
  if (['0', 'false', 'no', 'off'].includes(normalized)) return 'false';
  return null;
}

export function isAdminWriteEnabled(): boolean {
  const envFlag = normalizeFlag(process.env.ADMIN_LOCAL_WRITE_MODE);
  if (envFlag === 'true') return true;
  if (envFlag === 'false') return false;
  if (process.env.VERCEL === '1') return false;
  return true;
}

export function isAdminUiEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getAdminWriteBlockMessage(): string {
  return WRITE_BLOCK_MESSAGE;
}

export function getAdminUiBlockMessage(): string {
  return UI_BLOCK_MESSAGE;
}
