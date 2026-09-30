const router = require('express').Router();
const { body } = require('express-validator');
const VoicePractice = require('../models/VoicePractice');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { score: similarityScore, wordReport } = require('../utils/similarity');
const { awardXp } = require('../services/gamificationService');

// The browser does speech-to-text (Web Speech API) and posts the transcript here; the server
// re-scores it (never trusts a client-computed score), awards XP for a good attempt,
// and records every completed attempt as learning activity for the daily streak.
router.post('/attempts', requireAuth, [
  body('language').trim().notEmpty(),
  body('expectedText').trim().isLength({ min: 1, max: 300 }),
  body('heardText').optional().trim().isLength({ max: 300 }),
  body('lesson').optional().isMongoId()
], validate, asyncHandler(async (req, res) => {
  const { language, expectedText, heardText = '', lesson } = req.body;
  const accuracy = similarityScore(expectedText, heardText);
  const xpEarned = accuracy >= 90 ? 10 : accuracy >= 70 ? 5 : 0;

  const attempt = await VoicePractice.create({ user: req.user.id, language, expectedText, heardText, accuracy, xpEarned, lesson });
  const gains = await awardXp(req.app.get('io'), {
    userId: req.user.id, xp: xpEarned, source: 'voice', ref: String(attempt._id), label: expectedText, language
  });

  res.status(201).json({ success: true, data: { attempt, wordReport: wordReport(expectedText, heardText), gains } });
}));

router.get('/attempts/me', requireAuth, asyncHandler(async (req, res) => {
  const attempts = await VoicePractice.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
  res.json({ success: true, data: attempts });
}));

module.exports = router;
