import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@1";
// import { GoogleGenAI } from "npm:@google/genai";

const STORAGE_BUCKET = "animal-images";

const CLOUDFLARE_IMAGE_MODEL = "@cf/bytedance/stable-diffusion-xl-lightning";

const ALLOWED_TOPICS = ["farm", "sea", "jungle", "forest", "arctic"] as const;

type Topic = (typeof ALLOWED_TOPICS)[number];
type Level = 1 | 2 | 3;

type GeneratedQuestion = {
  correct_word: string;
  distractors: string[];
};

type RequestPayload = {
  topic?: string;
  level?: number;
  force_fallback?: boolean;
};

const TOPIC_BACKGROUNDS: Record<Topic, string> = {
  farm: "an empty grassy farm field under a clear sky",
  sea: "a simple blue underwater environment",
  jungle: "a natural tropical jungle with green leaves",
  forest: "a quiet woodland environment with trees",
  arctic: "an empty snowy Arctic landscape with ice",
};

const CURRENT_ANIMALS: Record<Topic, Record<Level, string[]>> = {
  farm: {
    1: ["cow", "pig", "horse"],
    2: ["sheep", "goat"],
    3: ["donkey", "turkey"],
  },

  sea: {
    1: ["fish", "shark", "dolphin"],
    2: ["whale", "turtle"],
    3: ["octopus", "seahorse"],
  },

  jungle: {
    1: ["monkey", "tiger", "parrot"],
    2: ["gorilla", "snake"],
    3: ["jaguar", "toucan"],
  },

  forest: {
    1: ["bear", "deer", "rabbit"],
    2: ["fox", "owl"],
    3: ["raccoon", "woodpecker"],
  },

  arctic: {
    1: ["polar bear", "seal", "reindeer"],
    2: ["walrus", "arctic fox"],
    3: ["arctic hare", "snowy owl"],
  },
};

const FALLBACK_ANIMALS: Record<Topic, Record<Level, string[]>> = {
  farm: {
    1: ["chicken", "duck"],
    2: ["goose", "rooster"],
    3: ["llama", "alpaca"],
  },

  sea: {
    1: ["crab", "starfish"],
    2: ["seal", "lobster"],
    3: ["jellyfish", "squid"],
  },

  jungle: {
    1: ["elephant", "crocodile"],
    2: ["leopard", "sloth"],
    3: ["tapir", "okapi"],
  },

  forest: {
    1: ["squirrel", "wolf"],
    2: ["hedgehog", "badger"],
    3: ["moose", "lynx"],
  },

  arctic: {
    1: ["orca", "beluga"],
    2: ["puffin", "musk ox"],
    3: ["narwhal", "lemming"],
  },
};

const questionSchema = {
  type: "object",

  properties: {
    correct_word: {
      type: "string",
      description: "The common lowercase English name of one animal.",
    },

    distractors: {
      type: "array",
      description:
        "Exactly three different incorrect animal names from the same habitat.",

      items: {
        type: "string",
      },

      minItems: 3,
      maxItems: 3,
    },
  },

  required: ["correct_word", "distractors"],
};

function cleanWord(word: string): string {
  return word.trim().toLowerCase();
}

function isAllowedTopic(topic: string): topic is Topic {
  return ALLOWED_TOPICS.includes(topic as Topic);
}

function isAllowedLevel(level: number): level is Level {
  return level === 1 || level === 2 || level === 3;
}

function getImageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

function createRandomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

