/* eslint-disable react-refresh/only-export-components */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Container, Stack, Card, Title, Text, Button, Box } from "@mantine/core";
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
    <Container size="xs" py="xl">
      <Stack align="center" gap="lg">
        <Box
          aria-hidden
          style={{
            width: 116,
            height: 116,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 58,
            background: "radial-gradient(circle at 50% 40%, #FEE7B8, #FBD98E)",
            border: "5px solid #F4A93C",
            boxShadow: "0 0 0 10px rgba(244,169,60,.16)",
          }}
        >
          🦁
        </Box>

        <Title order={1} ta="center" fw={800} style={{ letterSpacing: "-.5px" }}>
          <Text span inherit c="#3B342C">Animal </Text>
          <Text span inherit c="brandTeal.6">Word </Text>
          <Text span inherit c="coral.6">Match</Text>
        </Title>

        <Text c="dimmed" fw={600}>Learn animal words the fun way!</Text>

        <Card w="100%" shadow="sm" radius="lg" padding="lg" withBorder>
          <Stack gap="sm">
            {authStore.isLoggedIn ? (
              <>
                <Button size="md" fullWidth onClick={handleStartGame}>
                  Start Game
                </Button>
                <Button size="md" fullWidth variant="light" onClick={() => navigate("/progress")}>
                  My progress
                </Button>
                {authStore.isAdmin && (
                  <Button size="md" fullWidth variant="light" color="sunny" onClick={() => navigate("/admin")}>
                    Admin dashboard
                  </Button>
                )}
                <Button size="md" fullWidth variant="subtle" color="gray" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button size="md" fullWidth onClick={handleStartGame}>
                  Play as guest
                </Button>
                <Button size="md" fullWidth variant="light" onClick={handleLoginClick}>
                  Login
                </Button>
              </>
            )}
          </Stack>
        </Card>
      </Stack>

      <AuthModal
        opened={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </Container>
  );
}

export default observer(WelcomePage);
