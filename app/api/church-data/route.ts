import { NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';
import { initialChurchData } from '@/lib/churchData';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FIRESTORE_DATABASE_ID =
  firebaseConfig.firestoreDatabaseId ||
  'ai-studio-igrejacatedralde-1689f903-4252-4c97-842d-c7bb1fa516bf';
const FIRESTORE_DOC_PATH = 'church_data';
const FIRESTORE_DOC_ID = 'main';

// Server-side persistent storage file path
const SERVER_DATA_FILE = path.join('/tmp', 'church_data_persisted.json');

// In-memory server cache
let serverState: any = null;

function loadServerStateFromFile(): any {
  if (serverState) return serverState;
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        serverState = { ...initialChurchData, ...parsed };
        return serverState;
      }
    }
  } catch (err) {
    console.warn('Server file read notice:', err);
  }
  serverState = { ...initialChurchData };
  return serverState;
}

function saveServerStateToFile(data: any) {
  try {
    serverState = { ...initialChurchData, ...data };
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(serverState, null, 2), 'utf8');
  } catch (err) {
    console.warn('Server file write notice:', err);
  }
}

// Initial load
loadServerStateFromFile();

function getFirestoreRestUrls() {
  const apiKey = firebaseConfig.apiKey || '';
  const keyParam = apiKey ? `?key=${apiKey}` : '';
  const urls = [
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${FIRESTORE_DATABASE_ID}/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${keyParam}`,
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${keyParam}`,
  ];
  return urls;
}

function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function parseFirestoreRestDoc(docData: any): Record<string, any> | null {
  if (!docData || !docData.fields) return null;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(docData.fields)) {
    res[k] = parseFirestoreValue(v);
  }
  return res;
}

function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreRestValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreRestDoc(obj: Record<string, any>): { fields: Record<string, any> } {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreRestValue(v);
    }
  }
  return { fields };
}

export async function GET() {
  const currentState = loadServerStateFromFile();

  const urls = getFirestoreRestUrls();
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = parseFirestoreRestDoc(data);
        if (parsed) {
          const remoteTs = typeof parsed.editTimestamp === 'number'
            ? parsed.editTimestamp
            : (parsed.lastUpdatedAt ? new Date(parsed.lastUpdatedAt).getTime() : 0);
          const serverTs = typeof currentState?.editTimestamp === 'number'
            ? currentState.editTimestamp
            : 0;

          // If remote is newer or equals, merge and cache
          if (remoteTs >= serverTs) {
            const merged = {
              ...initialChurchData,
              ...currentState,
              ...parsed,
            };
            saveServerStateToFile(merged);
            return NextResponse.json({
              success: true,
              data: merged,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`API GET /api/church-data error on ${url}:`, error);
    }
  }

  // Return server stored state (which holds the user's latest edits across sessions/browsers)
  return NextResponse.json({
    success: true,
    data: currentState || initialChurchData,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const editTimestamp = body.editTimestamp || Date.now();
    const merged = {
      ...initialChurchData,
      ...loadServerStateFromFile(),
      ...body,
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

    return NextResponse.json({ success: true, data: merged });
  } catch (error: any) {
    console.error('API POST /api/church-data error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

