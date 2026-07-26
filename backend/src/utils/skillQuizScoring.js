/**
 * Pure scoring helpers for skill quizzes (unit-testable).
 */

/**
 * @param {Array<{ questionId: string, correctIndex: number, subtopic?: string, explanation?: string, question?: string, options?: string[] }>} questions
 * @param {Array<{ questionId: string, selectedIndex: number }>} answers
 */
export const scoreSkillQuiz = (questions, answers) => {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));
  const perQuestion = [];
  let score = 0;

  for (const question of questions) {
    const selectedIndex = answerMap.get(question.questionId);
    const answered = selectedIndex !== undefined && selectedIndex !== null;
    const correct =
      answered && Number(selectedIndex) === Number(question.correctIndex);

    if (correct) {
      score += 1;
    }

    perQuestion.push({
      questionId: question.questionId,
      subtopic: question.subtopic || 'general',
      correct,
      selectedIndex: answered ? Number(selectedIndex) : null,
      correctIndex: question.correctIndex,
      question: question.question,
      options: question.options,
      explanation: question.explanation || '',
    });
  }

  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    score,
    total,
    percentage,
    perQuestion,
  };
};

/**
 * @param {Array<{ subtopic: string, correct: boolean }>} perQuestion
 */
export const computeWeakAreas = (perQuestion) => {
  const bySubtopic = new Map();

  for (const row of perQuestion) {
    const key = row.subtopic || 'general';
    const entry = bySubtopic.get(key) || { subtopic: key, correct: 0, total: 0 };
    entry.total += 1;
    if (row.correct) {
      entry.correct += 1;
    }
    bySubtopic.set(key, entry);
  }

  const weakAreas = [...bySubtopic.values()]
    .map((entry) => ({
      subtopic: entry.subtopic,
      correct: entry.correct,
      total: entry.total,
      accuracy: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return weakAreas;
};

/**
 * @param {Array<{ correct: boolean, questionId: string, question?: string, options?: string[], correctIndex: number, selectedIndex: number | null, explanation: string, subtopic: string }>} perQuestion
 */
export const buildReviewList = (perQuestion) =>
  perQuestion
    .filter((row) => !row.correct)
    .map((row) => ({
      questionId: row.questionId,
      question: row.question,
      options: row.options,
      selectedIndex: row.selectedIndex,
      correctIndex: row.correctIndex,
      explanation: row.explanation,
      subtopic: row.subtopic,
    }));
