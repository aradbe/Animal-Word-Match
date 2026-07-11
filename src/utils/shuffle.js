// Returns a new array with the items randomly reordered.
// Does not modify the original array.
// I want to shuffle the annswers such as the correct answer doesn't show in the same place in every question.

export function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}