function validateGeneratedQuestion(
  generated: GeneratedQuestion,
): GeneratedQuestion {
  if (
    typeof generated.correct_word !== "string" ||
    !Array.isArray(generated.distractors)
  ) {
    throw new Error("Gemini returned an invalid question structure.");
  }

  if (generated.distractors.some((word) => typeof word !== "string")) {
    throw new Error("Gemini returned an invalid distractor.");
  }

  const correctWord = cleanWord(generated.correct_word);

  const distractors = generated.distractors.map(cleanWord);

  if (!correctWord) {
    throw new Error("Gemini returned an empty correct word.");
  }

  if (distractors.length !== 3) {
    throw new Error("Gemini must return exactly three distractors.");
  }

  if (distractors.some((word) => !word)) {
    throw new Error("Gemini returned an empty distractor.");
  }

  const uniqueDistractors = new Set(distractors);

  if (uniqueDistractors.size !== 3) {
    throw new Error("Gemini returned duplicate distractors.");
  }

  if (uniqueDistractors.has(correctWord)) {
    throw new Error("The correct word also appears in the distractors.");
  }

  return {
    correct_word: correctWord,
    distractors,
  };
}

function buildFallbackDistractors(
  topic: Topic,
  level: Level,
  correctWord: string,
): string[] {
  const levels: Level[] = [1, 2, 3];

  const candidates = [
    ...FALLBACK_ANIMALS[topic][level],
    ...CURRENT_ANIMALS[topic][level],

    ...levels
      .filter((currentLevel) => currentLevel !== level)
      .flatMap((currentLevel) => CURRENT_ANIMALS[topic][currentLevel]),

    ...levels
      .filter((currentLevel) => currentLevel !== level)
      .flatMap((currentLevel) => FALLBACK_ANIMALS[topic][currentLevel]),
  ];

  const uniqueCandidates = [
    ...new Set(
      candidates.map(cleanWord).filter((animal) => animal !== correctWord),
    ),
  ];

  const distractors = uniqueCandidates.slice(0, 3);

  if (distractors.length !== 3) {
    throw new Error("Could not create three fallback distractors.");
  }

  return distractors;
}

function createFallbackQuestion(
  topic: Topic,
  level: Level,
  existingWords: Set<string>,
): GeneratedQuestion {
  const availableAnimals = FALLBACK_ANIMALS[topic][level].filter(
    (animal) => !existingWords.has(cleanWord(animal)),
  );

  if (availableAnimals.length === 0) {
    throw new Error(
      `Gemini failed and no unused fallback animal remains for ${topic} level ${level}.`,
    );
  }

  const randomIndex = Math.floor(Math.random() * availableAnimals.length);

  const correctWord = cleanWord(availableAnimals[randomIndex]);

  return {
    correct_word: correctWord,

    distractors: buildFallbackDistractors(topic, level, correctWord),
  };
}

