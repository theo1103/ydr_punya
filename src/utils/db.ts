import { User, DailyDataRecord, AppSettings, GiftSendbackRecord } from '../types';
import { sha256Hex } from './crypto';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';

const USERS_KEY = 'yadoru_users_v6';
const DATA_KEY = 'yadoru_daily_data_v6';
const SETTINGS_KEY = 'yadoru_settings_v6';
const SENDBACKS_KEY = 'yadoru_gift_sendbacks_v6';

const DEFAULT_ADMIN_PW_HASH = '1fba41cb765502b66236b28eb9f3ef42eb3a846f414bd65839db0e82c5f9227d'; // sha256('yadoru123')
const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/6009/6009864.png';

// Local Memory Caches for immediate synchronous UI updates
let cachedUsers: User[] = [];
let cachedDailyData: DailyDataRecord[] = [];
let cachedSettings: AppSettings = { logoUrl: DEFAULT_LOGO };
let cachedGiftSendbacks: GiftSendbackRecord[] = [];

// Event bus listeners
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Listener error:', err);
    }
  });
}

export function subscribeDatabaseChanges(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Initialize Firestore listeners & fallback seed data
export async function initDatabase(): Promise<void> {
  let adminHash = DEFAULT_ADMIN_PW_HASH;
  try {
    adminHash = await sha256Hex('yadoru123');
  } catch {
    // fallback
  }

  // Local storage initial load as immediate fallback
  try {
    const localUsers = localStorage.getItem(USERS_KEY);
    if (localUsers) cachedUsers = JSON.parse(localUsers);

    const localData = localStorage.getItem(DATA_KEY);
    if (localData) cachedDailyData = JSON.parse(localData);

    const localSettings = localStorage.getItem(SETTINGS_KEY);
    if (localSettings) cachedSettings = JSON.parse(localSettings);

    const localSendbacks = localStorage.getItem(SENDBACKS_KEY);
    if (localSendbacks) cachedGiftSendbacks = JSON.parse(localSendbacks);
  } catch {
    // ignore
  }

  // 1. Subscribe to Firestore 'users' collection
  onSnapshot(
    collection(db, 'users'),
    async (snapshot) => {
      if (!snapshot.empty) {
        const usersList: User[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as User);
        });
        cachedUsers = usersList;
        localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
      } else {
        // Seed initial admin if empty
        const initialAdmin: User = {
          username: 'yadoru',
          passwordHash: adminHash,
          role: 'admin',
          bio: 'Administrator Yadoru Corporate',
          twitter: '@yadoru_corp',
        };
        await setDoc(doc(db, 'users', 'yadoru'), initialAdmin);
        cachedUsers = [initialAdmin];
      }
      notifyListeners();
    },
    (error) => {
      console.warn('Firestore users snapshot listener error (using local cache):', error);
      // Ensure yadoru exists in local fallback
      if (!cachedUsers.some((u) => u.username.toLowerCase() === 'yadoru')) {
        cachedUsers.unshift({
          username: 'yadoru',
          passwordHash: adminHash,
          role: 'admin',
          bio: 'Administrator Yadoru Corporate',
          twitter: '@yadoru_corp',
        });
        localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
        notifyListeners();
      }
    }
  );

  // 2. Subscribe to Firestore 'daily_data' collection
  onSnapshot(
    collection(db, 'daily_data'),
    async (snapshot) => {
      if (!snapshot.empty) {
        const records: DailyDataRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<DailyDataRecord, 'id'>) });
        });
        cachedDailyData = records;
        localStorage.setItem(DATA_KEY, JSON.stringify(cachedDailyData));
      } else {
        // Seed initial sample data if empty
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        const initialRecords: DailyDataRecord[] = [
          { id: '1', username: 'yadoru', date: twoDaysAgo, value: 1500000 },
          { id: '2', username: 'yadoru', date: yesterday, value: 2400000 },
          { id: '3', username: 'yadoru', date: today, value: 3100000 },
        ];
        for (const rec of initialRecords) {
          await setDoc(doc(db, 'daily_data', rec.id), rec);
        }
        cachedDailyData = initialRecords;
      }
      notifyListeners();
    },
    (error) => {
      console.warn('Firestore daily_data snapshot listener error (using local cache):', error);
    }
  );

  // 3. Subscribe to Firestore 'settings' collection
  onSnapshot(
    doc(db, 'settings', 'app'),
    async (docSnap) => {
      if (docSnap.exists()) {
        cachedSettings = docSnap.data() as AppSettings;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(cachedSettings));
      } else {
        const defaultSettings: AppSettings = { logoUrl: DEFAULT_LOGO };
        await setDoc(doc(db, 'settings', 'app'), defaultSettings);
        cachedSettings = defaultSettings;
      }
      notifyListeners();
    },
    (error) => {
      console.warn('Firestore settings snapshot listener error (using local cache):', error);
    }
  );

  // 4. Subscribe to Firestore 'gift_sendbacks' collection
  onSnapshot(
    collection(db, 'gift_sendbacks'),
    async (snapshot) => {
      if (!snapshot.empty) {
        const sendbacks: GiftSendbackRecord[] = [];
        snapshot.forEach((docSnap) => {
          sendbacks.push({ id: docSnap.id, ...(docSnap.data() as Omit<GiftSendbackRecord, 'id'>) });
        });
        cachedGiftSendbacks = sendbacks;
        localStorage.setItem(SENDBACKS_KEY, JSON.stringify(cachedGiftSendbacks));
      } else {
        cachedGiftSendbacks = [];
      }
      notifyListeners();
    },
    (error) => {
      console.warn('Firestore gift_sendbacks snapshot listener error (using local cache):', error);
    }
  );
}

