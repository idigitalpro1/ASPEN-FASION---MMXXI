import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged as fbOnAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const rawAuth = getAuth(app);

// Simulated/Mock User support
let customAuthUser: any = null;
const authListeners: Array<(user: any) => void> = [];

// Try to restore user session from localStorage
try {
  const cached = localStorage.getItem('aspen_mock_user');
  if (cached) {
    customAuthUser = JSON.parse(cached);
  }
} catch (e) {
  console.warn("Local storage cached user load failed:", e);
}

// Expose callback runner for manual simulated sign-ins
export function triggerMockAuthChange(user: any) {
  customAuthUser = user;
  if (user) {
    localStorage.setItem('aspen_mock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('aspen_mock_user');
  }
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.warn("Auth state listener error:", e);
    }
  });
}

// Proxy auth to safely intercept currentUser and onAuthStateChanged without throwing property redefine errors
const auth: any = new Proxy(rawAuth, {
  get(target, prop, receiver) {
    if (prop === 'currentUser') {
      return customAuthUser || target.currentUser;
    }
    if (prop === 'onAuthStateChanged') {
      return (nextOrObserver: any, error?: any, completed?: any) => {
        const isFunction = typeof nextOrObserver === 'function';
        const callback = isFunction ? nextOrObserver : (nextOrObserver as any)?.next;
        if (!callback) return () => {};

        authListeners.push(callback);

        let unsubscribeFirebase = () => {};
        try {
          unsubscribeFirebase = fbOnAuthStateChanged(target, (user: any) => {
            if (user && !customAuthUser) {
              triggerMockAuthChange(user);
            } else if (!user && !customAuthUser) {
              callback(null);
            } else {
              callback(customAuthUser);
            }
          }, error, completed);
        } catch (err) {
          console.warn("Firebase onAuthStateChanged subscription handled:", err);
        }

        if (customAuthUser) {
          setTimeout(() => callback(customAuthUser), 0);
        }

        return () => {
          try {
            unsubscribeFirebase();
          } catch (_) {}
          const index = authListeners.indexOf(callback);
          if (index !== -1) {
            authListeners.splice(index, 1);
          }
        };
      };
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  },
  set(target, prop, value) {
    if (prop === 'currentUser') {
      customAuthUser = value;
      return true;
    }
    return Reflect.set(target, prop, value);
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, auth };