export default {
  fetch: withSupabase(
    { auth: "user" },

    async (req, ctx) => {
      let uploadedFilePath: string | null = null;

      try {
        if (req.method !== "POST") {
          return Response.json(
            {
              success: false,
              error: "Only POST requests are allowed.",
            },
            {
              status: 405,
            },
          );
        }

        // Only administrators may generate questions.
        const userId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;

        if (!userId) {
          throw new Error("Authenticated user was not found.");
        }

        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          throw new Error(`Could not check user role: ${profileError.message}`);
        }

        if (!profile || profile.role !== "admin") {
          return Response.json(
            {
              success: false,
              error: "Only administrators can generate questions.",
            },
            {
              status: 403,
            },
          );
        }

        const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

        const cloudflareApiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

        const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash";

        if (!cloudflareAccountId) {
          throw new Error("CLOUDFLARE_ACCOUNT_ID secret is missing.");
        }

        if (!cloudflareApiToken) {
          throw new Error("CLOUDFLARE_API_TOKEN secret is missing.");
        }

        let body: RequestPayload;

        try {
          body = (await req.json()) as RequestPayload;
        } catch {
          return Response.json(
            {
              success: false,
              error: "The request body must be valid JSON.",
            },
            {
              status: 400,
            },
          );
        }

        const topic =
          typeof body.topic === "string" ? cleanWord(body.topic) : "";

        const level = Number(body.level);

        const forceFallback = body.force_fallback === true;

        if (!topic) {
          return Response.json(
            {
              success: false,
              error: "Topic is required.",
            },
            {
              status: 400,
            },
          );
        }

        if (!isAllowedTopic(topic)) {
          return Response.json(
            {
              success: false,
              error: "Topic must be farm, sea, jungle, forest, or arctic.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isInteger(level) || !isAllowedLevel(level)) {
          return Response.json(
            {
              success: false,
              error: "Level must be 1, 2, or 3.",
            },
            {
              status: 400,
            },
          );
        }

        /*
         * Check all existing animals in this topic.
         * This matches the database unique index:
         * topic + correct_word.
         */
        const { data: existingQuestions, error: existingQuestionsError } =
          await ctx.supabaseAdmin
            .from("questions")
            .select("correct_word")
            .eq("topic", topic);

        if (existingQuestionsError) {
          throw new Error(
            `Could not check existing questions: ${existingQuestionsError.message}`,
          );
        }

        const existingWords = new Set(
          (existingQuestions ?? []).map((question) =>
            cleanWord(question.correct_word),
          ),
        );

        let generatedQuestion: GeneratedQuestion | null = null;

        let generationSource: "gemini" | "fallback" = "gemini";

        let fallbackReason: string | null = null;

        /*
         * Try Gemini first.
         *
         * Quota errors, invalid JSON, invalid answers,
         * and duplicate answers all activate fallback.
         */
        if (!forceFallback && geminiApiKey) {
          try {
            const { GoogleGenAI } = await import("npm:@google/genai");

            const ai = new GoogleGenAI({
              apiKey: geminiApiKey,
            });

            const questionInteraction = await ai.interactions.create({
              model: geminiModel,

              input: `
Create one animal word-to-image matching question.

Requested habitat:
${topic}

Requested difficulty level:
${level}

Difficulty:
- Level 1: very common animals young children easily recognize.
- Level 2: moderately common animals.
- Level 3: less common but still recognizable animals.

Allowed habitats:
- farm
- sea
- jungle
- forest
- arctic

Rules:
- Return one animal as the correct answer.
- The animal must naturally belong to ${topic}.
- Use the common lowercase English animal name.
- Return exactly three distractors.
- Every distractor must also be an animal.
- Every distractor must belong to the same habitat.
- The distractors should have similar difficulty.
- Do not repeat the correct answer.
- Do not repeat a distractor.
- Do not return people, buildings, objects, food, jobs, plants or vehicles.
- Do not use penguin for the Arctic habitat.
- Do not return any animal that already exists in this topic:
${[...existingWords].join(", ")}
                `,

              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: questionSchema,
              },
            });

            if (!questionInteraction.output_text) {
              throw new Error("Gemini returned no question data.");
            }

            const parsedQuestion = JSON.parse(
              questionInteraction.output_text,
            ) as GeneratedQuestion;

            const validatedQuestion = validateGeneratedQuestion(parsedQuestion);

            if (existingWords.has(validatedQuestion.correct_word)) {
              throw new Error(
                `Gemini generated the existing question "${validatedQuestion.correct_word}".`,
              );
            }

            generatedQuestion = validatedQuestion;
          } catch (error) {
            fallbackReason =
              error instanceof Error
                ? error.message
                : "Gemini generation failed.";

            console.warn("Gemini failed. Using fallback:", fallbackReason);
          }
        } else if (forceFallback) {
          fallbackReason = "Fallback was forced for testing.";
        } else {
          fallbackReason = "GEMINI_API_KEY is missing.";
        }

        if (!generatedQuestion) {
          generationSource = "fallback";

          generatedQuestion = createFallbackQuestion(
            topic,
            level,
            existingWords,
          );
        }

        const topicBackground = TOPIC_BACKGROUNDS[topic];

        const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/${CLOUDFLARE_IMAGE_MODEL}`;

        const imageResponse = await fetch(cloudflareUrl, {
          method: "POST",

          headers: {
            Authorization: `Bearer ${cloudflareApiToken}`,

            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            prompt: `
Create a photorealistic natural image of exactly one animal.

Subject:
One single ${generatedQuestion.correct_word}

Rules:
- Show exactly one ${generatedQuestion.correct_word}.
- The image must contain only one animal total.
- No other animals may appear in the background or distance.
- Show one head and one body only.
- Center the animal.
- Show the full body when possible.
- Make the animal large, clear and easy to recognize.
- The animal must look realistic, natural and lifelike.
- Make the result look like a real nature photograph.
- Use natural lighting.
- Use realistic fur, feathers, skin and body proportions.
- Leave empty space around the animal.

Background:
${topicBackground}

Important:
- Output only the natural image.
- No flashcard layout.
- No poster layout.
- No headline.
- No title.
- No banner.
- No caption.
- No label.
- No text.
- No letters.
- No words.
- No logo.
- No watermark.
- No people.
- No buildings.
- No vehicles.
- No tools.
                `,

            negative_prompt: `
text,
words,
letters,
headline,
title,
caption,
subtitle,
banner,
label,
poster,
flashcard,
sign,
logo,
watermark,
typography,
graphic design,
UI,
border,
frame,
template,
multiple animals,
more than one animal,
two animals,
three animals,
several animals,
animal group,
animal family,
animal pair,
herd,
flock,
pack,
school of fish,
duplicate animal,
repeated animal,
second animal,
extra animal,
background animal,
distant animal,
hidden animal,
partial animal,
reflection,
mirror image,
multiple ${generatedQuestion.correct_word},
second ${generatedQuestion.correct_word},
extra ${generatedQuestion.correct_word},
${generatedQuestion.distractors.join(", ")},
people,
person,
farmer,
barn,
building,
house,
tractor,
vehicle,
tools,
blurry,
collage,
split screen,
illustration,
cartoon,
drawing,
painting,
3d render
                `,

            width: 768,
            height: 768,
            num_steps: 20,
            guidance: 10,
            seed: createRandomSeed(),
          }),
        });

        if (!imageResponse.ok) {
          const cloudflareError = await imageResponse.text();

          throw new Error(
            `Cloudflare image generation failed (${imageResponse.status}): ${cloudflareError}`,
          );
        }

        const responseContentType = imageResponse.headers
          .get("content-type")
          ?.split(";")[0]
          .trim();

        const imageMimeType = responseContentType?.startsWith("image/")
          ? responseContentType
          : "image/png";

        const imageExtension = getImageExtension(imageMimeType);

        const imageBlob = await imageResponse.blob();

        if (imageBlob.size === 0) {
          throw new Error("Cloudflare returned an empty image.");
        }

        uploadedFilePath = `generated/${crypto.randomUUID()}.${imageExtension}`;

        const { error: uploadError } = await ctx.supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(uploadedFilePath, imageBlob, {
            contentType: imageMimeType,

            cacheControl: "31536000",

            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = ctx.supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(uploadedFilePath);

        const imageUrl = publicUrlData.publicUrl;

        const { data: insertedQuestion, error: insertError } =
          await ctx.supabaseAdmin
            .from("questions")
            .insert({
              image_url: imageUrl,

              correct_word: generatedQuestion.correct_word,

              distractors: generatedQuestion.distractors,

              level,
              topic,
            })
            .select()
            .single();

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error(
              `A "${generatedQuestion.correct_word}" question already exists in the ${topic} topic.`,
            );
          }

          throw new Error(`Question insert failed: ${insertError.message}`);
        }

        uploadedFilePath = null;

        return Response.json({
          success: true,

          generation_source: generationSource,

          fallback_reason:
            generationSource === "fallback" ? fallbackReason : null,

          question: insertedQuestion,
        });
      } catch (error) {
        console.error("generate-question error:", error);

        /*
         * Remove the uploaded image when database
         * insertion or another later operation fails.
         */
        if (uploadedFilePath) {
          const { error: cleanupError } = await ctx.supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([uploadedFilePath]);

          if (cleanupError) {
            console.error("Image cleanup failed:", cleanupError);
          }
        }

        return Response.json(
          {
            success: false,

            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          },
          {
            status: 500,
          },
        );
      }
    },
  ),
};
