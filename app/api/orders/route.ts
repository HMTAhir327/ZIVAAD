import { NextRequest, NextResponse } from 'next/server';

interface OrderItem {
  line_id?: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant_id?: string;
  variant_sku?: string;
  variant_title?: string;
  selected_options?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = body?.items as OrderItem[] | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Order items are required.' }, { status: 400 });
    }

    const total = Number(body?.total) || 0;
    const currency = typeof body?.currency === 'string' ? body.currency : 'PKR';
    const customer = body?.customer ?? null;
    const source = typeof body?.source === 'string' ? body.source : 'web';

    const forwarded = request.headers.get('x-forwarded-for');
    const userIp = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;

    const payload = {
      timestamp: new Date().toISOString(),
      items: items.map((item) => ({
        line_id: item.line_id || item.id,
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        line_total: item.price * item.quantity,
        variant_id: item.variant_id || null,
        variant_sku: item.variant_sku || null,
        variant_title: item.variant_title || null,
        selected_options: item.selected_options || null
      })),
      total,
      currency,
      customer,
      source,
      ip: userIp,
      user_agent: request.headers.get('user-agent') || null
    };

    const webhookUrl = process.env.ORDER_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ ok: true, backedUp: false, warning: 'ORDER_WEBHOOK_URL is not configured.' });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      if (!response.ok) {
        return NextResponse.json({ ok: true, backedUp: false, warning: 'Webhook accepted request with non-2xx response.' });
      }

      return NextResponse.json({ ok: true, backedUp: true });
    } catch {
      return NextResponse.json({ ok: true, backedUp: false, warning: 'Backup webhook failed, proceeding with checkout.' });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request payload.' }, { status: 400 });
  }
}
