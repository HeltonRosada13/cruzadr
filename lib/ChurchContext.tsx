'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { ChurchSettings, ChurchActivity, PhotoItem, VideoItem, ChurchEvent, SocialLink, HighlightMoment, Testimony, CoordinationGroup } from './types';
import { initialChurchData } from './churchData';
import { db, doc, setDoc, onSnapshot, handleFirestoreError, OperationType } from './firebase';
import { deleteVideoFileBlob, clearAllStoredVideoBlobs, clearHeroVideoBlob } from './videoStorage';
import firebaseConfig from '../firebase-applet-config.json';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'quota_exceeded' | 'ready';

interface ChurchContextType {
  data: ChurchSettings;
  isReady: boolean;
  updateCurrentActivity: (activity: Partial<ChurchActivity>) => void;
  updateChurchInfo: (info: Partial<ChurchSettings>) => void;
  addPhoto: (photo: Omit<PhotoItem, 'id'>) => void;
  addBatchPhotos: (photos: Omit<PhotoItem, 'id'>[]) => void;
  updatePhoto: (id: string, updated: Partial<PhotoItem>) => void;
  removePhoto: (id: string) => void;
  addVideo: (video: Omit<VideoItem, 'id'> & { id?: string }) => void;
  addBatchVideos: (videos: (Omit<VideoItem, 'id'> & { id?: string })[]) => void;
  updateVideo: (id: string, updated: Partial<VideoItem>) => void;
  removeVideo: (id: string) => void;
  setPrimaryFeaturedVideo: (id: string) => void;
  resetVideosToDefaults: () => void;
  clearAllOldVideos: () => void;
  addUpcomingEvent: (event: Omit<ChurchEvent, 'id'>) => void;
  updateUpcomingEvent: (id: string, updated: Partial<ChurchEvent>) => void;
  removeUpcomingEvent: (id: string) => void;
  addSocialLink: (link: Omit<SocialLink, 'id'> & { id?: string }) => void;
  addBatchSocialLinks: (links: (Omit<SocialLink, 'id'> & { id?: string })[]) => void;
  updateSocialLink: (id: string, updated: Partial<SocialLink>) => void;
  removeSocialLink: (id: string) => void;
  resetSocialLinksToDefaults: () => void;
  addHighlight: (item: Omit<HighlightMoment, 'id'>) => void;
  updateHighlight: (id: string, updated: Partial<HighlightMoment>) => void;
  removeHighlight: (id: string) => void;
  resetHighlightsToDefaults: () => void;
  addTestimony: (testimony: Omit<Testimony, 'id'>) => void;
  updateTestimony: (id: string, updated: Partial<Testimony>) => void;
  removeTestimony: (id: string) => void;
  resetTestimoniesToDefaults: () => void;
  addCoordination: (group: Omit<CoordinationGroup, 'id'>) => void;
  updateCoordination: (id: string, updated: Partial<CoordinationGroup>) => void;
  removeCoordination: (id: string) => void;
  resetCoordinationsToDefaults: () => void;
  updateWorshipScheduleItem: (index: number, updated: { day: string; time: string; name: string }) => void;
  addWorshipScheduleItem: (item: { day: string; time: string; name: string }) => void;
  removeWorshipScheduleItem: (index: number) => void;
  resetToDefaults: () => void;
  syncNowWithCloud: () => Promise<boolean>;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  syncState: SyncState;
  lastSyncedAt: Date | null;
  firebaseProjectId: string;
  isQuotaExceeded: boolean;
  firebaseConsoleUrl: string;
}

