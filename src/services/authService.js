import { wait } from "./mockApi";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const MOCK_AUTH_KEY = "animal-word-match-auth";
const MOCK_USERS_KEY = "animal-word-match-users";
const ADMIN_EMAILS = ["aradbeneliezer@gmail.com"];
const ADMIN_PASSWORD = "Admin1234";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isAdminEmail(email) {
  const normalizedEmail = normalizeEmail(email || "");

  return ADMIN_EMAILS.includes(normalizedEmail);
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
    // Keep the local mock aligned with the configured admin emails.
    role: isAdminEmail(normalizedEmail) ? "admin" : "kid",
  };
}

function getBuiltInAdmin(email) {
  const normalizedEmail = normalizeEmail(email);
  const id = `mock-admin-user-${normalizedEmail}`;

  return {
    id,
    email: normalizedEmail,
    password: ADMIN_PASSWORD,
    displayName: "Admin",
    profile: createProfile({
      id,
      email: normalizedEmail,
      displayName: "Admin",
    }),
  };
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (isAdminEmail(normalizedEmail)) {
    return getBuiltInAdmin(normalizedEmail);
  }

  return readUsers().find((user) => user.email === normalizedEmail) || null;
}

function getSupabaseErrorMessage(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists")) {
    return "This email is already registered.";
  }

  if (lowerMessage.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  return message;
}

async function getSupabaseProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return data;
}

function buildProfileFromSupabaseUser(user, profile) {
  const normalizedEmail = normalizeEmail(user.email || "");

  return {
    id: user.id,
    display_name: profile?.display_name || normalizedEmail.split("@")[0] || "Player",
    // Supabase profile is the source of truth; admin email list is a local fallback.
    role: profile?.role === "admin" || isAdminEmail(normalizedEmail) ? "admin" : "kid",
  };
}

export async function signUp({ email, password, displayName }) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordError = getPasswordValidationError(password);

  // Keep the mock service protected even if signup is called outside AuthModal.
  if (passwordError) {
    throw new Error(passwordError);
  }

  if (isSupabaseConfigured) {
    // Supabase Auth owns the real users table, so duplicate emails are blocked there.
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          display_name: displayName || normalizedEmail.split("@")[0],
        },
      },
    });

    if (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }

    return {
      success: true,
      email: normalizedEmail,
    };
  }

  await wait();

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
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = normalizeEmail(email);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }

    const profile = buildProfileFromSupabaseUser(
      data.session.user,
      await getSupabaseProfile(data.session.user.id),
    );

    return { session: data.session, profile };
  }

  await wait();

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
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }

    return { success: true };
  }

  await wait();

  clearAuthState();

  return { success: true };
}

export async function getCurrentSession() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }

    return data.session;
  }

  await wait();

  const { session } = readAuthState();

  return session;
}

export async function getCurrentProfile() {
  if (isSupabaseConfigured) {
    const session = await getCurrentSession();

    if (!session?.user) {
      return null;
    }

    return buildProfileFromSupabaseUser(
      session.user,
      await getSupabaseProfile(session.user.id),
    );
  }

  await wait();

  const { profile } = readAuthState();

  return profile;
}
