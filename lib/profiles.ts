import { readFileSync } from 'fs';
import path from 'path';

export interface Profile {
  id: string;
  name: string;
}

let cachedProfiles: Profile[] | null = null;

export function getProfiles(): Profile[] {
  if (cachedProfiles) return cachedProfiles;
  const filePath = path.join(process.cwd(), 'data', 'profiles.json');
  const file = readFileSync(filePath, 'utf-8');
  cachedProfiles = JSON.parse(file) as Profile[];
  return cachedProfiles;
}

export function clearProfilesCache() {
  cachedProfiles = null;
}
