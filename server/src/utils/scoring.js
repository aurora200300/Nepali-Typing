export function calculateTypingStats({ targetText, typedText, durationSeconds }) {
  const safeDuration = Math.max(1, Number(durationSeconds || 1));
  let correctChars = 0;
  let mistakes = 0;
  for (let i = 0; i < typedText.length; i += 1) {
    if (typedText[i] === targetText[i]) correctChars += 1;
    else mistakes += 1;
  }
  const typedChars = typedText.length;
  const minutes = safeDuration / 60;
  const wpm = Math.round(((typedChars / 5) / minutes) * 10) / 10;
  const accuracy = typedChars === 0 ? 0 : Math.round((correctChars / typedChars) * 1000) / 10;
  const score = Math.max(0, Math.round(wpm * accuracy + correctChars - mistakes * 2));
  return { typedChars, correctChars, mistakes, wpm, accuracy, score };
}

export function getLevel(bestWpm) {
  if (bestWpm >= 55) return 'Advanced';
  if (bestWpm >= 30) return 'Intermediate';
  return 'Beginner';
}
