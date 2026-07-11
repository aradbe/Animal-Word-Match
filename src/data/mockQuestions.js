//ואז נמלא קודם אותו, כי questionService.js תלוי בו.


/*מבנה 
{
  id,
  image_url,
  correct_word,
  distractors,
  level,
  topic,
  created_at
}
 */




export const MOCK_QUESTIONS = [
  {
    id: "mock-question-1",
    image_url:
      "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
    correct_word: "Lion",
    distractors: ["Tiger", "Bear", "Monkey"],
    level: 1,
    topic: "wild animals",
    created_at: "2026-07-11T09:00:00.000Z",
  },
  {
    id: "mock-question-2",
    image_url:
      "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80",
    correct_word: "Elephant",
    distractors: ["Giraffe", "Horse", "Rhino"],
    level: 1,
    topic: "wild animals",
    created_at: "2026-07-11T09:01:00.000Z",
  },
  {
    id: "mock-question-3",
    image_url:
      "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80",
    correct_word: "Tiger",
    distractors: ["Lion", "Zebra", "Dog"],
    level: 2,
    topic: "wild animals",
    created_at: "2026-07-11T09:02:00.000Z",
  },
];