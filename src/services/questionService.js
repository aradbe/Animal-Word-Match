import { MOCK_QUESTIONS } from "../data/mockQuestions";
import { cloneData } from "./mockApi";
import { supabase } from "../lib/supabase";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check your environment variables.",
    );
  }
}

async function requireSignedInUser() {
  requireSupabase();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    throw new Error("You must be signed in to perform this action.");
  }

  return session;
}

async function getFunctionErrorMessage(error) {
  const response = error?.context;

  if (response) {
    try {
      const readableResponse =
        typeof response.clone === "function" ? response.clone() : response;

      const responseBody = await readableResponse.json();

      if (responseBody?.error) {
        return responseBody.error;
      }

      if (responseBody?.message) {
        return responseBody.message;
      }
    } catch {
      // Fall back to the normal error message.
    }
  }

  return error?.message || "The Edge Function request failed.";
}

function shuffleQuestions(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export async function getQuestions(level, amount = 10) {
  if (!supabase) {
    return cloneData(MOCK_QUESTIONS)
      .filter((question) => question.level === Number(level))
      .slice(0, amount);
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("level", Number(level));

  if (error) {
    throw new Error(error.message);
  }

  return shuffleQuestions(data ?? []).slice(0, amount);
}

export async function getAllQuestions() {
  if (!supabase) {
    return cloneData(MOCK_QUESTIONS);
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function generateQuestion(topic, level) {
  const session = await requireSignedInUser();

  const { data, error } = await supabase.functions.invoke("generate-question", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },

    body: {
      topic,
      level: Number(level),
      force_fallback: true,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data?.success) {
    throw new Error(data?.error || "Question generation failed.");
  }

  return data;
}

/*
 * Kept temporarily so another component importing
 * createQuestion does not break.
 */
export async function createQuestion(questionData) {
  const result = await generateQuestion(questionData.topic, questionData.level);

  return result.question;
}

export async function deleteQuestion(questionId) {
  const session = await requireSignedInUser();

  const { data, error } = await supabase.functions.invoke("delete-question", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },

    body: {
      question_id: questionId,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data?.success) {
    throw new Error(data?.error || "Question deletion failed.");
  }

  return data;
}
