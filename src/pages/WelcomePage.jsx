/* eslint-disable react-refresh/only-export-components */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import AuthModal from "../components/auth/AuthModal";
import { authStore } from "../stores/authStore";

function WelcomePage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  function handleStartGame() {
    navigate(authStore.isLoggedIn ? "/game/play" : "/game");
  }

  function handleLoginClick() {
    // Login and signup stay in a modal, so there is no separate /login route.
    setIsAuthModalOpen(true);
  }

  function handleAuthSuccess(profile) {
    // Admins enter the admin area immediately after login.
    if (profile?.role === "admin") {
      navigate("/admin");
    }
  }

  function handleLogout() {
    authStore.signOut();
  }

  return (
    <main>
      <h1>Animal Word Match</h1>
      <p>Learn animal words the fun way!</p>

      {authStore.isLoggedIn ? (
        <>
          <button onClick={handleStartGame}>Start Game</button>
          {authStore.isAdmin && (
            <button onClick={() => navigate("/admin")}>Admin dashboard</button>
          )}
          <button onClick={() => navigate("/progress")}>My progress</button>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={handleStartGame}>Play as guest</button>
          <button onClick={handleLoginClick}>Login</button>
        </>
      )}

      <AuthModal
        opened={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}

export default observer(WelcomePage);
