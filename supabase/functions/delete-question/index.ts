import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const STORAGE_BUCKET = "animal-images";

type DeleteQuestionPayload = {
  question_id?: string;
};

function getStoragePath(imageUrl: string): string | null {
  try {
    const parsedUrl = new URL(imageUrl);

    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const storagePath = parsedUrl.pathname.slice(markerIndex + marker.length);

    if (!storagePath) {
      return null;
    }

    return decodeURIComponent(storagePath);
  } catch {
    return null;
  }
}

export default {
  fetch: withSupabase(
    { auth: "user" },

    async (req, ctx) => {
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

        const userId = ctx.userClaims?.sub;

        if (!userId) {
          return Response.json(
            {
              success: false,
              error: "Authenticated user was not found.",
            },
            {
              status: 401,
            },
          );
        }

        // Check that the signed-in user is an admin.
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
              error: "Only administrators can delete questions.",
            },
            {
              status: 403,
            },
          );
        }

        let body: DeleteQuestionPayload;

        try {
          body = (await req.json()) as DeleteQuestionPayload;
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

        const questionId =
          typeof body.question_id === "string" ? body.question_id.trim() : "";

        if (!questionId) {
          return Response.json(
            {
              success: false,
              error: "question_id is required.",
            },
            {
              status: 400,
            },
          );
        }

        // Load the question before deletion so its image can
        // also be removed from Supabase Storage.
        const { data: question, error: questionError } = await ctx.supabaseAdmin
          .from("questions")
          .select("id, correct_word, image_url")
          .eq("id", questionId)
          .maybeSingle();

        if (questionError) {
          throw new Error(`Could not load question: ${questionError.message}`);
        }

        if (!question) {
          return Response.json(
            {
              success: false,
              error: "Question was not found.",
            },
            {
              status: 404,
            },
          );
        }

        // Delete the question row.
        const { error: deleteError } = await ctx.supabaseAdmin
          .from("questions")
          .delete()
          .eq("id", questionId);

        if (deleteError) {
          throw new Error(`Question deletion failed: ${deleteError.message}`);
        }

        // Delete the generated image from Storage.
        const storagePath = getStoragePath(question.image_url);

        let imageDeleted = false;
        let warning: string | null = null;

        if (storagePath && storagePath.startsWith("generated/")) {
          const { error: storageDeleteError } = await ctx.supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath]);

          if (storageDeleteError) {
            warning = `The question was deleted, but image cleanup failed: ${storageDeleteError.message}`;

            console.error(warning);
          } else {
            imageDeleted = true;
          }
        }

        return Response.json({
          success: true,

          deleted_question: {
            id: question.id,
            correct_word: question.correct_word,
          },

          image_deleted: imageDeleted,
          warning,
        });
      } catch (error) {
        console.error("delete-question error:", error);

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
