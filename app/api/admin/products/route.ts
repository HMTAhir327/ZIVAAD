import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { sanitizeProducts } from '@/lib/admin';
import { getAdminWriteBlockMessage, isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { readProductsFile, writeProductsFile } from '@/lib/product-storage';

export async function GET() {
  if (!isAdminUiEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const file = await readProductsFile();
  const products = JSON.parse(file);

  return NextResponse.json({ ok: true, products });
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminUiEnabled()) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    if (!isAdminWriteEnabled()) {
      return NextResponse.json({ ok: false, error: getAdminWriteBlockMessage() }, { status: 403 });
    }

    const body = await request.json();
    const products = sanitizeProducts(body?.products);

    await writeProductsFile(`${JSON.stringify(products, null, 2)}\n`);
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/collection');
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/admin');

    return NextResponse.json({ ok: true, count: products.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save products';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
