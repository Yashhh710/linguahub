// Text comparison used to score spoken practice against the expected phrase.
function normalize(text = '') {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC') // strip Latin accents, keep kana/kanji marks
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const x = Array.from(a), y = Array.from(b);
  if (!x.length) return y.length;
  if (!y.length) return x.length;
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[y.length];
}

/** 0-100 similarity score. */
function score(expected, heard) {
  const a = normalize(expected).replace(/\s/g, ''), b = normalize(heard).replace(/\s/g, '');
  if (!a && !b) return 0;
  const max = Math.max(Array.from(a).length, Array.from(b).length);
  return Math.max(0, Math.round((1 - levenshtein(a, b) / max) * 100));
}

/** Per-word match report so the learner sees exactly what to fix. */
function wordReport(expected, heard) {
  const exp = normalize(expected), got = normalize(heard);
  const spaced = exp.includes(' ');
  const tokens = spaced ? exp.split(' ') : Array.from(exp);
  const pool = spaced ? got.split(' ') : Array.from(got.replace(/\s/g, ''));
  const remaining = [...pool];
  return tokens.map(word => {
    const idx = remaining.indexOf(word);
    if (idx >= 0) remaining.splice(idx, 1);
    return { word, matched: idx >= 0 };
  });
}

module.exports = { normalize, levenshtein, score, wordReport };
