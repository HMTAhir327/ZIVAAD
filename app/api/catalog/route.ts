import { NextResponse } from 'next/server';

import { getProducts } from '@/lib/products';

export async function GET() {
  try {
    const products = await getProducts();
    const payload = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      compare_price: product.compare_price,
      category: product.category,
      primary_image_url: product.primary_image_url || product.images?.[0] || '',
      images: product.images || [],
      badge: product.badge,
      stock: product.stock
    }));

    return NextResponse.json({ ok: true, products: payload });
  } catch {
    return NextResponse.json({ ok: false, products: [] }, { status: 500 });
  }
}