const LOCAL_STORAGE_KEY = 'catedral_amor_e_fe_data_v3';
const LAST_EDIT_TS_KEY = 'catedral_last_edit_timestamp_v3';
const QUOTA_STORAGE_KEY = 'catedral_firestore_quota_exceeded_timestamp_v3';
const SWR_KEY = '/api/church-data';
const FIRESTORE_DOC_PATH = 'church_data';
const FIRESTORE_DOC_ID = 'main';
const FIREBASE_PROJECT_ID = firebaseConfig.projectId || 'cruzadr-c0235';
const FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const FIREBASE_CONSOLE_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DB_ID}/data?openUpgradeDialog=true`;

const API_KEY = firebaseConfig.apiKey || '';
const FIRESTORE_REST_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${FIRESTORE_DB_ID}/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${API_KEY ? `?key=${API_KEY}` : ''}`;
const FIRESTORE_REST_DEFAULT_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}${API_KEY ? `?key=${API_KEY}` : ''}`;

function getStoredLocalEditTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LAST_EDIT_TS_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function setStoredLocalEditTimestamp(ts: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_EDIT_TS_KEY, ts.toString());
  } catch {}
}

function checkIsQuotaExceededStored(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Date.now() - ts > 3 * 60 * 60 * 1000) {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setQuotaExceededStored(exceeded: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (exceeded) {
      localStorage.setItem(QUOTA_STORAGE_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
    }
  } catch {}
}

function sanitizeSavedData(savedRaw: string | Record<string, any>): ChurchSettings {
  try {
    let parsed: any;
    if (typeof savedRaw === 'string') {
      let cleaned = savedRaw.replace(
        /photo-1532629345422-7515f3d16bb7/g,
        'photo-1519834785169-98be25ec3f84'
      );
      cleaned = cleaned.replace(
        /https:\/\/assets\.mixkit\.co\/videos\/preview\/[^\"]+/g,
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      );
      parsed = JSON.parse(cleaned);
    } else {
      parsed = savedRaw;
    }

    let sanitizedHeroVideo = parsed?.currentActivity?.heroVideo;
    if (!sanitizedHeroVideo || sanitizedHeroVideo.includes('mixkit.co')) {
      sanitizedHeroVideo = initialChurchData.currentActivity.heroVideo;
    }

    return {
      ...initialChurchData,
      ...parsed,
      churchName: parsed?.churchName || initialChurchData.churchName,
      logoPrefix: parsed?.logoPrefix !== undefined ? parsed.logoPrefix : initialChurchData.logoPrefix,
      logoSuffix: parsed?.logoSuffix !== undefined ? parsed.logoSuffix : initialChurchData.logoSuffix,
      logoImageUrl: parsed?.logoImageUrl !== undefined ? parsed.logoImageUrl : initialChurchData.logoImageUrl,
      churchMotto: parsed?.churchMotto || initialChurchData.churchMotto,
      churchAbout: parsed?.churchAbout || initialChurchData.churchAbout,
      phone: parsed?.phone || initialChurchData.phone,
      whatsappNumber: parsed?.whatsappNumber || initialChurchData.whatsappNumber,
      whatsappMessage: parsed?.whatsappMessage || initialChurchData.whatsappMessage,
      email: parsed?.email || initialChurchData.email,
      address: parsed?.address || initialChurchData.address,
      cityCountry: parsed?.cityCountry || initialChurchData.cityCountry,
      currentActivity: {
        ...initialChurchData.currentActivity,
        ...(parsed?.currentActivity || {}),
        heroVideo: sanitizedHeroVideo,
        badge: parsed?.currentActivity?.badge !== undefined ? parsed.currentActivity.badge : initialChurchData.currentActivity.badge,
        heroEyebrow: parsed?.currentActivity?.heroEyebrow !== undefined ? parsed.currentActivity.heroEyebrow : initialChurchData.currentActivity.heroEyebrow,
      },
      upcomingEvents: Array.isArray(parsed?.upcomingEvents) ? parsed.upcomingEvents : initialChurchData.upcomingEvents,
      photos: Array.isArray(parsed?.photos) ? parsed.photos : initialChurchData.photos,
      videos: Array.isArray(parsed?.videos) ? parsed.videos : initialChurchData.videos,
      socialLinks: Array.isArray(parsed?.socialLinks) ? parsed.socialLinks : initialChurchData.socialLinks,
      coordinations: Array.isArray(parsed?.coordinations) ? parsed.coordinations : (initialChurchData.coordinations || []),
      highlights: Array.isArray(parsed?.highlights) ? parsed.highlights : initialChurchData.highlights,
      testimonies: Array.isArray(parsed?.testimonies) ? parsed.testimonies : initialChurchData.testimonies,
      worshipSchedule: Array.isArray(parsed?.worshipSchedule) ? parsed.worshipSchedule : initialChurchData.worshipSchedule,
      developedBy: {
        ...initialChurchData.developedBy,
        ...(parsed?.developedBy || {}),
      },
    };
  } catch (err) {
    console.error('Error parsing saved church data:', err);
    return initialChurchData;
  }
}

function getInitialLocalCachedState(): ChurchSettings {
  if (typeof window === 'undefined') return initialChurchData;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (parsed && typeof parsed === 'object' && (parsed.churchName || parsed.currentActivity)) {
        return sanitizeSavedData(parsed);
      }
    }
  } catch (err) {
    console.warn('LocalStorage read notice:', err);
  }
  return initialChurchData;
}

// Multi-tab instant communication channel
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('catedral_sync_channel_v1')
  : null;

// SWR fetcher with robust fallback, local edit protection and auto cloud-seed
const churchDataFetcher = async (): Promise<ChurchSettings> => {
  const localState = getInitialLocalCachedState();
  const currentLocalTs = typeof localState.editTimestamp === 'number'
    ? localState.editTimestamp
    : (getStoredLocalEditTimestamp() || 0);

  try {
    const res = await fetch(SWR_KEY, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const remoteData = json.data;
        const remoteTs = typeof remoteData.editTimestamp === 'number'
          ? remoteData.editTimestamp
          : (remoteData.lastUpdatedAt ? new Date(remoteData.lastUpdatedAt).getTime() : 0);

        // If local user has newer unsynced edits, preserve them and push to server
        if (currentLocalTs > 0 && currentLocalTs > remoteTs) {
          // Asynchronously propagate local edits to server
          persistToFirestore(localState, true).catch(() => {});
          return localState;
        }

        // Remote data is newer or equally fresh
        const sanitized = sanitizeSavedData(remoteData);
        memoryState = sanitized;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
            if (remoteTs > 0) {
              setStoredLocalEditTimestamp(remoteTs);
            }
          } catch {}
        }
        return sanitized;
      }
    }
  } catch (err) {
    console.warn('SWR fetcher notice:', err);
  }

  return localState;
};

let memoryState: ChurchSettings = initialChurchData;
let saveDebounceTimer: NodeJS.Timeout | null = null;
let lastPersistedPayloadJson = '';
let isFirestoreQuotaExceeded = false;

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

async function persistToFirestore(state: ChurchSettings, force = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const currentPayloadJson = JSON.stringify(state);
  if (currentPayloadJson === lastPersistedPayloadJson && !force) {
    return true;
  }

  const editTimestamp = getStoredLocalEditTimestamp() || Date.now();
  const safePayload = JSON.parse(JSON.stringify({
    ...state,
    editTimestamp,
    lastUpdatedAt: new Date().toISOString(),
  }));

  // 1. Primary write: Local Server API Route
  let apiSucceeded = false;
  try {
    const apiRes = await fetch(SWR_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(safePayload),
    });
    if (apiRes.ok) {
      apiSucceeded = true;
      lastPersistedPayloadJson = currentPayloadJson;
      isFirestoreQuotaExceeded = false;
      setQuotaExceededStored(false);
    }
  } catch (err) {
    console.warn('API POST notice:', err);
  }

  // 2. Direct Firestore REST API (only if quota is not active)
  if (!isFirestoreQuotaExceeded) {
    try {
      const payload = toFirestoreRestDoc(safePayload);
      const endpoints = [FIRESTORE_REST_URL, FIRESTORE_REST_DEFAULT_URL];
      for (const ep of endpoints) {
        const res = await fetch(ep, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          lastPersistedPayloadJson = currentPayloadJson;
          isFirestoreQuotaExceeded = false;
          setQuotaExceededStored(false);
          return true;
        }

        if (res.status === 429) {
          isFirestoreQuotaExceeded = true;
          setQuotaExceededStored(true);
          break;
        }
      }
    } catch (err) {
      console.warn('REST save error:', err);
    }
  }

  // 3. Fallback to Web SDK if not in quota-exceeded mode
  if (!isFirestoreQuotaExceeded && !apiSucceeded) {
    try {
      const mainDocRef = doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);
      await setDoc(mainDocRef, safePayload, { merge: true });
      lastPersistedPayloadJson = currentPayloadJson;
      return true;
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (errMessage.includes('resource-exhausted') || errMessage.includes('Quota')) {
        isFirestoreQuotaExceeded = true;
        setQuotaExceededStored(true);
      } else {
        try {
          handleFirestoreError(err, OperationType.WRITE, `${FIRESTORE_DOC_PATH}/${FIRESTORE_DOC_ID}`);
        } catch {}
      }
    }
  }

  return apiSucceeded;
}

const emptySubscribe = () => () => {};

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export function ChurchProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: ChurchSettings;
}) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('ready');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(() => checkIsQuotaExceededStored());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // SWR: Initialized with SSR server data, zero-flash, onSnapshot handles live updates
  const { data: swrData, mutate } = useSWR<ChurchSettings>(
    SWR_KEY,
    churchDataFetcher,
    {
      fallbackData: initialData || memoryState || initialChurchData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnMount: false,
      dedupingInterval: 4000,
      refreshInterval: 0,
    }
  );

  const activeData = swrData || initialData || memoryState || initialChurchData;

  useEffect(() => {
    if (initialData) {
      memoryState = initialData;
    }
  }, [initialData]);

  useEffect(() => {
    // On client mount, only adopt localStorage if it is strictly newer than server state
    const local = getInitialLocalCachedState();
    const localTs = typeof local.editTimestamp === 'number' ? local.editTimestamp : 0;
    const currentTs = typeof activeData.editTimestamp === 'number' ? activeData.editTimestamp : 0;

    if (local && localTs > currentTs && JSON.stringify(local) !== JSON.stringify(initialChurchData)) {
      memoryState = local;
      mutate(local, false);
    }
  }, [activeData.editTimestamp, mutate]);

  useEffect(() => {
    if (swrData) {
      memoryState = swrData;
    }
  }, [swrData]);

  // Real-time Firestore onSnapshot push listener for instant cross-device updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);
      unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: false },
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data();
            if (remoteData) {
              const remoteTs = typeof remoteData.editTimestamp === 'number'
                ? remoteData.editTimestamp
                : (remoteData.lastUpdatedAt ? new Date(remoteData.lastUpdatedAt).getTime() : 0);
              const currentLocalTs = getStoredLocalEditTimestamp() || 0;

              // If remote is strictly newer or local has no timestamp yet
              if ((!currentLocalTs && remoteTs > 0) || (remoteTs >= currentLocalTs)) {
                const sanitized = sanitizeSavedData(remoteData);
                memoryState = sanitized;
                mutate(sanitized, false);
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
                    setStoredLocalEditTimestamp(remoteTs);
                  } catch {}
                }
                setLastSyncedAt(new Date());
                setSyncState('synced');
              } else if (currentLocalTs > 0 && currentLocalTs > remoteTs) {
                // Local is newer: propagate local changes to Firestore
                const local = getInitialLocalCachedState();
                persistToFirestore(local, false).catch(() => {});
              }
            }
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot listener notice:', err);
        }
      );
    } catch (e) {
      console.warn('Could not initialize onSnapshot:', e);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {}
      }
    };
  }, [mutate]);

  // Visibility and tab focus listeners for instantaneous updates when waking device / switching apps
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        mutate();
      }
    };
    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);
    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [mutate]);

  // Multi-tab Broadcast Channel listener for instant cross-tab sync
  useEffect(() => {
    if (!broadcastChannel) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_STATE_UPDATE' && event.data?.payload) {
        try {
          const sanitized = sanitizeSavedData(event.data.payload);
          memoryState = sanitized;
          mutate(sanitized, false);
          setLastSyncedAt(new Date());
          setSyncState('synced');
        } catch (err) {
          console.warn('Broadcast channel sync error:', err);
        }
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [mutate]);

  // Unified updater: Updates cache immediately (0ms latency), persists to localStorage, alerts other tabs, and saves to server
  const updateStore = useCallback((updater: (prev: ChurchSettings) => ChurchSettings, immediate = true) => {
    const now = Date.now();
    setStoredLocalEditTimestamp(now);
    
    // 1. Optimistic SWR & memory update with current timestamp attached
    const baseObj = memoryState || getInitialLocalCachedState();
    const updatedRaw = updater(baseObj);
    const updated: ChurchSettings = {
      ...updatedRaw,
      editTimestamp: now,
      lastUpdatedAt: new Date(now).toISOString(),
    };

    memoryState = updated;
    mutate(updated, false);

    // 2. Local storage persistence & BroadcastChannel
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        broadcastChannel?.postMessage({ type: 'SYNC_STATE_UPDATE', payload: updated });
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    setLastSyncedAt(new Date());
    setSyncState('syncing');

    // 3. Debounced Cloud / Server persistence
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }

    if (immediate) {
      persistToFirestore(updated, true).then((ok) => {
        setSyncState(ok ? 'synced' : (isFirestoreQuotaExceeded ? 'quota_exceeded' : 'offline'));
      });
    } else {
      saveDebounceTimer = setTimeout(() => {
        persistToFirestore(updated, false).then((ok) => {
          setSyncState(ok ? 'synced' : (isFirestoreQuotaExceeded ? 'quota_exceeded' : 'offline'));
        });
      }, 300);
    }
  }, [mutate]);

  const syncNowWithCloud = useCallback(async (): Promise<boolean> => {
    setSyncState('syncing');
    try {
      const ok = await persistToFirestore(memoryState, true);
      if (ok) {
        setLastSyncedAt(new Date());
        setSyncState('synced');
        setIsQuotaExceeded(false);
        globalMutate(SWR_KEY);
        return true;
      } else {
        setSyncState(isFirestoreQuotaExceeded ? 'quota_exceeded' : 'offline');
        return false;
      }
    } catch {
      setSyncState('offline');
      return false;
    }
  }, []);

  const updateCurrentActivity = useCallback((activityUpdate: Partial<ChurchActivity>) => {
    updateStore((prev) => ({
      ...prev,
      currentActivity: {
        ...prev.currentActivity,
        ...activityUpdate,
      },
    }), true);
  }, [updateStore]);

  const updateChurchInfo = useCallback((infoUpdate: Partial<ChurchSettings>) => {
    updateStore((prev) => ({
      ...prev,
      ...infoUpdate,
    }), true);
  }, [updateStore]);

  const addPhoto = useCallback((photoData: Omit<PhotoItem, 'id'>) => {
    const newPhoto: PhotoItem = {
      ...photoData,
      id: 'p-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      photos: [newPhoto, ...prev.photos],
    }), true);
  }, [updateStore]);

  const addBatchPhotos = useCallback((photosData: Omit<PhotoItem, 'id'>[]) => {
    if (!photosData || photosData.length === 0) return;
    const newPhotos: PhotoItem[] = photosData.map((p, idx) => ({
      ...p,
      id: 'p-' + (Date.now() + idx),
    }));
    updateStore((prev) => ({
      ...prev,
      photos: [...newPhotos, ...prev.photos],
    }), true);
  }, [updateStore]);

  const updatePhoto = useCallback((id: string, updated: Partial<PhotoItem>) => {
    updateStore((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }), true);
  }, [updateStore]);

  const removePhoto = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }), true);
  }, [updateStore]);

  const addVideo = useCallback((videoData: Omit<VideoItem, 'id'> & { id?: string }) => {
    const newVideo: VideoItem = {
      ...videoData,
      id: videoData.id || 'v-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      videos: [newVideo, ...prev.videos],
    }), true);
  }, [updateStore]);

  const addBatchVideos = useCallback((videosData: (Omit<VideoItem, 'id'> & { id?: string })[]) => {
    if (!videosData || videosData.length === 0) return;
    const newVideos: VideoItem[] = videosData.map((v, idx) => ({
      ...v,
      id: v.id || 'v-' + (Date.now() + idx),
    }));
    updateStore((prev) => ({
      ...prev,
      videos: [...newVideos, ...prev.videos],
    }), true);
  }, [updateStore]);

  const updateVideo = useCallback((id: string, updated: Partial<VideoItem>) => {
    updateStore((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => (v.id === id ? { ...v, ...updated } : v)),
    }), true);
  }, [updateStore]);

  const removeVideo = useCallback((id: string) => {
    deleteVideoFileBlob(id);
    updateStore((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
    }), true);
  }, [updateStore]);

  const setPrimaryFeaturedVideo = useCallback((id: string) => {
    updateStore((prev) => {
      const target = prev.videos.find((v) => v.id === id);
      if (!target) return prev;
      const filtered = prev.videos.filter((v) => v.id !== id);
      return {
        ...prev,
        videos: [target, ...filtered],
      };
    }, true);
  }, [updateStore]);

  const resetVideosToDefaults = useCallback(() => {
    clearAllStoredVideoBlobs();
    updateStore((prev) => ({
      ...prev,
      videos: initialChurchData.videos,
    }), true);
  }, [updateStore]);

  const clearAllOldVideos = useCallback(() => {
    clearAllStoredVideoBlobs();
    updateStore((prev) => ({
      ...prev,
      videos: [],
    }), true);
  }, [updateStore]);

  const addUpcomingEvent = useCallback((eventData: Omit<ChurchEvent, 'id'>) => {
    const newEvent: ChurchEvent = {
      ...eventData,
      id: 'ev-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      upcomingEvents: [newEvent, ...prev.upcomingEvents],
    }), true);
  }, [updateStore]);

  const updateUpcomingEvent = useCallback((id: string, updated: Partial<ChurchEvent>) => {
    updateStore((prev) => ({
      ...prev,
      upcomingEvents: prev.upcomingEvents.map((ev) => (ev.id === id ? { ...ev, ...updated } : ev)),
    }), true);
  }, [updateStore]);

  const removeUpcomingEvent = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      upcomingEvents: prev.upcomingEvents.filter((ev) => ev.id !== id),
    }), true);
  }, [updateStore]);

  const addSocialLink = useCallback((linkData: Omit<SocialLink, 'id'> & { id?: string }) => {
    const newLink: SocialLink = {
      ...linkData,
      id: linkData.id || 'soc-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink],
    }), true);
  }, [updateStore]);

  const addBatchSocialLinks = useCallback((linksData: (Omit<SocialLink, 'id'> & { id?: string })[]) => {
    if (!linksData || linksData.length === 0) return;
    const newLinks: SocialLink[] = linksData.map((link, idx) => ({
      ...link,
      id: link.id || 'soc-' + (Date.now() + idx),
    }));
    updateStore((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ...newLinks],
    }), true);
  }, [updateStore]);

  const updateSocialLink = useCallback((id: string, updated: Partial<SocialLink>) => {
    updateStore((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    }), true);
  }, [updateStore]);

  const removeSocialLink = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((item) => item.id !== id),
    }), true);
  }, [updateStore]);

  const resetSocialLinksToDefaults = useCallback(() => {
    updateStore((prev) => ({
      ...prev,
      socialLinks: [],
    }), true);
  }, [updateStore]);

  const addHighlight = useCallback((item: Omit<HighlightMoment, 'id'>) => {
    const newHighlight: HighlightMoment = {
      ...item,
      id: 'hl-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight],
    }), true);
  }, [updateStore]);

  const updateHighlight = useCallback((id: string, updated: Partial<HighlightMoment>) => {
    updateStore((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    }), true);
  }, [updateStore]);

  const removeHighlight = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((item) => item.id !== id),
    }), true);
  }, [updateStore]);

  const resetHighlightsToDefaults = useCallback(() => {
    updateStore((prev) => ({
      ...prev,
      highlights: initialChurchData.highlights,
    }), true);
  }, [updateStore]);

  const addTestimony = useCallback((testimonyData: Omit<Testimony, 'id'>) => {
    const newTestimony: Testimony = {
      ...testimonyData,
      id: 'test-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      testimonies: [newTestimony, ...(prev.testimonies || [])],
    }), true);
  }, [updateStore]);

  const updateTestimony = useCallback((id: string, updated: Partial<Testimony>) => {
    updateStore((prev) => ({
      ...prev,
      testimonies: (prev.testimonies || []).map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    }), true);
  }, [updateStore]);

  const removeTestimony = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      testimonies: (prev.testimonies || []).filter((item) => item.id !== id),
    }), true);
  }, [updateStore]);

  const resetTestimoniesToDefaults = useCallback(() => {
    updateStore((prev) => ({
      ...prev,
      testimonies: initialChurchData.testimonies,
    }), true);
  }, [updateStore]);

  const addCoordination = useCallback((groupData: Omit<CoordinationGroup, 'id'>) => {
    const newGroup: CoordinationGroup = {
      ...groupData,
      id: 'coord-' + Date.now(),
    };
    updateStore((prev) => ({
      ...prev,
      coordinations: [...(prev.coordinations || []), newGroup],
    }), true);
  }, [updateStore]);

  const updateCoordination = useCallback((id: string, updated: Partial<CoordinationGroup>) => {
    updateStore((prev) => ({
      ...prev,
      coordinations: (prev.coordinations || []).map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    }), true);
  }, [updateStore]);

  const removeCoordination = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      coordinations: (prev.coordinations || []).filter((item) => item.id !== id),
    }), true);
  }, [updateStore]);

  const resetCoordinationsToDefaults = useCallback(() => {
    updateStore((prev) => ({
      ...prev,
      coordinations: initialChurchData.coordinations || [],
    }), true);
  }, [updateStore]);

  const updateWorshipScheduleItem = useCallback((index: number, updated: { day: string; time: string; name: string }) => {
    updateStore((prev) => {
      const copy = [...prev.worshipSchedule];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updated };
      }
      return { ...prev, worshipSchedule: copy };
    }, true);
  }, [updateStore]);

  const addWorshipScheduleItem = useCallback((item: { day: string; time: string; name: string }) => {
    updateStore((prev) => ({
      ...prev,
      worshipSchedule: [...prev.worshipSchedule, item],
    }), true);
  }, [updateStore]);

  const removeWorshipScheduleItem = useCallback((index: number) => {
    updateStore((prev) => ({
      ...prev,
      worshipSchedule: prev.worshipSchedule.filter((_, idx) => idx !== index),
    }), true);
  }, [updateStore]);

  const resetToDefaults = useCallback(() => {
    clearAllStoredVideoBlobs();
    clearHeroVideoBlob();
    updateStore(() => initialChurchData, true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialChurchData));
        window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: null } }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [updateStore]);

  return (
    <ChurchContext.Provider
      value={{
        data: activeData,
        isReady: isMounted,
        updateCurrentActivity,
        updateChurchInfo,
        addPhoto,
        addBatchPhotos,
        updatePhoto,
        removePhoto,
        addVideo,
        addBatchVideos,
        updateVideo,
        removeVideo,
        setPrimaryFeaturedVideo,
        resetVideosToDefaults,
        clearAllOldVideos,
        addUpcomingEvent,
        updateUpcomingEvent,
        removeUpcomingEvent,
        addSocialLink,
        addBatchSocialLinks,
        updateSocialLink,
        removeSocialLink,
        resetSocialLinksToDefaults,
        addHighlight,
        updateHighlight,
        removeHighlight,
        resetHighlightsToDefaults,
        addTestimony,
        updateTestimony,
        removeTestimony,
        resetTestimoniesToDefaults,
        addCoordination,
        updateCoordination,
        removeCoordination,
        resetCoordinationsToDefaults,
        updateWorshipScheduleItem,
        addWorshipScheduleItem,
        removeWorshipScheduleItem,
        resetToDefaults,
        syncNowWithCloud,
        isAdminOpen,
        setIsAdminOpen,
        syncState,
        lastSyncedAt,
        firebaseProjectId: FIREBASE_PROJECT_ID,
        isQuotaExceeded,
        firebaseConsoleUrl: FIREBASE_CONSOLE_URL,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
}

