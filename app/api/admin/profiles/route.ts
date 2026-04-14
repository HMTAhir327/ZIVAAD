import { NextRequest, NextResponse } from 'next/server';
import { getProfiles, clearProfilesCache } from '@/lib/profiles';
import { isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export async function GET() {
  if (!isAdminUiEnabled()) {
    return NextResponse.json({ ok: false, profiles: [] }, { status: 404 });
  }
  const profiles = getProfiles();
  return NextResponse.json({ ok: true, profiles });
}

export async function POST(request: NextRequest) {
  if (!isAdminUiEnabled() || !isAdminWriteEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Name required' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'data', 'profiles.json');
  const profiles = JSON.parse(readFileSync(filePath, 'utf-8'));

  const exists = profiles.some((p: { name: string }) => p.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    const existing = profiles.find((p: { name: string }) => p.name.toLowerCase() === name.toLowerCase());
    return NextResponse.json({ ok: true, id: existing.id });
  }

  const newId = `p-${String(profiles.length + 1).padStart(3, '0')}`;
  profiles.push({ id: newId, name });
  writeFileSync(filePath, JSON.stringify(profiles, null, 2) + '\n');
  clearProfilesCache();

  return NextResponse.json({ ok: true, id: newId });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminUiEnabled() || !isAdminWriteEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 });
  }

  const body = await request.json();
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'data', 'profiles.json');
  const profiles = JSON.parse(readFileSync(filePath, 'utf-8'));
  const filtered = profiles.filter((p: { id: string }) => p.id !== id);

  if (filtered.length === profiles.length) {
    return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 });
  }

  writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n');
  clearProfilesCache();

  return NextResponse.json({ ok: true });
}
