import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
} from "../services/questionService";

const TOPIC_OPTIONS = [
  { value: "farm", label: "Farm" },
  { value: "sea", label: "Sea" },
  { value: "jungle", label: "Jungle" },
  { value: "forest", label: "Forest" },
  { value: "arctic", label: "Arctic" },
];

const LEVEL_OPTIONS = [
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
];

const EMPTY_FORM = {
  image_url: "",
  correct_word: "",
  distractor_1: "",
  distractor_2: "",
  distractor_3: "",
  topic: "farm",
  level: "1",
};

function normalizeText(value) {
  return value.trim();
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateForm(form) {
  const imageUrl = normalizeText(form.image_url);
  const correctWord = normalizeText(form.correct_word);
  const distractors = [
    normalizeText(form.distractor_1),
    normalizeText(form.distractor_2),
    normalizeText(form.distractor_3),
  ];

  if (!imageUrl || !correctWord || distractors.some((answer) => !answer)) {
    return "Please fill all question fields.";
  }

  if (!isValidUrl(imageUrl)) {
    return "Image URL must be a valid URL.";
  }

  const normalizedAnswers = [correctWord, ...distractors].map((answer) =>
    answer.toLowerCase(),
  );
  const uniqueAnswers = new Set(normalizedAnswers);

  if (uniqueAnswers.size !== normalizedAnswers.length) {
    return "Correct and wrong answers must be different.";
  }

  return "";
}

function buildQuestionPayload(form) {
  return {
    image_url: normalizeText(form.image_url),
    correct_word: normalizeText(form.correct_word),
    distractors: [
      normalizeText(form.distractor_1),
      normalizeText(form.distractor_2),
      normalizeText(form.distractor_3),
    ],
    topic: form.topic,
    level: Number(form.level),
  };
}

function AdminPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadQuestions() {
    setIsLoading(true);
    setError("");

    try {
      const loadedQuestions = await getAllQuestions();
      setQuestions(loadedQuestions);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadQuestions();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdQuestion = await createQuestion(buildQuestionPayload(form));

      setQuestions((currentQuestions) => [createdQuestion, ...currentQuestions]);
      setForm(EMPTY_FORM);
      setSuccessMessage("Question added.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(questionId) {
    setDeletingId(questionId);
    setError("");
    setSuccessMessage("");

    try {
      await deleteQuestion(questionId);
      setQuestions((currentQuestions) =>
        currentQuestions.filter((question) => question.id !== questionId),
      );
      setSuccessMessage("Question deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" w="100%" maw={980} mx="auto">
          <div>
            <Title order={1}>Admin Dashboard</Title>
            <Text c="dimmed" fw={600}>
              Manage game questions
            </Text>
          </div>

          <Badge size="lg" color="sunny" variant="light">
            Admin
          </Badge>
        </Group>

        {error && <Alert color="red">{error}</Alert>}
        {successMessage && <Alert color="green">{successMessage}</Alert>}

        <Stack gap="lg" align="center">
          <Card shadow="sm" radius="lg" padding="lg" withBorder w="100%" maw={980}>
            <form onSubmit={handleSubmit}>
              <Stack>
                <Title order={2} size="h3">
                  Add question
                </Title>

                <TextInput
                  label="Image URL"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(event) => updateField("image_url", event.target.value)}
                  required
                />

                <TextInput
                  label="Correct answer"
                  placeholder="parrot"
                  value={form.correct_word}
                  onChange={(event) =>
                    updateField("correct_word", event.target.value)
                  }
                  required
                />

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <TextInput
                    label="Wrong answer 1"
                    value={form.distractor_1}
                    onChange={(event) =>
                      updateField("distractor_1", event.target.value)
                    }
                    required
                  />
                  <TextInput
                    label="Wrong answer 2"
                    value={form.distractor_2}
                    onChange={(event) =>
                      updateField("distractor_2", event.target.value)
                    }
                    required
                  />
                  <TextInput
                    label="Wrong answer 3"
                    value={form.distractor_3}
                    onChange={(event) =>
                      updateField("distractor_3", event.target.value)
                    }
                    required
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Select
                    label="Topic"
                    data={TOPIC_OPTIONS}
                    value={form.topic}
                    onChange={(value) => updateField("topic", value || "farm")}
                    required
                  />
                  <Select
                    label="Level"
                    data={LEVEL_OPTIONS}
                    value={form.level}
                    onChange={(value) => updateField("level", value || "1")}
                    required
                  />
                </SimpleGrid>

                <Button type="submit" loading={isSaving}>
                  Add Question
                </Button>
              </Stack>
            </form>
          </Card>

          <Card shadow="sm" radius="lg" padding="lg" withBorder w="100%" maw={980}>
            <Stack>
              <Group justify="space-between">
                <Title order={2} size="h3">
                  Questions
                </Title>
                <Badge variant="light">{questions.length}</Badge>
              </Group>

              {isLoading ? (
                <Text c="dimmed">Loading questions...</Text>
              ) : questions.length === 0 ? (
                <Text c="dimmed">No questions yet.</Text>
              ) : (
                <Table.ScrollContainer minWidth={720}>
                  <Table verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Image</Table.Th>
                        <Table.Th>Answer</Table.Th>
                        <Table.Th>Topic</Table.Th>
                        <Table.Th>Level</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {questions.map((question) => (
                        <Table.Tr key={question.id}>
                          <Table.Td>
                            <Image
                              src={question.image_url}
                              alt={question.correct_word}
                              w={72}
                              h={48}
                              radius="md"
                              fit="cover"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text fw={700}>{question.correct_word}</Text>
                              <Text size="xs" c="dimmed">
                                {question.distractors.join(", ")}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light">{question.topic}</Badge>
                          </Table.Td>
                          <Table.Td>{question.level}</Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              color="coral"
                              variant="light"
                              loading={deletingId === question.id}
                              onClick={() => handleDelete(question.id)}
                            >
                              Delete
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
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
