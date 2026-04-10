'use server';

import { revalidatePath } from 'next/cache';

import { sanitizeProducts } from '@/lib/admin';
import { getAdminUiBlockMessage, getAdminWriteBlockMessage, isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { sanitizeSiteContent } from '@/lib/site-content';
import { writeProductsFile } from '@/lib/product-storage';
import { writeSiteContentFile } from '@/lib/site-content-storage';
import type { Product, SiteContent } from '@/lib/types';

export async function saveProductsAction(products: Product[]) {
  try {
    if (!isAdminUiEnabled()) {
      return { ok: false, error: getAdminUiBlockMessage() };
    }

    if (!isAdminWriteEnabled()) {
      return { ok: false, error: getAdminWriteBlockMessage() };
    }

    const sanitizedProducts = sanitizeProducts(products);
    await writeProductsFile(`${JSON.stringify(sanitizedProducts, null, 2)}\n`);

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/collection');
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/admin');
    revalidatePath('/admin/product/new');
    revalidatePath('/admin/product/[id]', 'page');

    return { ok: true, count: sanitizedProducts.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save products';
    return { ok: false, error: message };
  }
}

export async function saveSiteContentAction(content: SiteContent) {
  try {
    if (!isAdminUiEnabled()) {
      return { ok: false, error: getAdminUiBlockMessage() };
    }

    if (!isAdminWriteEnabled()) {
      return { ok: false, error: getAdminWriteBlockMessage() };
    }

    const sanitizedContent = sanitizeSiteContent(content);
    await writeSiteContentFile(`${JSON.stringify(sanitizedContent, null, 2)}\n`);

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/collection');
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/admin');
    revalidatePath('/admin/product/new');
    revalidatePath('/admin/product/[id]', 'page');

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save content';
    return { ok: false, error: message };
  }
}
