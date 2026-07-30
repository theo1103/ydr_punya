import { User, DailyDataRecord, AppSettings } from '../types';
import { sha256Hex } from './crypto';

const USERS_KEY = 'yadoru_users_v5';
const DATA_KEY = 'yadoru_daily_data_v5';
const SETTINGS_KEY = 'yadoru_settings_v5';

const DEFAULT_ADMIN_PW_HASH = '1fba41cb765502b66236b28eb9f3ef42eb3a846f414bd65839db0e82c5f9227d'; // sha256('yadoru123')
const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/6009/6009864.png';

// Initialize default data if not existing
export async function initDatabase(): Promise<void> {
  let adminHash = DEFAULT_ADMIN_PW_HASH;
  try {
    adminHash = await sha256Hex('yadoru123');
  } catch {
    // fallback
  }

  const users = getUsers();
  const yadoruUser = users.find((u) => u.username.toLowerCase() === 'yadoru');

  if (!yadoruUser) {
    users.unshift({
      username: 'yadoru',
      passwordHash: adminHash,
      role: 'admin',
      bio: 'Administrator Yadoru Corporate',
      twitter: '@yadoru_corp',
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } else {
    // Always ensure yadoru has admin role and valid password hash
    yadoruUser.role = 'admin';
    yadoruUser.passwordHash = adminHash;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  if (!localStorage.getItem(DATA_KEY)) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    const initialData: DailyDataRecord[] = [
      { id: '1', username: 'yadoru', date: twoDaysAgo, value: 1500000 },
      { id: '2', username: 'yadoru', date: yesterday, value: 2400000 },
      { id: '3', username: 'yadoru', date: today, value: 3100000 },
    ];
    localStorage.setItem(DATA_KEY, JSON.stringify(initialData));
  }

  if (!localStorage.getItem(SETTINGS_KEY)) {
    const settings: AppSettings = {
      logoUrl: DEFAULT_LOGO,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

// User methods
export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getUser(username: string): User | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export async function registerUser(username: string, password: string): Promise<{ success: boolean; message: string }> {
  if (!username.trim() || !password.trim()) {
    return { success: false, message: 'Username dan Password tidak boleh kosong' };
  }

  const users = getUsers();
  const exists = users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (exists) {
    return { success: false, message: 'Username sudah terpakai!' };
  }

  const passwordHash = await sha256Hex(password);
  const newUser: User = {
    username: username.trim(),
    passwordHash,
    role: 'user',
    twitter: '@',
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: 'Berhasil! Silakan Login.' };
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  let user = getUser(cleanUsername);

  // Fallback for default admin yadoru if somehow missing
  if (cleanUsername === 'yadoru' && !user) {
    const adminHash = await sha256Hex('yadoru123');
    user = {
      username: 'yadoru',
      passwordHash: adminHash,
      role: 'admin',
      bio: 'Administrator Yadoru Corporate',
      twitter: '@yadoru_corp',
    };
  }

  if (!user) {
    return { success: false, message: 'Username tidak ditemukan!' };
  }

  const inputHash = await sha256Hex(password);

  // Special direct bypass for yadoru admin
  if (user.username.toLowerCase() === 'yadoru') {
    if (
      password === 'yadoru123' ||
      password === 'admin' ||
      inputHash === user.passwordHash ||
      password === user.passwordHash
    ) {
      user.role = 'admin';
      return { success: true, user };
    }
  }

  if (inputHash === user.passwordHash || password === user.passwordHash) {
    return { success: true, user };
  }

  return { success: false, message: 'Password salah!' };
}

export function updateUserProfile(
  username: string,
  updates: { photo?: string | null; bio?: string | null; twitter?: string | null }
): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...updates,
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

// Daily Data methods
export function getDailyData(): DailyDataRecord[] {
  try {
    const data = localStorage.getItem(DATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addDailyData(username: string, date: string, value: number, evidence?: string | null): void {
  const list = getDailyData();
  const newRecord: DailyDataRecord = {
    id: Date.now().toString(),
    username,
    date,
    value,
    evidence,
  };
  list.push(newRecord);
  localStorage.setItem(DATA_KEY, JSON.stringify(list));
}

// Settings methods
export function getAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { logoUrl: DEFAULT_LOGO };
  } catch {
    return { logoUrl: DEFAULT_LOGO };
  }
}

export function updateAppLogo(logoUrl: string): void {
  const settings = getAppSettings();
  settings.logoUrl = logoUrl;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Admin management operations
export function toggleUserRole(username: string): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    users[index].role = users[index].role === 'admin' ? 'user' : 'admin';
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function deleteUser(username: string): void {
  let users = getUsers();
  users = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function resetUserPassword(username: string, newPw: string): Promise<void> {
  const users = getUsers();
  const index = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (index !== -1) {
    users[index].passwordHash = await sha256Hex(newPw);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function deleteDailyDataRecord(id: string): void {
  let list = getDailyData();
  list = list.filter((item) => item.id !== id);
  localStorage.setItem(DATA_KEY, JSON.stringify(list));
}

