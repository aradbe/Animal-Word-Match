import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";

import {
  deleteQuestion,
  generateQuestion,
  getAllQuestions,
} from "../services/questionService";

const TOPIC_OPTIONS = [
  {
    value: "farm",
    label: "Farm",
  },
  {
    value: "sea",
    label: "Sea",
  },
  {
    value: "jungle",
    label: "Jungle",
  },
  {
    value: "forest",
    label: "Forest",
  },
  {
    value: "arctic",
    label: "Arctic",
  },
];

const LEVEL_OPTIONS = [
  {
    value: "1",
    label: "Level 1",
  },
  {
    value: "2",
    label: "Level 2",
  },
  {
    value: "3",
    label: "Level 3",
  },
];

function getErrorMessage(error) {
  return (
    error?.message ||
    "An unexpected error occurred."
  );
}

function AdminPage() {
  const [topic, setTopic] =
    useState("farm");

  const [level, setLevel] =
    useState("1");

  const [questions, setQuestions] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadQuestions =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const loadedQuestions =
          await getAllQuestions();

        setQuestions(
          loadedQuestions,
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  async function handleGenerate(
    event,
  ) {
    event.preventDefault();

    if (
      isGenerating ||
      deletingId
    ) {
      return;
    }

    setIsGenerating(true);
    clearMessages();

    try {
      const result =
        await generateQuestion(
          topic,
          Number(level),
        );

      const createdQuestion =
        result.question;

      setQuestions(
        (currentQuestions) => [
          createdQuestion,
          ...currentQuestions.filter(
            (question) =>
              question.id !==
              createdQuestion.id,
          ),
        ],
      );

      const generationMethod =
        result.generation_source ===
        "fallback"
          ? " using the fallback system"
          : " using Gemini";

      setSuccessMessage(
        `"${createdQuestion.correct_word}" was generated${generationMethod}.`,
      );
    } catch (generateError) {
      setError(
        getErrorMessage(
          generateError,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDelete(
    question,
  ) {
    if (
      deletingId ||
      isGenerating
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete the "${question.correct_word}" question?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(question.id);
    clearMessages();

    try {
      const result =
        await deleteQuestion(
          question.id,
        );

      setQuestions(
        (currentQuestions) =>
          currentQuestions.filter(
            (currentQuestion) =>
              currentQuestion.id !==
              question.id,
          ),
      );

      setSuccessMessage(
        `"${question.correct_word}" was deleted.`,
      );

      if (result.warning) {
        setError(result.warning);
      }
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError),
      );
    } finally {
      setDeletingId("");
    }
  }

  const actionInProgress =
    isGenerating ||
    Boolean(deletingId);

  return (
    <Container
      size="lg"
      py="xl"
    >
      <Stack gap="lg">
        <Group
          justify="space-between"
          align="flex-start"
          w="100%"
          maw={980}
          mx="auto"
        >
          <div>
            <Title order={1}>
              Admin Dashboard
            </Title>

            <Text
              c="dimmed"
              fw={600}
            >
              Manage game questions
            </Text>
          </div>

          <Badge
            size="lg"
            color="sunny"
            variant="light"
          >
            Admin
          </Badge>
        </Group>

        {error && (
          <Alert
            color="red"
            title="Error"
            w="100%"
            maw={980}
            mx="auto"
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            color="green"
            title="Success"
            w="100%"
            maw={980}
            mx="auto"
          >
            {successMessage}
          </Alert>
        )}

        <Stack
          gap="lg"
          align="center"
        >
          <Card
            shadow="sm"
            radius="lg"
            padding="lg"
            withBorder
            w="100%"
            maw={980}
          >
            <form
              onSubmit={
                handleGenerate
              }
            >
              <Stack>
                <Title
                  order={2}
                  size="h3"
                >
                  Add question
                </Title>

                <Text
                  size="sm"
                  c="dimmed"
                >
                  Choose a topic and
                  difficulty. The animal,
                  answers and image will be
                  generated automatically.
                </Text>

                <Select
                  label="Topic"
                  data={TOPIC_OPTIONS}
                  value={topic}
                  onChange={(value) => {
                    setTopic(
                      value || "farm",
                    );

                    clearMessages();
                  }}
                  disabled={
                    actionInProgress
                  }
                  required
                />

                <Select
                  label="Level"
                  data={LEVEL_OPTIONS}
                  value={level}
                  onChange={(value) => {
                    setLevel(
                      value || "1",
                    );

                    clearMessages();
                  }}
                  disabled={
                    actionInProgress
                  }
                  required
                />

                <Button
                  type="submit"
                  loading={
                    isGenerating
                  }
                  disabled={
                    actionInProgress
                  }
                >
                  Add Question
                </Button>
              </Stack>
            </form>
          </Card>

          <Card
            shadow="sm"
            radius="lg"
            padding="lg"
            withBorder
            w="100%"
            maw={980}
          >
            <Stack>
              <Group justify="space-between">
                <Title
                  order={2}
                  size="h3"
                >
                  Questions
                </Title>

                <Badge variant="light">
                  {questions.length}
                </Badge>
              </Group>

              {isLoading ? (
                <Text c="dimmed">
                  Loading questions...
                </Text>
              ) : questions.length === 0 ? (
                <Text c="dimmed">
                  No questions yet.
                </Text>
              ) : (
                <Table.ScrollContainer
                  minWidth={720}
                >
                  <Table
                    verticalSpacing="sm"
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>
                          Image
                        </Table.Th>

                        <Table.Th>
                          Answer
                        </Table.Th>

                        <Table.Th>
                          Topic
                        </Table.Th>

                        <Table.Th>
                          Level
                        </Table.Th>

                        <Table.Th>
                          Actions
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {questions.map(
                        (question) => (
                          <Table.Tr
                            key={
                              question.id
                            }
                          >
                            <Table.Td>
                              <Image
                                src={
                                  question.image_url
                                }
                                alt={
                                  question.correct_word
                                }
                                w={72}
                                h={48}
                                radius="md"
                                fit="cover"
                              />
                            </Table.Td>

                            <Table.Td>
                              <Stack
                                gap={2}
                              >
                                <Text
                                  fw={700}
                                >
                                  {
                                    question.correct_word
                                  }
                                </Text>

                                <Text
                                  size="xs"
                                  c="dimmed"
                                >
                                  {question.distractors.join(
                                    ", ",
                                  )}
                                </Text>
                              </Stack>
                            </Table.Td>

                            <Table.Td>
                              <Badge variant="light">
                                {
                                  question.topic
                                }
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              {
                                question.level
                              }
                            </Table.Td>

                            <Table.Td>
                              <Button
                                size="xs"
                                color="coral"
                                variant="light"
                                loading={
                                  deletingId ===
                                  question.id
                                }
                                disabled={
                                  actionInProgress
                                }
                                onClick={() =>
                                  handleDelete(
                                    question,
                                  )
                                }
                              >
                                Delete
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ),
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}

export default AdminPage;