import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { gameStore } from "../stores/gameStore";
import { authStore } from "../stores/authStore";

function formatTopic(topic) {
  if (!topic) {
    return "Mixed topics";
  }

  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

function ResultsPage() {
  const navigate = useNavigate();

  const topicLabel = formatTopic(gameStore.roundTopic);

  const levelLabel =
    gameStore.roundLevel === null
      ? "Mixed levels"
      : `Level ${gameStore.roundLevel}`;

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="lg">
        <Title order={2} ta="center">
          Round Complete!
        </Title>

        <Card w="100%" shadow="sm" radius="lg" padding="lg" withBorder>
          <Stack gap="md">
            <Text size="xl" fw={800} ta="center">
              {gameStore.score} / {gameStore.totalQuestions}
            </Text>

            <Text c="dimmed" ta="center">
              Correct answers
            </Text>

            <Group justify="center" gap="sm">
              <Badge size="lg" variant="light">
                {topicLabel}
              </Badge>

              <Badge size="lg" variant="light" color="orange">
                {levelLabel}
              </Badge>
            </Group>

            <Text ta="center">
              Best streak: <strong>{gameStore.bestStreak}</strong>
            </Text>

            {authStore.isLoggedIn ? (
              <Text size="sm" c="green" ta="center">
                Your result was saved.
              </Text>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                Guest results are not saved.
              </Text>
            )}

            <Button fullWidth onClick={() => navigate("/game/play")}>
              Play Again
            </Button>

            <Button fullWidth variant="light" onClick={() => navigate("/game")}>
              Change Topic or Level
            </Button>

            <Button
              fullWidth
              variant="subtle"
              color="gray"
              onClick={() => navigate("/")}
            >
              Back to Menu
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default observer(ResultsPage);
