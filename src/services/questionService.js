//בהמשך מחליפים בפנים את הקוד ל-Supabase בלי לשנות את כל ה-UI.

//כל מה שקשור לשאלות:
//להביא שאלות
//להביא את כל השאלות
//ליצור שאלה mock
//למחוק שאלה



import { MOCK_QUESTIONS } from "../data/mockQuestions";
import { cloneData, wait } from "./mockApi";
import { supabase } from "../lib/supabase"

let questions = cloneData(MOCK_QUESTIONS);

export async function getQuestions(level, amount = 10) {
  await wait();

  return questions
    .filter((question) => question.level === Number(level))
    .slice(0, amount);
}

export async function getAllQuestions() {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*");

    if (error) throw error;

    // Empty table - fall back to mock so the game still works
    if (!data || data.length === 0) {
      return cloneData(MOCK_QUESTIONS);
    }

    return data;
  } catch (err) {
    
    console.error("getAllQuestions failed, using mock fallback:", err);
    return cloneData(MOCK_QUESTIONS);
  }
}

export async function generateQuestion(topic, level) {
  await wait(700);

  const newQuestion = {
    id: crypto.randomUUID(),
    image_url:
      "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80",
    correct_word: "Fox",
    distractors: ["Wolf", "Dog", "Cat"],
    level: Number(level),
    topic,
    created_at: new Date().toISOString(),
  };

  questions = [newQuestion, ...questions];

  return cloneData(newQuestion);
}

export async function deleteQuestion(questionId) {
  await wait();

  questions = questions.filter((question) => question.id !== questionId);

  return { success: true };
}