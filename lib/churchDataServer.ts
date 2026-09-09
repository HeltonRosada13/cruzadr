import fs from 'fs';
import path from 'path';
import firebaseConfig from '@/firebase-applet-config.json';
import { initialChurchData, hasUserContent } from '@/lib/churchData';
import { ChurchSettings } from '@/lib/types';

const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const FIRESTORE_DOC_PATH = 'church_data';
const FIRESTORE_DOC_ID = 'main';

const SERVER_DATA_FILE = path.join('/tmp', 'church_data_persisted.json');
const LOCAL_PERSISTED_FILE = path.join(process.cwd(), 'data', 'church_data_persisted.json');
const BACKUP_PERSISTED_FILE = path.join(process.cwd(), 'data', 'church_data_backup.json');

let inMemoryServerState: ChurchSettings = initialChurchData;

function safeParseJson(filePath: string): ChurchSettings | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || raw.trim().length === 0) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...initialChurchData, ...parsed };
    }
  } catch (err) {
    console.warn(`Notice reading ${filePath}:`, err);
  }
  return null;
}

export function loadServerStateFromFile(): ChurchSettings {
  try {
    const candidates: ChurchSettings[] = [];

    // 1. Check in-memory state
    if (inMemoryServerState && (hasUserContent(inMemoryServerState) || (inMemoryServerState.editTimestamp || 0) > 0)) {
      candidates.push(inMemoryServerState);
    }

    // 2. Check local data file
    const localData = safeParseJson(LOCAL_PERSISTED_FILE);
    if (localData) candidates.push(localData);

    // 3. Check backup file
    const backupData = safeParseJson(BACKUP_PERSISTED_FILE);
    if (backupData) candidates.push(backupData);

    // 4. Check /tmp file
    const tmpData = safeParseJson(SERVER_DATA_FILE);
    if (tmpData) candidates.push(tmpData);

    if (candidates.length === 0) {
      return inMemoryServerState || initialChurchData;
    }

    // Filter candidates that have actual user content
    const withContent = candidates.filter((c) => hasUserContent(c));
    const pool = withContent.length > 0 ? withContent : candidates;

    // Pick candidate with highest editTimestamp
    pool.sort((a, b) => (b.editTimestamp || 0) - (a.editTimestamp || 0));
    const best = pool[0];

    inMemoryServerState = best;
    return best;
  } catch (err) {
    console.warn('Server load notice:', err);
    return inMemoryServerState || initialChurchData;
  }
}

export function saveServerStateToFile(data: Partial<ChurchSettings> & { isExplicitReset?: boolean }): ChurchSettings {
  try {
    const current = loadServerStateFromFile();
    const isExplicit = Boolean(data.isExplicitReset);

    // If existing data has user content, but incoming data is empty and not explicit reset, preserve existing!
    if (hasUserContent(current) && !hasUserContent(data) && !isExplicit) {
      console.warn('[Server Guard] Prevented overwriting populated church data with empty payload.');
      return current;
    }

    const editTimestamp = data.editTimestamp || Date.now();
    const updated: ChurchSettings = {
      ...initialChurchData,
      ...current,
      ...data,
      currentActivity: {
        ...initialChurchData.currentActivity,
        ...(current?.currentActivity || {}),
        ...(data?.currentActivity || {}),
      },
      editTimestamp,
      lastUpdatedAt: new Date().toISOString(),
    };

    inMemoryServerState = updated;
    const serialized = JSON.stringify(updated, null, 2);

    const writeSafe = (targetPath: string) => {
      try {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const tempPath = `${targetPath}.tmp.${Date.now()}`;
        fs.writeFileSync(tempPath, serialized, 'utf8');
        fs.renameSync(tempPath, targetPath);
      } catch (err) {
        try {
          fs.writeFileSync(targetPath, serialized, 'utf8');
        } catch (e) {
          console.warn(`Write notice for ${targetPath}:`, e);
        }
      }
    };

    writeSafe(LOCAL_PERSISTED_FILE);
    writeSafe(BACKUP_PERSISTED_FILE);
    writeSafe(SERVER_DATA_FILE);

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
