// Idempotently loads data/curriculum/*.json into MongoDB: real lessons, quizzes, and the achievement
// catalog. Safe to re-run — it upserts by (title, language) / key rather than duplicating records.
// Usage: npm run import:curriculum        (writes)
//        npm run import:curriculum:check  (--dry-run: reports what would change, writes nothing)
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/config/db');
const { assertConfig } = require('../src/config/env');
const Lesson = require('../src/models/Lesson');
const Quiz = require('../src/models/Quiz');
const Achievement = require('../src/models/Achievement');

const dryRun = process.argv.includes('--dry-run');
const curriculumDir = path.join(__dirname, '..', 'data', 'curriculum');
const readJson = file => JSON.parse(fs.readFileSync(path.join(curriculumDir, file), 'utf8'));

function starterLesson(language) {
  return {
    title: `First steps in ${language}`,
    description: `Learn useful greetings and everyday phrases in ${language}.`,
    topic: 'Everyday phrases',
    order: 1,
    estimatedMinutes: 8,
    xpReward: 20,
    content: {
      vocabulary: [
        { term: 'Hello', translation: `Hello in ${language}`, example: `Practice saying hello in ${language}.` },
        { term: 'Thank you', translation: `Thank you in ${language}`, example: `Use this phrase to show appreciation in ${language}.` },
        { term: 'Please', translation: `Please in ${language}`, example: `Use this polite phrase when making a request in ${language}.` },
        { term: 'Goodbye', translation: `Goodbye in ${language}`, example: `End a conversation with goodbye in ${language}.` }
      ],
      grammar: {
        title: `Building a first phrase in ${language}`,
        explanation: `Start by learning the local words for hello, thank you, please, and goodbye. Listen for the pronunciation and repeat each phrase aloud.`
      },
      examples: [
        { text: `Hello! Nice to meet you in ${language}.`, translation: 'A friendly first greeting.' },
        { text: `Thank you. Goodbye!`, translation: 'A polite way to close a conversation.' }
      ],
      tip: `Repeat each phrase three times, then use the ${language} words in a short imaginary conversation.`
    }
  };
}

async function importLanguage(file) {
  const { language, lessons } = readJson(file);
  return importLanguageData(language, lessons);
}

async function importLanguageData(language, lessons) {
  const lessonIdByTitle = new Map();
  let created = 0, updated = 0;

  for (const lesson of lessons) {
    const query = { title: lesson.title, language, source: 'curriculum' };
    const existing = await Lesson.findOne(query).lean();
    if (dryRun) {
      console.log(`${existing ? '  ~ update' : '  + create'} lesson: ${language} / ${lesson.title}`);
    } else {
      const doc = await Lesson.findOneAndUpdate(query, { ...query, ...lesson, published: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
      lessonIdByTitle.set(lesson.title, doc._id);
    }
    existing ? updated++ : created++;
  }
  return { language, created, updated, lessonIdByTitle };
}

async function importQuizzes(lessonIdByTitleByLang) {
  const quizzes = readJson('quizzes.json');
  let created = 0, updated = 0;
  for (const quiz of quizzes) {
    const query = { title: quiz.title, language: quiz.language, source: 'curriculum' };
    const existing = await Quiz.findOne(query).lean();
    const lessonId = lessonIdByTitleByLang.get(quiz.language)?.get(quiz.lessonTitle) || null;
    if (dryRun) {
      console.log(`${existing ? '  ~ update' : '  + create'} quiz: ${quiz.language} / ${quiz.title}`);
    } else {
      await Quiz.findOneAndUpdate(query, { ...query, title: quiz.title, language: quiz.language, level: quiz.level, topic: quiz.topic, xpReward: quiz.xpReward, questions: quiz.questions, lesson: lessonId }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    existing ? updated++ : created++;
  }
  return { created, updated };
}

async function importAchievements() {
  const achievements = readJson('achievements.json');
  let created = 0, updated = 0;
  for (const achievement of achievements) {
    const existing = await Achievement.findOne({ key: achievement.key }).lean();
    if (dryRun) {
      console.log(`${existing ? '  ~ update' : '  + create'} achievement: ${achievement.key}`);
    } else {
      await Achievement.findOneAndUpdate({ key: achievement.key }, achievement, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    existing ? updated++ : created++;
  }
  return { created, updated };
}

async function main() {
  assertConfig();
  await connectDB();
  console.log(dryRun ? 'DRY RUN — no changes will be written.\n' : 'Importing curriculum...\n');

  const languageFiles = fs.readdirSync(curriculumDir)
    .filter(f => !['quizzes.json', 'achievements.json', 'languages.json'].includes(f));
  const lessonIdByTitleByLang = new Map();
  let lessonTotals = { created: 0, updated: 0 };
  for (const file of languageFiles) {
    const result = await importLanguage(file);
    lessonIdByTitleByLang.set(result.language, result.lessonIdByTitle);
    lessonTotals.created += result.created;
    lessonTotals.updated += result.updated;
  }

  const existingLanguages = new Set(languageFiles.map(file => readJson(file).language));
  const languages = readJson('languages.json');
  for (const language of languages) {
    if (existingLanguages.has(language)) continue;
    const result = await importLanguageData(language, [starterLesson(language)]);
    lessonIdByTitleByLang.set(language, result.lessonIdByTitle);
    lessonTotals.created += result.created;
    lessonTotals.updated += result.updated;
  }

  const quizTotals = await importQuizzes(lessonIdByTitleByLang);
  const achievementTotals = await importAchievements();

  console.log(`\nLessons:      ${lessonTotals.created} to create, ${lessonTotals.updated} already present`);
  console.log(`Quizzes:      ${quizTotals.created} to create, ${quizTotals.updated} already present`);
  console.log(`Achievements: ${achievementTotals.created} to create, ${achievementTotals.updated} already present`);
  console.log(dryRun ? '\nDry run complete — nothing was written.' : '\nImport complete.');
  process.exit(0);
}

main().catch(error => { console.error(error.message); process.exit(1); });
