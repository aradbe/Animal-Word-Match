/* eslint-disable react-refresh/only-export-components */

import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { authStore } from "../../stores/authStore";

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

function AuthModal({ opened, onClose, onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    setSuccessMessage("");
    authStore.clearError();

    if (isSignup) {
      const passwordError = getPasswordValidationError(password);

      // Validate the password in the UI before sending it to the auth service.
      if (passwordError) {
        setLocalError(passwordError);
        return;
      }

      const result = await authStore.signUp({
        email,
        password,
        displayName,
      });

      if (result.success) {
        setMode("login");
        setPassword("");
        setSuccessMessage("Account created successfully. Please login.");
      }

      return;
    }

    const result = await authStore.signIn({
      email,
      password,
    });

    if (result.success) {
      // Let the parent page decide where a logged-in user should go next.
      handleClose();
      onAuthSuccess?.(result.profile);
    }
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setLocalError("");
    setSuccessMessage("");
    authStore.clearError();
  }

  function handleClose() {
    // Reset modal-only messages when the modal closes.
    setLocalError("");
    setSuccessMessage("");
    authStore.clearError();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isSignup ? "Create account" : "Login"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          {localError && <Alert color="red">{localError}</Alert>}
          {authStore.error && <Alert color="red">{authStore.error}</Alert>}
          {successMessage && <Alert color="green">{successMessage}</Alert>}

          {isSignup && (
            <TextInput
              label="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          )}

          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <PasswordInput
            label="Password"
            description={
              isSignup
                ? "At least 8 characters, one English letter, and one number."
                : undefined
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" loading={authStore.isLoading}>
            {isSignup ? "Sign up" : "Login"}
          </Button>

          <Text size="sm">
            {isSignup ? "Already have an account?" : "Need an account?"}{" "}
            <button type="button" onClick={switchMode}>
              {isSignup ? "Login" : "Sign up"}
            </button>
          </Text>
        </Stack>
      </form>
    </Modal>
  );
}

export default observer(AuthModal);
