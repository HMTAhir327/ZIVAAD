import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { getAdminWriteBlockMessage, isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { sanitizeSiteContent } from '@/lib/site-content';
import { readSiteContentFile, writeSiteContentFile } from '@/lib/site-content-storage';

export async function GET() {
  if (!isAdminUiEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const file = await readSiteContentFile();
  const siteContent = JSON.parse(file);

  return NextResponse.json({ ok: true, siteContent });
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
    const siteContent = sanitizeSiteContent(body?.siteContent);

    await writeSiteContentFile(`${JSON.stringify(siteContent, null, 2)}\n`);
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/collection');
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/admin');

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save site content';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
