import FileSaver from 'file-saver';
import {
  AtlasPortableBundle,
  ClientEntity,
  EngagementHeader,
  EngagementWorkspaceData,
  KapProfile,
  UiPreferences,
  UserProfile,
} from '../types/atlas';

export const CORE_STORAGE_KEY = 'atlas_core_store_v1';
export const UI_PREFS_KEY = 'atlas_ui_prefs_v1';
const IDB_NAME = 'atlas_workspace_db';
const IDB_VERSION = 1;
const STORE_ENGAGEMENT_DATA = 'engagement_data';
const STORE_ATTACHMENTS = 'attachments';

export interface PersistedCoreMetadata {
  kapProfile: KapProfile;
  users: UserProfile[];
  activeUserId: string;
  clients: ClientEntity[];
  engagements: EngagementHeader[];
  activeEngagementId: string | null;
}

export function loadCoreMetadata(): PersistedCoreMetadata | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(CORE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCoreMetadata;
    if (!parsed || !parsed.kapProfile || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCoreMetadata(meta: PersistedCoreMetadata): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(CORE_STORAGE_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Gagal menyimpan metadata inti ke localStorage:', err);
  }
}

export function loadUiPreferences(): UiPreferences {
  const autostartWorkspace =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const defaults: UiPreferences = {
    sidebarCollapsed: false,
    drawerOpen: false,
    activeIndex: 'HOME',
    viewMode: autostartWorkspace ? 'workspace' : 'hub',
    hubTab: 'perikatan',
  };
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaults;
    const raw = window.localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    const normalizedIndex =
      !parsed.activeIndex || parsed.activeIndex === 'HUB' || parsed.activeIndex === 'MASTER_KAP'
        ? 'HOME'
        : parsed.activeIndex;
    return {
      ...defaults,
      ...parsed,
      activeIndex: normalizedIndex,
      viewMode: autostartWorkspace ? 'workspace' : (parsed.viewMode ?? 'hub'),
      hubTab: parsed.hubTab ?? 'perikatan',
      expandedNodeIds:
        parsed.expandedNodeIds && typeof parsed.expandedNodeIds === 'object'
          ? parsed.expandedNodeIds
          : undefined,
    };
  } catch {
    return defaults;
  }
}

export function saveUiPreferences(prefs: UiPreferences): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors for non-critical UI preferences
  }
}

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak tersedia di lingkungan ini.'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ENGAGEMENT_DATA)) {
        db.createObjectStore(STORE_ENGAGEMENT_DATA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
        db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka IndexedDB.'));
  });
}

export async function saveWorkspaceToIndexedDb(
  engagementId: string,
  workspace: EngagementWorkspaceData
): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openWorkspaceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ENGAGEMENT_DATA, 'readwrite');
    const store = tx.objectStore(STORE_ENGAGEMENT_DATA);
    store.put({ id: engagementId, data: workspace, savedAt: new Date().toISOString() });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Gagal menyimpan workspace ke IndexedDB.'));
    };
  });
}

export async function loadAllWorkspacesFromIndexedDb(): Promise<
  Record<string, EngagementWorkspaceData>
> {
  if (typeof window === 'undefined' || !window.indexedDB) return {};
  const db = await openWorkspaceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ENGAGEMENT_DATA, 'readonly');
    const store = tx.objectStore(STORE_ENGAGEMENT_DATA);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      const map: Record<string, EngagementWorkspaceData> = {};
      for (const rec of req.result as { id: string; data: EngagementWorkspaceData }[]) {
        if (rec?.id && rec?.data) {
          map[rec.id] = rec.data;
        }
      }
      resolve(map);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('Gagal membaca workspace dari IndexedDB.'));
    };
  });
}

export function buildPortableBundle(params: {
  kapProfile: KapProfile;
  users: UserProfile[];
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
  exportedBy: string;
}): AtlasPortableBundle {
  return {
    schemaVersion: 'atlas-web-2.1',
    exportedAt: new Date().toISOString(),
    exportedBy: params.exportedBy,
    kapProfile: params.kapProfile,
    users: params.users,
    client: params.client,
    engagementBundle: params.workspace,
  };
}

export function exportAtlasBundleFile(bundle: AtlasPortableBundle): string {
  const safeClient = bundle.client.namaKlien
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const filename = `${safeClient || 'Perikatan'}_${bundle.engagementBundle.header.tahunBuku}.atlas.json`;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const saveFn =
    typeof FileSaver === 'function'
      ? FileSaver
      : (FileSaver as unknown as { saveAs?: (data: Blob, filename: string) => void }).saveAs;
  if (saveFn) {
    saveFn(blob, filename);
  }
  return filename;
}

export function parseAtlasPortableBundle(rawJson: string): AtlasPortableBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Format file bukan JSON yang valid.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Struktur file .atlas.json tidak valid.');
  }

  const candidate = parsed as Partial<AtlasPortableBundle>;
  if (candidate.schemaVersion !== 'atlas-web-2.1') {
    throw new Error(
      `Versi skema tidak didukung (${String(candidate.schemaVersion ?? 'tidak diketahui')}). Wajib: atlas-web-2.1.`
    );
  }

  if (
    !candidate.kapProfile ||
    !Array.isArray(candidate.users) ||
    !candidate.client ||
    !candidate.engagementBundle?.header?.id
  ) {
    throw new Error('Bundle .atlas.json tidak lengkap (kapProfile, users, client, atau engagementBundle hilang).');
  }

  return candidate as AtlasPortableBundle;
}
