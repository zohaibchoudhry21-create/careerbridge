export const serializeSkillQuizForClient = (quiz) => ({
  quizId: quiz._id,
  topic: quiz.topic,
  topicLabel: quiz.topicLabel,
  difficulty: quiz.difficulty,
  questionCount: quiz.questionCount,
  status: quiz.status,
  questions: (quiz.questions || []).map((q) => ({
    questionId: q.questionId,
    question: q.question,
    options: q.options,
    subtopic: q.subtopic,
  })),
});