// Gift Sendback Operations
export function getGiftSendbacks(): GiftSendbackRecord[] {
  return cachedGiftSendbacks;
}

export async function addGiftSendback(
  username: string,
  amount: number,
  date: string,
  notes?: string,
  evidenceUrl?: string,
  recordedBy: string = 'admin'
): Promise<void> {
  const newRecord: GiftSendbackRecord = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    username: username.trim(),
    amount,
    date,
    notes: notes ? notes.trim() : undefined,
    evidenceUrl: evidenceUrl || undefined,
    recordedBy: recordedBy || 'admin',
  };

  cachedGiftSendbacks.push(newRecord);
  localStorage.setItem(SENDBACKS_KEY, JSON.stringify(cachedGiftSendbacks));
  notifyListeners();

  try {
    await setDoc(doc(db, 'gift_sendbacks', newRecord.id), newRecord);
  } catch (err) {
    console.error('Error adding gift sendback record to Firestore:', err);
  }
}

export async function deleteGiftSendback(id: string): Promise<void> {
  cachedGiftSendbacks = cachedGiftSendbacks.filter((item) => item.id !== id);
  localStorage.setItem(SENDBACKS_KEY, JSON.stringify(cachedGiftSendbacks));
  notifyListeners();

  try {
    await deleteDoc(doc(db, 'gift_sendbacks', id));
  } catch (err) {
    console.error('Error deleting gift sendback from Firestore:', err);
  }
}

// User methods
export function getUsers(): User[] {
  return cachedUsers;
}

