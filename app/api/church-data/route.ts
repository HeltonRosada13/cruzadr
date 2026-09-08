import { NextResponse } from 'next/server';
import { initialChurchData } from '@/lib/churchData';
import {
  getChurchDataServer,
  loadServerStateFromFile,
  saveServerStateToFile,
  getFirestoreRestUrls,
  toFirestoreRestDoc,
} from '@/lib/churchDataServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const data = await getChurchDataServer();
  return NextResponse.json(
    {
      success: true,
      data: data || initialChurchData,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const editTimestamp = body.editTimestamp || Date.now();
    const currentState = loadServerStateFromFile();
    const merged = {
      ...initialChurchData,
      ...currentState,
      ...body,
      currentActivity: {
        ...initialChurchData.currentActivity,
        ...(currentState?.currentActivity || {}),
        ...(body?.currentActivity || {}),
      },
      editTimestamp,
      lastUpdatedAt: new Date().toISOString(),
    };

    // 1. Immediately save to server filesystem and memory cache
    saveServerStateToFile(merged);

    // 2. Sync to cloud Firestore in background
    const payload = toFirestoreRestDoc(merged);
    const urls = getFirestoreRestUrls();

    for (const url of urls) {
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn('Background Firestore sync notice:', err?.message || err);
      });
    }

    return NextResponse.json(
      { success: true, data: merged },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('API POST /api/church-data error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

