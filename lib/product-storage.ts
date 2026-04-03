import { promises as fs } from 'fs';
import path from 'path';

const sourceProductsPath = path.join(process.cwd(), 'data', 'products.json');

export async function readProductsFile(): Promise<string> {
  return fs.readFile(sourceProductsPath, 'utf-8');
}

export async function writeProductsFile(content: string) {
  await fs.writeFile(sourceProductsPath, content, 'utf-8');
}