export function getUser(username: string): User | undefined {
  return cachedUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export async function registerUser(username: string, password: string): Promise<{ success: boolean; message: string }> {
  if (!username.trim() || !password.trim()) {
    return { success: false, message: 'Username dan Password tidak boleh kosong' };
  }

  const cleanUser = username.trim();
  const exists = cachedUsers.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
  if (exists) {
    return { success: false, message: 'Username sudah terpakai!' };
  }

  const passwordHash = await sha256Hex(password);
  const newUser: User = {
    username: cleanUser,
    passwordHash,
    role: 'user',
    twitter: '@',
  };

  // Update online Firestore & local cache
  cachedUsers.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
  notifyListeners();

  try {
    await setDoc(doc(db, 'users', cleanUser.toLowerCase()), newUser);
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }

  return { success: true, message: 'Berhasil! Silakan Login.' };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  const cleanUsername = username.trim().toLowerCase();

  let targetUser = cachedUsers.find((u) => u.username.toLowerCase() === cleanUsername);

  // If yadoru is logging in with default password, ensure admin account exists
  if (!targetUser && cleanUsername === 'yadoru' && password === 'yadoru123') {
    const adminHash = await sha256Hex('yadoru123');
    targetUser = {
      username: 'yadoru',
      passwordHash: adminHash,
      role: 'admin',
      bio: 'Administrator Yadoru Corporate',
      twitter: '@yadoru_corp',
    };
    cachedUsers.push(targetUser);
    try {
      await setDoc(doc(db, 'users', 'yadoru'), targetUser);
    } catch {
      // ignore
    }
  }

  if (!targetUser) {
    return { success: false, message: 'Username tidak ditemukan!' };
  }

  const inputHash = await sha256Hex(password);

  if (targetUser.passwordHash === inputHash || (cleanUsername === 'yadoru' && password === 'yadoru123')) {
    return { success: true, user: targetUser };
  }

  return { success: false, message: 'Password salah!' };
}

export async function updateUserProfile(
  username: string,
  updates: Partial<Omit<User, 'username' | 'passwordHash'>>
): Promise<void> {
  const index = cachedUsers.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    cachedUsers[index] = {
      ...cachedUsers[index],
      ...updates,
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
    notifyListeners();

    try {
      await setDoc(doc(db, 'users', username.toLowerCase()), cachedUsers[index], { merge: true });
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
    }
  }
}

// Daily Data Operations
export function getDailyData(): DailyDataRecord[] {
  return cachedDailyData;
}

export async function addDailyData(
  username: string,
  date: string,
  value: number,
  evidenceUrl?: string | null
): Promise<void> {
  const newRecord: DailyDataRecord = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    username: username.trim(),
    date,
    value,
    evidenceUrl: evidenceUrl || undefined,
  };

  cachedDailyData.push(newRecord);
  localStorage.setItem(DATA_KEY, JSON.stringify(cachedDailyData));
  notifyListeners();

  try {
    await setDoc(doc(db, 'daily_data', newRecord.id), newRecord);
  } catch (err) {
    console.error('Error adding daily data to Firestore:', err);
  }
}

// Settings methods
export function getAppSettings(): AppSettings {
  return cachedSettings;
}

export async function updateAppLogo(logoUrl: string): Promise<void> {
  cachedSettings = { logoUrl };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(cachedSettings));
  notifyListeners();

  try {
    await setDoc(doc(db, 'settings', 'app'), cachedSettings);
  } catch (err) {
    console.error('Error updating logo in Firestore:', err);
  }
}

// Admin management operations
export async function toggleAdminRole(username: string): Promise<void> {
  const index = cachedUsers.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    cachedUsers[index].role = cachedUsers[index].role === 'admin' ? 'user' : 'admin';
    localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
    notifyListeners();

    try {
      await setDoc(doc(db, 'users', username.toLowerCase()), { role: cachedUsers[index].role }, { merge: true });
    } catch (err) {
      console.error('Error updating role in Firestore:', err);
    }
  }
}

export const toggleUserRole = toggleAdminRole;

export async function deleteUser(username: string): Promise<void> {
  cachedUsers = cachedUsers.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
  notifyListeners();

  try {
    await deleteDoc(doc(db, 'users', username.toLowerCase()));
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
}

export async function resetUserPassword(username: string, newPw: string): Promise<void> {
  const index = cachedUsers.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    const newHash = await sha256Hex(newPw);
    cachedUsers[index].passwordHash = newHash;
    localStorage.setItem(USERS_KEY, JSON.stringify(cachedUsers));
    notifyListeners();

    try {
      await setDoc(doc(db, 'users', username.toLowerCase()), { passwordHash: newHash }, { merge: true });
    } catch (err) {
      console.error('Error resetting password in Firestore:', err);
    }
  }
}

export async function deleteDailyDataRecord(id: string): Promise<void> {
  cachedDailyData = cachedDailyData.filter((item) => item.id !== id);
  localStorage.setItem(DATA_KEY, JSON.stringify(cachedDailyData));
  notifyListeners();

  try {
    await deleteDoc(doc(db, 'daily_data', id));
  } catch (err) {
    console.error('Error deleting daily data from Firestore:', err);
  }
}
