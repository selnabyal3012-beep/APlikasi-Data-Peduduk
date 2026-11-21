export interface OfflineOperatorAccount {
  username: string;
  namaLengkap: string;
  jabatan: string;
  passwordHash: string;
}

export interface OfflineAuthState {
  account: OfflineOperatorAccount;
  isLoggedIn: boolean;
  requireLoginOnStart: boolean;
}

const AUTH_STORAGE_KEY = 'bidesa_offline_auth_v1';
const SESSION_KEY = 'bidesa_offline_session_v1';

export async function hashPasswordOffline(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Simple deterministic fallback if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `fb-${hash}`;
}

export async function getInitialAuthState(): Promise<OfflineAuthState> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        account: OfflineOperatorAccount;
        requireLoginOnStart?: boolean;
      };
      const requireLoginOnStart = Boolean(parsed.requireLoginOnStart);
      const sessionActive = sessionRaw === 'active';
      return {
        account: parsed.account,
        requireLoginOnStart,
        isLoggedIn: requireLoginOnStart ? sessionActive : sessionActive,
      };
    }
  } catch {
    // Fallback to default local account
  }

  const defaultHash = await hashPasswordOffline('admin123');
  const defaultAccount: OfflineOperatorAccount = {
    username: 'admin',
    namaLengkap: 'Operator Desa',
    jabatan: 'Perangkat Desa',
    passwordHash: defaultHash,
  };
  saveAuthConfig(defaultAccount, false);
  return {
    account: defaultAccount,
    isLoggedIn: false,
    requireLoginOnStart: false,
  };
}

export function saveAuthConfig(
  account: OfflineOperatorAccount,
  requireLoginOnStart: boolean
): void {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ account, requireLoginOnStart })
    );
  } catch {
    // Ignore storage quota issues
  }
}

export function setOfflineSessionActive(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(SESSION_KEY, 'active');
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore
  }
}
