import { wait } from "./mockApi";

const MOCK_AUTH_KEY = "animal-word-match-auth";
const MOCK_USERS_KEY = "animal-word-match-users";
const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "Admin1234";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getPasswordValidationError(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one English letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }

  return "";
}

function readJson(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function saveAuthState(authState) {
  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(authState));
}

function readAuthState() {
  return readJson(MOCK_AUTH_KEY, {
    session: null,
    profile: null,
  });
}

function clearAuthState() {
  localStorage.removeItem(MOCK_AUTH_KEY);
}

function readUsers() {
  return readJson(MOCK_USERS_KEY, []);
}

function saveUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function createProfile({ id, email, displayName }) {
  const normalizedEmail = normalizeEmail(email);

  return {
    id,
    display_name: displayName || normalizedEmail.split("@")[0],
    // Mock admin rule: in Supabase this should come from a profiles.role column.
    role: normalizedEmail === ADMIN_EMAIL ? "admin" : "kid",
  };
}

function getBuiltInAdmin() {
  const id = "mock-admin-user";

  return {
    id,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: "Admin",
    profile: createProfile({
      id,
      email: ADMIN_EMAIL,
      displayName: "Admin",
    }),
  };
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === ADMIN_EMAIL) {
    return getBuiltInAdmin();
  }

  return readUsers().find((user) => user.email === normalizedEmail) || null;
}

export async function signUp({ email, password, displayName }) {
  await wait();

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordError = getPasswordValidationError(password);

  // Keep the mock service protected even if signup is called outside AuthModal.
  if (passwordError) {
    throw new Error(passwordError);
  }

  // Prevent duplicate accounts in the temporary localStorage mock database.
  if (findUserByEmail(normalizedEmail)) {
    throw new Error("This email is already registered.");
  }

  const id = crypto.randomUUID();
  const profile = createProfile({
    id,
    email: normalizedEmail,
    displayName,
  });

  const users = readUsers();
  users.push({
    id,
    email: normalizedEmail,
    password,
    displayName,
    profile,
  });
  saveUsers(users);

  return {
    success: true,
    email: normalizedEmail,
  };
}

export async function signIn({ email, password }) {
  await wait();

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    user: {
      id: user.id,
      email: user.email,
    },
  };

  saveAuthState({ session, profile: user.profile });

  return { session, profile: user.profile };
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
