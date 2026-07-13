import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  Alert,
  Button,
  Card,
  Container,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { authStore } from "../stores/authStore";
import { gameStore } from "../stores/gameStore";

const TOPIC_OPTIONS = [
  {
    value: "farm",
    label: "🐄 Farm",
  },
  {
    value: "sea",
    label: "🐬 Sea",
  },
  {
    value: "jungle",
    label: "🐯 Jungle",
  },
  {
    value: "forest",
    label: "🦊 Forest",
  },
  {
    value: "arctic",
    label: "🐻‍❄️ Arctic",
  },
];

const LEVEL_OPTIONS = [
  {
    value: "1",
    label: "Level 1 — Easy",
  },
  {
    value: "2",
    label: "Level 2 — Medium",
  },
  {
    value: "3",
    label: "Level 3 — Hard",
  },
];

function GameStartPage() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [level, setLevel] = useState(null);

  function handleSelectedRound() {
    if (!topic || !level) {
      return;
    }

    gameStore.setRoundOptions({
      topic,
      level: Number(level),
    });

    navigate("/game/play");
  }

  function handleMixedRound() {
    gameStore.setRoundOptions({
      topic: null,
      level: null,
    });

    navigate("/game/play");
  }

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="lg">
        <Title order={2} ta="center">
          Ready to play?
        </Title>

        <Card w="100%" shadow="sm" radius="lg" padding="lg" withBorder>
          <Stack gap="md">
            {authStore.isLoggedIn ? (
              <>
                <Text ta="center" fw={700}>
                  Choose your game
                </Text>

                <Select
                  label="Topic"
                  placeholder="Choose an animal habitat"
                  data={TOPIC_OPTIONS}
                  value={topic}
                  onChange={setTopic}
                  searchable
                  required
                />

                <Select
                  label="Level"
                  placeholder="Choose a difficulty level"
                  data={LEVEL_OPTIONS}
                  value={level}
                  onChange={setLevel}
                  required
                />

                <Alert color="blue" variant="light">
                  A selected topic and level may contain fewer than 10
                  questions. The game will use all available matching questions.
                </Alert>

                <Button
                  size="md"
                  fullWidth
                  disabled={!topic || !level}
                  onClick={handleSelectedRound}
                >
                  Start Selected Game
                </Button>

                <Button
                  size="md"
                  fullWidth
                  variant="light"
                  onClick={handleMixedRound}
                >
                  Play Mixed Game
                </Button>

                <Button
                  size="md"
                  fullWidth
                  variant="light"
                  onClick={() => navigate("/progress")}
                >
                  My Progress
                </Button>
              </>
            ) : (
              <>
                <Text ta="center" fw={700}>
                  Guest Game
                </Text>

                <Text size="sm" c="dimmed" ta="center">
                  Guests play a mixed round. Results are not saved.
                </Text>

                <Button size="md" fullWidth onClick={handleMixedRound}>
                  Start Guest Game
                </Button>
              </>
            )}

            <Button
              size="md"
              fullWidth
              variant="subtle"
              color="gray"
              onClick={() => navigate("/")}
            >
              ← Back to menu
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default observer(GameStartPage);
