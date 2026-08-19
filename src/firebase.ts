import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

/* Every Firebase import below is dynamic so the SDK lands in its own chunk and
   is never downloaded when the app runs in local-only mode. Type-only imports
   above are erased at compile time and cost nothing at runtime. */

/* The Firebase web config is public by design — it identifies the project, it
   does not authorise anything. Access is controlled by Firestore rules, which
   scope every document to the signed-in uid. */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

type Sdk = {
  auth: import("firebase/auth").Auth;
  db: Firestore;
  authMod: typeof import("firebase/auth");
  storeMod: typeof import("firebase/firestore");
};

let sdkPromise: Promise<Sdk> | null = null;

function loadSdk(): Promise<Sdk> {
  sdkPromise ??= (async () => {
    const [{ initializeApp }, authMod, storeMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(config);
    const auth = authMod.getAuth(app);
    const db = storeMod.getFirestore(app);
    if (import.meta.env.VITE_FIREBASE_EMULATOR === "1") {
      authMod.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      storeMod.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    return { auth, db, authMod, storeMod };
  })();
  return sdkPromise;
}

export type CloudState = {
  tasks?: unknown;
  habits?: unknown;
  prayers?: unknown;
  updatedAt?: unknown;
};

/** Signs in silently so data is scoped to an identity without a login wall. */
export async function startAuth(onUser: (user: User | null) => void): Promise<() => void> {
  if (!firebaseEnabled) return () => {};
  const { auth, authMod } = await loadSdk();
  return authMod.onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Anonymous by default: rules still isolate the data, no sign-in needed.
      authMod.signInAnonymously(auth).catch(() => onUser(null));
      return;
    }
    onUser(user);
  });
}

/** Upgrades the anonymous account to Google so the same data follows the user to
    other devices. If that Google account already owns cloud data, sign into it
    instead of failing. */
export async function signInWithGoogle(): Promise<void> {
  if (!firebaseEnabled) throw new Error("Firebase belum dikonfigurasi.");
  const { auth, authMod } = await loadSdk();
  const provider = new authMod.GoogleAuthProvider();
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      await authMod.linkWithPopup(current, provider);
      return;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/credential-already-in-use" && code !== "auth/email-already-in-use") throw err;
    }
  }
  await authMod.signInWithPopup(auth, provider);
}

export async function signOut(): Promise<void> {
  if (!firebaseEnabled) return;
  const { auth, authMod } = await loadSdk();
  await authMod.signOut(auth);
}

export async function subscribeToState(
  uid: string,
  onData: (state: CloudState | null) => void,
): Promise<() => void> {
  if (!firebaseEnabled) return () => {};
  const { db, storeMod } = await loadSdk();
  return storeMod.onSnapshot(
    storeMod.doc(db, "users", uid),
    (snap) => onData(snap.exists() ? (snap.data() as CloudState) : null),
    () => onData(null),
  );
}

export async function pushState(uid: string, state: Omit<CloudState, "updatedAt">): Promise<void> {
  if (!firebaseEnabled) return;
  const { db, storeMod } = await loadSdk();
  await storeMod.setDoc(
    storeMod.doc(db, "users", uid),
    { ...state, updatedAt: storeMod.serverTimestamp() },
    { merge: true },
  );
}
