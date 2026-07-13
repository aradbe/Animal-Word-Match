const ENDPOINT =
  "https://gkaccsbcyyizvpslbtep.supabase.co/functions/v1/seed-question";

// Cow is not included because the good cow question
// was already created manually.
const questions = [
  // FARM — 2 more level 1, 2 level 2, 2 level 3
  {
    topic: "farm",
    level: 1,
    correct_word: "pig",
    distractors: ["cow", "goat", "sheep"],
  },
  {
    topic: "farm",
    level: 1,
    correct_word: "horse",
    distractors: ["cow", "pig", "goat"],
  },
  {
    topic: "farm",
    level: 2,
    correct_word: "sheep",
    distractors: ["goat", "cow", "donkey"],
  },
  {
    topic: "farm",
    level: 2,
    correct_word: "goat",
    distractors: ["sheep", "pig", "donkey"],
  },
  {
    topic: "farm",
    level: 3,
    correct_word: "donkey",
    distractors: ["horse", "goat", "cow"],
  },
  {
    topic: "farm",
    level: 3,
    correct_word: "turkey",
    distractors: ["chicken", "duck", "goose"],
  },

  // SEA
  {
    topic: "sea",
    level: 1,
    correct_word: "fish",
    distractors: ["shark", "whale", "dolphin"],
  },
  {
    topic: "sea",
    level: 1,
    correct_word: "shark",
    distractors: ["fish", "whale", "seal"],
  },
  {
    topic: "sea",
    level: 1,
    correct_word: "dolphin",
    distractors: ["shark", "whale", "turtle"],
  },
  {
    topic: "sea",
    level: 2,
    correct_word: "whale",
    distractors: ["dolphin", "shark", "seal"],
  },
  {
    topic: "sea",
    level: 2,
    correct_word: "turtle",
    distractors: ["seal", "dolphin", "shark"],
  },
  {
    topic: "sea",
    level: 3,
    correct_word: "octopus",
    distractors: ["squid", "crab", "lobster"],
  },
  {
    topic: "sea",
    level: 3,
    correct_word: "seahorse",
    distractors: ["fish", "starfish", "jellyfish"],
  },

  // JUNGLE
  {
    topic: "jungle",
    level: 1,
    correct_word: "monkey",
    distractors: ["tiger", "parrot", "snake"],
  },
  {
    topic: "jungle",
    level: 1,
    correct_word: "tiger",
    distractors: ["monkey", "parrot", "gorilla"],
  },
  {
    topic: "jungle",
    level: 1,
    correct_word: "parrot",
    distractors: ["monkey", "tiger", "snake"],
  },
  {
    topic: "jungle",
    level: 2,
    correct_word: "gorilla",
    distractors: ["monkey", "tiger", "jaguar"],
  },
  {
    topic: "jungle",
    level: 2,
    correct_word: "snake",
    distractors: ["lizard", "parrot", "monkey"],
  },
  {
    topic: "jungle",
    level: 3,
    correct_word: "jaguar",
    distractors: ["tiger", "leopard", "gorilla"],
  },
  {
    topic: "jungle",
    level: 3,
    correct_word: "toucan",
    distractors: ["parrot", "monkey", "jaguar"],
  },

  // FOREST
  {
    topic: "forest",
    level: 1,
    correct_word: "bear",
    distractors: ["deer", "fox", "rabbit"],
  },
  {
    topic: "forest",
    level: 1,
    correct_word: "deer",
    distractors: ["bear", "fox", "rabbit"],
  },
  {
    topic: "forest",
    level: 1,
    correct_word: "rabbit",
    distractors: ["deer", "fox", "bear"],
  },
  {
    topic: "forest",
    level: 2,
    correct_word: "fox",
    distractors: ["wolf", "deer", "raccoon"],
  },
  {
    topic: "forest",
    level: 2,
    correct_word: "owl",
    distractors: ["eagle", "fox", "raccoon"],
  },
  {
    topic: "forest",
    level: 3,
    correct_word: "raccoon",
    distractors: ["fox", "skunk", "badger"],
  },
  {
    topic: "forest",
    level: 3,
    correct_word: "woodpecker",
    distractors: ["owl", "eagle", "sparrow"],
  },

  // ARCTIC
  {
    topic: "arctic",
    level: 1,
    correct_word: "polar bear",
    distractors: ["seal", "walrus", "reindeer"],
  },
  {
    topic: "arctic",
    level: 1,
    correct_word: "seal",
    distractors: ["polar bear", "walrus", "reindeer"],
  },
  {
    topic: "arctic",
    level: 1,
    correct_word: "reindeer",
    distractors: ["polar bear", "seal", "walrus"],
  },
  {
    topic: "arctic",
    level: 2,
    correct_word: "walrus",
    distractors: ["seal", "polar bear", "reindeer"],
  },
  {
    topic: "arctic",
    level: 2,
    correct_word: "arctic fox",
    distractors: ["polar bear", "arctic hare", "reindeer"],
  },
  {
    topic: "arctic",
    level: 3,
    correct_word: "arctic hare",
    distractors: ["arctic fox", "reindeer", "seal"],
  },
  {
    topic: "arctic",
    level: 3,
    correct_word: "snowy owl",
    distractors: ["arctic fox", "arctic hare", "reindeer"],
  },
];

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function seedQuestion(question, currentNumber) {
  console.log(
    `\n[${currentNumber}/${questions.length}] Generating ${question.correct_word}...`,
  );

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(question),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `The function returned an invalid response. HTTP status: ${response.status}`,
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || `The request failed with HTTP status ${response.status}`,
    );
  }

  console.log(`✅ Added: ${result.question.correct_word}`);

  return result.question;
}

async function seedAllQuestions() {
  const successful = [];
  const failed = [];

  console.log(`Starting ${questions.length} question generations...`);
  console.log("Do not close this terminal until it finishes.");

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];

    try {
      const insertedQuestion = await seedQuestion(question, index + 1);

      successful.push(insertedQuestion);
    } catch (error) {
      console.error(
        `❌ Failed: ${question.correct_word}`,
        error instanceof Error ? error.message : error,
      );

      failed.push({
        question,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Wait between Cloudflare image requests.
    if (index < questions.length - 1) {
      console.log("Waiting 2 seconds...");
      await wait(2000);
    }
  }

  console.log("\n==============================");
  console.log("Seeding finished");
  console.log("==============================");
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed questions:");
    console.dir(failed, {
      depth: null,
    });

    console.log(
      "\nDo not run the whole file again, because that would create duplicates.",
    );
  }
}

seedAllQuestions().catch((error) => {
  console.error("The seeding process stopped unexpectedly:", error);

  process.exitCode = 1;
});
