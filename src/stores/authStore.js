import { makeAutoObservable } from "mobx";
import * as authService from "../services/authService";

class AuthStore {
  user = null;
  profile = null;
  isLoading = false;
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

  async restoreSession() {
    this.isLoading = true;
    this.error = null;

    try {
      const session = await authService.getCurrentSession();
      const profile = await authService.getCurrentProfile();

      this.user = session?.user || null;
      this.profile = profile || null;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  async signUp(formData) {
    this.isLoading = true;
    this.error = null;

    try {
      const { session, profile } = await authService.signUp(formData);

      this.user = session.user;
      this.profile = profile;
    } catch (error) {
      this.error = error.message;
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
    } catch (error) {
      this.error = error.message;
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
    } catch (error) {
      this.error = error.message;
    } finally {
      this.isLoading = false;
    }
  }
}

export const authStore = new AuthStore();