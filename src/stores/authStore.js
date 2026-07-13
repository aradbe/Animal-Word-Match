import { makeAutoObservable } from "mobx";
import * as authService from "../services/authService";

class AuthStore {
  user = null;
  profile = null;

  // Used for login, signup and logout button loading states.
  isLoading = false;

  // Used only to know whether the initial session check finished.
  isInitialized = false;

  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isLoggedIn() {
    return Boolean(this.user);
  }

  get isAdmin() {
    return this.profile?.role === "admin";
  }

  clearError() {
    this.error = null;
  }

  async restoreSession() {
    // Prevent repeated initialization requests.
    if (this.isInitialized) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const session = await authService.getCurrentSession();

      this.user = session?.user || null;

      if (session?.user) {
        const profile = await authService.getCurrentProfile();

        this.profile = profile || null;
      } else {
        this.profile = null;
      }
    } catch (error) {
      this.user = null;
      this.profile = null;

      this.error =
        error instanceof Error
          ? error.message
          : "Could not restore the session.";
    } finally {
      this.isLoading = false;
      this.isInitialized = true;
    }
  }

  async signUp(formData) {
    this.isLoading = true;
    this.error = null;

    try {
      await authService.signUp(formData);

      return {
        success: true,
      };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Signup failed.";

      return {
        success: false,
      };
    } finally {
      this.isLoading = false;
    }
  }

  async signIn(formData) {
    this.isLoading = true;
    this.error = null;

    try {
      const { session, profile } = await authService.signIn(formData);

      this.user = session.user;
      this.profile = profile;

      // The app definitely has an auth result now.
      this.isInitialized = true;

      return {
        success: true,
        profile,
      };
    } catch (error) {
      this.user = null;
      this.profile = null;

      this.error = error instanceof Error ? error.message : "Login failed.";

      return {
        success: false,
      };
    } finally {
      this.isLoading = false;
    }
  }

  async signOut() {
    this.isLoading = true;
    this.error = null;

    try {
      await authService.signOut();

      this.user = null;
      this.profile = null;
      this.isInitialized = true;

      return {
        success: true,
      };
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Logout failed.";

      return {
        success: false,
      };
    } finally {
      this.isLoading = false;
    }
  }
}

export const authStore = new AuthStore();
