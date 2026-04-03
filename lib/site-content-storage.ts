import { promises as fs } from 'fs';
import path from 'path';

const sourceSiteContentPath = path.join(process.cwd(), 'data', 'site-content.json');

export async function readSiteContentFile(): Promise<string> {
  return fs.readFile(sourceSiteContentPath, 'utf-8');
}

export async function writeSiteContentFile(content: string) {
  await fs.writeFile(sourceSiteContentPath, content, 'utf-8');
}

