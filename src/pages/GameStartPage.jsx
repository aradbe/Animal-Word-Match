/* eslint-disable react-refresh/only-export-components */

import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Container, Stack, Card, Title, Button } from "@mantine/core";
import { authStore } from "../stores/authStore";

function GameStartPage() {
  const navigate = useNavigate();

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="lg">
        <Title order={2} ta="center">Ready to play?</Title>

        <Card w="100%" shadow="sm" radius="lg" padding="lg" withBorder>
          <Stack gap="sm">
            <Button size="md" fullWidth onClick={() => navigate("/game/play")}>
              Start Game
            </Button>

            {authStore.isLoggedIn && (
              <Button size="md" fullWidth variant="light" onClick={() => navigate("/progress")}>
                My Progress
              </Button>
            )}

            <Button size="md" fullWidth variant="subtle" color="gray" onClick={() => navigate("/")}>
              ← Back to menu
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default observer(GameStartPage);
