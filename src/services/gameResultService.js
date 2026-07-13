

//כל מה שקשור לתוצאות משחק:
//לשמור תוצאה
//להביא היסטוריית התקדמות

import { supabase } from "../lib/supabase";

export async function saveGameResult(result) {
    // Guests/local development without Supabase should not crash the game.
    if (!supabase) {
        return null;
    }

    const { data, error } = await supabase
        .from("game_results")
        .insert({
            user_id: result.user_id,
            score: result.score,
            total_questions: result.total_questions,
            topic: result.topic ?? null,
            level: result.level ?? null,
        })
        .select()
        .single();
    if(error) throw error;
    return data;
}

// Get a user's past results.
export async function getUserProgress(userId) {
    // Show an empty progress state locally until Supabase is configured.
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from("game_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false});
    if (error) throw error;
    return data ?? [];
}
