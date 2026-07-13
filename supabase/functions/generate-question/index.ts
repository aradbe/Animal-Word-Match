import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { GoogleGenAI } from "npm:@google/genai";

const STORAGE_BUCKET = "animal-images";

const CLOUDFLARE_IMAGE_MODEL =
  "@cf/bytedance/stable-diffusion-xl-lightning";

type GeneratedQuestion = {
  correct_word: string;
  distractors: string[];
  image_prompt: string;
};

const questionSchema = {
  type: "object",
  properties: {
    correct_word: {
      type: "string",
      description:
        "The common English name of exactly one animal represented by the image.",
    },

    distractors: {
      type: "array",
      description:
        "Exactly three believable but incorrect animal names.",
      items: {
        type: "string",
      },
      minItems: 3,
      maxItems: 3,
    },

    image_prompt: {
      type: "string",
      description:
        "A clear image prompt showing exactly one animal, with no people, buildings, objects, text, or other animals.",
    },
  },

  required: [
    "correct_word",
    "distractors",
    "image_prompt",
  ],
};

function cleanWord(word: string): string {
  return word.trim().toLowerCase();
}

function validateGeneratedQuestion(
  generated: GeneratedQuestion,
): GeneratedQuestion {
  if (
    typeof generated.correct_word !== "string" ||
    !Array.isArray(generated.distractors) ||
    typeof generated.image_prompt !== "string"
  ) {
    throw new Error(
      "Gemini returned an invalid question structure.",
    );
  }

  const correctWord = cleanWord(
    generated.correct_word,
  );

  const distractors = generated.distractors.map(
    cleanWord,
  );

  const imagePrompt =
    generated.image_prompt.trim();

  if (!correctWord) {
    throw new Error(
      "Gemini returned an empty correct word.",
    );
  }

  if (distractors.length !== 3) {
    throw new Error(
      "Gemini must return exactly three distractors.",
    );
  }

  if (distractors.some((word) => !word)) {
    throw new Error(
      "Gemini returned an empty distractor.",
    );
  }

  const uniqueDistractors = new Set(
    distractors,
  );

  if (uniqueDistractors.size !== 3) {
    throw new Error(
      "Gemini returned duplicate distractors.",
    );
  }

  if (uniqueDistractors.has(correctWord)) {
    throw new Error(
      "The correct word also appears in the distractors.",
    );
  }

  if (!imagePrompt) {
    throw new Error(
      "Gemini returned an empty image prompt.",
    );
  }

  return {
    correct_word: correctWord,
    distractors,
    image_prompt: imagePrompt,
  };
}

