import fs from 'fs';
import path from 'path';
import firebaseConfig from '@/firebase-applet-config.json';
import { initialChurchData } from '@/lib/churchData';
import { ChurchSettings } from '@/lib/types';

const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const FIRESTORE_DOC_PATH = 'church_data';
const FIRESTORE_DOC_ID = 'main';

const SERVER_DATA_FILE = path.join('/tmp', 'church_data_persisted.json');
const LOCAL_PERSISTED_FILE = path.join(process.cwd(), 'data', 'church_data_persisted.json');

let inMemoryServerState: ChurchSettings = initialChurchData;

export function loadServerStateFromFile(): ChurchSettings {
  try {
    let candidateFile: string | null = null;
    let newestMtime = -1;

    if (fs.existsSync(LOCAL_PERSISTED_FILE)) {
      try {
        const stats = fs.statSync(LOCAL_PERSISTED_FILE);
        if (stats.mtimeMs > newestMtime) {
          newestMtime = stats.mtimeMs;
          candidateFile = LOCAL_PERSISTED_FILE;
        }
      } catch {}
    }
    if (fs.existsSync(SERVER_DATA_FILE)) {
      try {
        const stats = fs.statSync(SERVER_DATA_FILE);
        if (stats.mtimeMs > newestMtime) {
          newestMtime = stats.mtimeMs;
          candidateFile = SERVER_DATA_FILE;
        }
      } catch {}
    }

    if (candidateFile) {
      const raw = fs.readFileSync(candidateFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryServerState = { ...initialChurchData, ...parsed };
        return inMemoryServerState;
      }
    }
  } catch (err) {
    console.warn('Server file read notice:', err);
  }
  return inMemoryServerState;
}

export function saveServerStateToFile(data: Partial<ChurchSettings>): ChurchSettings {
  try {
    const current = loadServerStateFromFile();
    const updated: ChurchSettings = {
      ...initialChurchData,
      ...current,
      ...data,
      currentActivity: {
        ...initialChurchData.currentActivity,
        ...(current?.currentActivity || {}),
        ...(data?.currentActivity || {}),
      },
      editTimestamp: data.editTimestamp || Date.now(),
      lastUpdatedAt: new Date().toISOString(),
    };

    inMemoryServerState = updated;
    const serialized = JSON.stringify(updated, null, 2);

    try {
      const dir = path.dirname(LOCAL_PERSISTED_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LOCAL_PERSISTED_FILE, serialized, 'utf8');
    } catch (e) {
      console.warn('Could not write LOCAL_PERSISTED_FILE:', e);
    }

    try {
      fs.writeFileSync(SERVER_DATA_FILE, serialized, 'utf8');
    } catch (e) {
      console.warn('Could not write SERVER_DATA_FILE:', e);
    }

    return updated;
  } catch (err) {
    console.warn('Server file write notice:', err);
    return inMemoryServerState || initialChurchData;
  }
}

export function getFirestoreRestUrls() {
  const apiKey = firebaseConfig.apiKey || '';
  const keyParam = apiKey ? `?key=${apiKey}` : '';
  return [
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${FIRESTORE_DATABASE_ID}/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${keyParam}`,
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${keyParam}`,
  ];
}

export function parseFirestoreValue(val: any): any {
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

export function parseFirestoreRestDoc(docData: any): Record<string, any> | null {
  if (!docData || !docData.fields) return null;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(docData.fields)) {
    res[k] = parseFirestoreValue(v);
  }
  return res;
}

export function toFirestoreRestValue(val: any): any {
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

export function toFirestoreRestDoc(obj: Record<string, any>): { fields: Record<string, any> } {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreRestValue(v);
    }
  }
  return { fields };
}

export async function getChurchDataServer(): Promise<ChurchSettings> {
  const currentState = loadServerStateFromFile();
  return currentState || initialChurchData;
}
