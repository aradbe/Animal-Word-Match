

//כל מה שקשור להתחברות:
//signup
//login
//logout
//session זמני
import { wait } from "./mockApi";

const MOCK_AUTH_KEY = "animal-word-match-auth";
const ADMIN_CODE = "admin123";

function saveAuthState(authState) {
  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(authState));
}

function readAuthState() {
  const saved = localStorage.getItem(MOCK_AUTH_KEY);

  if (!saved) {
    return {
      session: null,
      profile: null,
    };
  }

  return JSON.parse(saved);
}

function clearAuthState() {
  localStorage.removeItem(MOCK_AUTH_KEY);
}

function createProfile({ email, displayName, wantsAdmin, adminCode }) {
  const isAdmin =
    email === "admin@animal-word-match.com" ||
    (wantsAdmin && adminCode === ADMIN_CODE);

  return {
    id: crypto.randomUUID(),
    display_name: displayName || email.split("@")[0],
    role: isAdmin ? "admin" : "kid",
  };
}

export async function signUp({
  email,
  password,
  displayName,
  wantsAdmin = false,
  adminCode = "",
}) {
  await wait();

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const profile = createProfile({
    email,
    displayName,
    wantsAdmin,
    adminCode,
  });

  const session = {
    user: {
      id: profile.id,
      email,
    },
  };

  saveAuthState({ session, profile });

  return { session, profile };
}

export async function signIn({ email, password }) {
  await wait();

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const profile = createProfile({
    email,
    displayName: "",
    wantsAdmin: false,
    adminCode: "",
  });

  const session = {
    user: {
      id: profile.id,
      email,
    },
  };

  saveAuthState({ session, profile });

  return { session, profile };
}

export async function signOut() {
  await wait();

  clearAuthState();

  return { success: true };
}

export async function getCurrentSession() {
  await wait();

  const { session } = readAuthState();

  return session;
}

export async function getCurrentProfile() {
  await wait();

  const { profile } = readAuthState();

  return profile;
}