function getImageExtension(
  mimeType: string,
): string {
  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg"
  ) {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

export default {
  fetch: withSupabase(
    { auth: "user" },

    async (req, ctx) => {
      let uploadedFilePath: string | null =
        null;

      try {
        if (req.method !== "POST") {
          return Response.json(
            {
              success: false,
              error:
                "Only POST requests are allowed.",
            },
            {
              status: 405,
            },
          );
        }

        const geminiApiKey = Deno.env.get(
          "GEMINI_API_KEY",
        );

        const cloudflareAccountId =
          Deno.env.get(
            "CLOUDFLARE_ACCOUNT_ID",
          );

        const cloudflareApiToken =
          Deno.env.get(
            "CLOUDFLARE_API_TOKEN",
          );

        if (!geminiApiKey) {
          throw new Error(
            "GEMINI_API_KEY secret is missing.",
          );
        }

        if (!cloudflareAccountId) {
          throw new Error(
            "CLOUDFLARE_ACCOUNT_ID secret is missing.",
          );
        }

        if (!cloudflareApiToken) {
          throw new Error(
            "CLOUDFLARE_API_TOKEN secret is missing.",
          );
        }

        const body = await req.json();

        const topic =
          typeof body.topic === "string"
            ? body.topic.trim().toLowerCase()
            : "";

        const level = Number(body.level);

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

        if (
          !Number.isInteger(level) ||
          level <= 0
        ) {
          return Response.json(
            {
              success: false,
              error:
                "Level must be a positive whole number.",
            },
            {
              status: 400,
            },
          );
        }

        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
        });

        // 1. Generate animal-only question data with Gemini.
        const questionInteraction =
          await ai.interactions.create({
            model: "gemini-3.5-flash",

            input: `
Create one educational animal word-to-image matching question.

Animal category, habitat, or environment:
${topic}

Difficulty level:
${level}

Important rules:
- The correct answer MUST be the common English name of an animal.
- The correct answer must never be a building, place, object, plant, food, vehicle, person, job, or activity.
- The topic only describes the animal's category, habitat, or environment.
- For the topic "farm", valid answers include cow, pig, horse, sheep, goat, duck, or chicken.
- "Barn", "tractor", "fence", "hay", and "farmer" are invalid because they are not animals.
- For the topic "ocean", valid answers include shark, dolphin, whale, octopus, seal, or turtle.
- Return exactly three incorrect distractors.
- Every distractor MUST also be the common English name of an animal.
- Distractors should be believable for the requested topic and difficulty.
- Do not repeat the correct answer.
- Do not repeat any distractor.
- Use lowercase English animal names.
- Prefer one short word when possible.
- The image prompt must describe exactly one animal.
- The image prompt must not request buildings, people, tools, vehicles, text, labels, or additional animals.
            `,

            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: questionSchema,
            },
          });

        if (
          !questionInteraction.output_text
        ) {
          throw new Error(
            "Gemini did not return question data.",
          );
        }

        const parsedQuestion = JSON.parse(
          questionInteraction.output_text,
        ) as GeneratedQuestion;

        const generatedQuestion =
          validateGeneratedQuestion(
            parsedQuestion,
          );

        // 2. Generate the animal image with Cloudflare Workers AI.
        const cloudflareUrl =
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/${CLOUDFLARE_IMAGE_MODEL}`;

        const imageResponse = await fetch(
          cloudflareUrl,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${cloudflareApiToken}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              prompt: `
Create a clear educational image for a children's animal word-matching game.

Show exactly one animal:
${generatedQuestion.correct_word}

Image description:
${generatedQuestion.image_prompt}

Requirements:
- The main subject must clearly be one ${generatedQuestion.correct_word}.
- Show exactly one animal.
- Center the animal in the image.
- Show the animal's full body when possible.
- Use a simple and uncluttered natural background.
- Use bright, realistic colors.
- Do not show people.
- Do not show barns, buildings, tools, tractors, vehicles, signs, or unrelated objects.
- Do not include words, letters, captions, labels, logos, or watermarks.
- Do not show any of these other animals:
${generatedQuestion.distractors.join(", ")}
              `,

              negative_prompt: `
words, letters, text, captions, labels,
logos, watermarks, borders, UI elements,
people, farmer, barn, building, house,
tractor, vehicle, tools, signs,
multiple animals, extra animals,
blurry image, cropped subject,
${generatedQuestion.distractors.join(", ")}
              `,

              width: 1024,
              height: 1024,
              num_steps: 4,
              guidance: 7.5,
            }),
          },
        );

        if (!imageResponse.ok) {
          const cloudflareError =
            await imageResponse.text();

          throw new Error(
            `Cloudflare image generation failed (${imageResponse.status}): ${cloudflareError}`,
          );
        }

        const imageArrayBuffer =
          await imageResponse.arrayBuffer();

        if (imageArrayBuffer.byteLength === 0) {
          throw new Error(
            "Cloudflare returned an empty image.",
          );
        }

        const responseContentType =
          imageResponse.headers
            .get("content-type")
            ?.split(";")[0]
            .trim();

        const imageMimeType =
          responseContentType?.startsWith(
            "image/",
          )
            ? responseContentType
            : "image/png";

        const imageExtension =
          getImageExtension(imageMimeType);

        const imageBlob = new Blob(
          [imageArrayBuffer],
          {
            type: imageMimeType,
          },
        );

        // 3. Upload the image to Supabase Storage.
        uploadedFilePath =
          `generated/${crypto.randomUUID()}.${imageExtension}`;

        const { error: uploadError } =
          await ctx.supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(
              uploadedFilePath,
              imageBlob,
              {
                contentType: imageMimeType,
                cacheControl: "31536000",
                upsert: false,
              },
            );

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`,
          );
        }

        const { data: publicUrlData } =
          ctx.supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(
              uploadedFilePath,
            );

        const imageUrl =
          publicUrlData.publicUrl;

        // 4. Insert the completed question into the database.
        const {
          data: insertedQuestion,
          error: insertError,
        } = await ctx.supabaseAdmin
          .from("questions")
          .insert({
            image_url: imageUrl,
            correct_word:
              generatedQuestion.correct_word,
            distractors:
              generatedQuestion.distractors,
            level,
            topic,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(
            `Question insert failed: ${insertError.message}`,
          );
        }

        uploadedFilePath = null;

        return Response.json({
          success: true,
          question: insertedQuestion,
        });
      } catch (error) {
        console.error(
          "generate-question error:",
          error,
        );

        if (uploadedFilePath) {
          const { error: cleanupError } =
            await ctx.supabaseAdmin.storage
              .from(STORAGE_BUCKET)
              .remove([uploadedFilePath]);

          if (cleanupError) {
            console.error(
              "Image cleanup failed:",
              cleanupError,
            );
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