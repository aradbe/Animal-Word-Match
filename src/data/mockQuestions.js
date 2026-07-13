// Single source of mock questions for the whole app.
// Exported as MOCK_QUESTIONS because questionService imports this name.
// Shape matches the agreed `question` contract, so swapping to real Supabase
// data later changes no UI code.
export const MOCK_QUESTIONS = [
  {
    id: 'mock-1',
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cow_female_black_white.jpg?width=600',
    correct_word: 'cow',
    distractors: ['pig', 'horse', 'sheep'],
    level: 1,
    topic: 'farm',
    created_at: '2026-07-09T09:00:00.000Z',
  },
  {
    id: 'mock-2',
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Nokota_Horses.jpg?width=600',
    correct_word: 'horse',
    distractors: ['cow', 'goat', 'sheep'],
    level: 1,
    topic: 'farm',
    created_at: '2026-07-09T09:01:00.000Z',
  },
  {
    id: 'mock-3',
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rooster_portrait2.jpg?width=600',
    correct_word: 'chicken',
    distractors: ['duck', 'goose', 'turkey'],
    level: 2,
    topic: 'farm',
    created_at: '2026-07-09T09:02:00.000Z',
  },
  {
    id: 'mock-4',
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tursiops_truncatus_01.jpg?width=600',
    correct_word: 'dolphin',
    distractors: ['shark', 'whale', 'seal'],
    level: 2,
    topic: 'sea',
    created_at: '2026-07-09T09:03:00.000Z',
  },
  {
    id: 'mock-5',
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Octopus_vulgaris_2.jpg?width=600',
    correct_word: 'octopus',
    distractors: ['squid', 'crab', 'jellyfish'],
    level: 3,
    topic: 'sea',
    created_at: '2026-07-09T09:04:00.000Z',
  },
]
