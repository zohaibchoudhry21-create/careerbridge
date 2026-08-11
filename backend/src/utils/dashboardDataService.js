import AtsAnalysis from '../models/AtsAnalysis.js';
import InterviewReport from '../models/InterviewReport.js';
import MockInterviewSession from '../models/MockInterviewSession.js';
import ParsedResume from '../models/ParsedResume.js';
import SkillQuiz from '../models/SkillQuiz.js';

const DIMENSION_LABELS = {
  communication: 'Communication',
  technicalSkills: 'Technical Skills',
  behavior: 'Behavior',
  confidence: 'Confidence',
  leadership: 'Leadership',
  problemSolving: 'Problem Solving',
  criticalThinking: 'Critical Thinking',
};

const formatRelativeTime = (date) => {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

const buildSkillLookup = (extractedSkills = []) => {
  const lookup = new Map();
  for (const skill of extractedSkills) {
    if (skill?.id) lookup.set(skill.id, skill.name || skill.id);
  }
  return lookup;
};

const mapMissingSkills = (missingSkillIds = [], skillLookup, limit = 5) =>
  missingSkillIds.slice(0, limit).map((skillId, index) => ({
    label: skillLookup.get(skillId) || skillId,
    priority: index === 0,
  }));

const getLatestCompletedAnalysis = async (userId) =>
  AtsAnalysis.findOne({ userId, status: 'completed' })
    .sort({ updatedAt: -1 })
    .populate('jobDescriptionId')
    .lean();

const getRecentActivity = async (userId) => {
  const [latestAnalysis, latestInterview, latestResume] = await Promise.all([
    AtsAnalysis.findOne({ userId, status: 'completed' })
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean(),
    MockInterviewSession.findOne({ userId, status: 'completed' })
      .sort({ updatedAt: -1 })
      .select('updatedAt role')
      .lean(),
    ParsedResume.findOne({ userId }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
  ]);

  const candidates = [
    latestAnalysis?.updatedAt
      ? { at: latestAnalysis.updatedAt, label: `Resume scan ${formatRelativeTime(latestAnalysis.updatedAt)}` }
      : null,
    latestInterview?.updatedAt
      ? {
          at: latestInterview.updatedAt,
          label: `Mock interview (${latestInterview.role || 'practice'}) ${formatRelativeTime(latestInterview.updatedAt)}`,
        }
      : null,
    latestResume?.updatedAt
      ? { at: latestResume.updatedAt, label: `Resume updated ${formatRelativeTime(latestResume.updatedAt)}` }
      : null,
  ].filter(Boolean);

  if (!candidates.length) return null;
  candidates.sort((a, b) => new Date(b.at) - new Date(a.at));
  return candidates[0].label;
};

const buildProfileStrength = (analysis) => {
  if (!analysis) return null;

  const matched = analysis.matchedSkillIds?.length || 0;
  const missing = analysis.missingSkillIds?.length || 0;
  const skillsTotal = matched + missing;
  const skillLookup = buildSkillLookup(analysis.jobDescriptionId?.extractedSkills);
  const atsScore = Math.round(Number(analysis.atsScore) || 0);
  const jobMatchScore = Math.round(Number(analysis.jobMatchScore) || 0);
  const score = skillsTotal > 0 ? Math.round((atsScore + jobMatchScore) / 2) : atsScore;

  return {
    score,
    maxScore: 100,
    atsScore,
    skillsMatched: matched,
    skillsTotal: skillsTotal || matched,
    missingSkills: mapMissingSkills(analysis.missingSkillIds, skillLookup),
  };
};

const buildResumeIntelligence = (analysis) => {
  if (!analysis) return null;

  const pendingSuggestions = (analysis.suggestions || []).filter((item) => item.status === 'pending');
  const keywordGaps = [
    ...new Set(
      pendingSuggestions
        .filter((item) => item.type === 'missing_keyword')
        .map((item) => item.suggested || item.original)
        .filter(Boolean)
    ),
  ].slice(0, 5);

  const skillLookup = buildSkillLookup(analysis.jobDescriptionId?.extractedSkills);
  const fallbackGaps = mapMissingSkills(analysis.missingSkillIds, skillLookup, 3).map((item) => item.label);
  const gaps = keywordGaps.length ? keywordGaps : fallbackGaps;

  const topSuggestion = pendingSuggestions[0];
  const jobMatchScore = Math.round(Number(analysis.jobMatchScore) || 0);
  const improvementPotential = topSuggestion?.impact
    ? `+${Math.min(20, topSuggestion.impact * 3)}% Match`
    : jobMatchScore < 100
      ? `+${Math.max(5, 100 - jobMatchScore)}% Match`
      : 'On track';

  return {
    atsOptimizationStatus: pendingSuggestions.length ? 'Active' : 'Complete',
    keywordGaps: gaps,
    aiInsight: {
      improvementPotential,
      message:
        topSuggestion?.reason ||
        (gaps.length
          ? 'Address keyword gaps to improve ATS match for your target role.'
          : 'Your resume aligns well with the latest job description.'),
    },
  };
};

const buildInterviewReadiness = (report) => {
  if (!report) return null;

  const dimensions = report.enterpriseReport?.dimensions || report.sections || {};
  const scoredDimensions = Object.entries(dimensions)
    .map(([key, value]) => ({
      label: DIMENSION_LABELS[key] || key,
      score: Number(value?.score ?? value?.percentage),
    }))
    .filter((item) => Number.isFinite(item.score));

  const sorted = [...scoredDimensions].sort((a, b) => a.score - b.score);
  const weakAreas = (report.improvementAreas?.length
    ? report.improvementAreas
    : sorted.slice(0, 2).map((item) => item.label)
  ).slice(0, 3);

  const strongArea =
    report.strengths?.[0] ||
    [...scoredDimensions].sort((a, b) => b.score - a.score)[0]?.label ||
    'Keep practicing';

  return {
    score: Math.round(Number(report.overallScore) || 0),
    weakAreas,
    strongArea,
  };
};

const buildCareerRisk = (analysis) => {
  if (!analysis) return null;

  const matched = analysis.matchedSkillIds?.length || 0;
  const missing = analysis.missingSkillIds?.length || 0;
  const total = matched + missing;

  if (!total) {
    return {
      level: 'MEDIUM',
      summary: 'Scan a resume against a job description to assess skill alignment.',
      recommendation: 'Use Resume Scanner to compare your resume with a target role.',
    };
  }

  const missingRatio = missing / total;
  const level = missingRatio > 0.5 ? 'HIGH' : missingRatio > 0.25 ? 'MEDIUM' : 'LOW';
  const skillLookup = buildSkillLookup(analysis.jobDescriptionId?.extractedSkills);
  const topGap = mapMissingSkills(analysis.missingSkillIds, skillLookup, 1)[0]?.label;

  return {
    level,
    summary:
      level === 'LOW'
        ? 'Your skills closely match your latest scanned role.'
        : level === 'MEDIUM'
          ? 'Some skill gaps remain for your latest scanned role.'
          : 'Several required skills are missing for your latest scanned role.',
    recommendation: topGap
      ? `Prioritize building experience with ${topGap} to improve match rate.`
      : 'Review missing skills in Resume Scanner and update your resume.',
  };
};

const mapAnalysisToJobMatch = (analysis, { featured = false, recommendedByAi = false } = {}) => {
  const job = analysis.jobDescriptionId || {};
  const matchPercentage = Math.round(Number(analysis.jobMatchScore) || 0);

  return {
    id: String(analysis._id),
    title: job.title || 'Target role',
    company: job.company || 'Saved job description',
    location: '—',
    salary: '—',
    matchPercentage,
    recommendedByAi,
    applyUrl: `/resume-scanner/${analysis._id}`,
    logoUrl: '',
    featured,
  };
};

const formatShortDate = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const averageScores = (scores = []) => {
  if (!scores.length) return null;
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
};

const buildWeakSkillTallies = (interviewReports = [], quizzes = []) => {
  const tallies = new Map();

  const bump = (label) => {
    const key = String(label || '').trim();
    if (!key) return;
    tallies.set(key, (tallies.get(key) || 0) + 1);
  };

  for (const report of interviewReports) {
    for (const area of report.improvementAreas || []) bump(area);
  }

  for (const quiz of quizzes) {
    for (const area of quiz.scoredResult?.weakAreas || []) {
      bump(area.subtopic);
    }
  }

  return [...tallies.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
};

export const buildCareerProgress = async (userId) => {
  const [
    interviewReportsDesc,
    atsAnalysesDesc,
    skillQuizzesDesc,
    interviewsCompleted,
    quizzesCompleted,
    scansCompleted,
  ] = await Promise.all([
    InterviewReport.find({ userId, sourceType: 'mock_interview' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('overallScore createdAt improvementAreas sourceId')
      .lean(),
    AtsAnalysis.find({ userId, status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('atsScore jobMatchScore updatedAt')
      .lean(),
    SkillQuiz.find({ userId, status: 'submitted' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('topic topicLabel scoredResult updatedAt')
      .lean(),
    InterviewReport.countDocuments({ userId, sourceType: 'mock_interview' }),
    SkillQuiz.countDocuments({ userId, status: 'submitted' }),
    AtsAnalysis.countDocuments({ userId, status: 'completed' }),
  ]);

  const sessionIds = interviewReportsDesc.map((report) => report.sourceId).filter(Boolean);
  const sessions = sessionIds.length
    ? await MockInterviewSession.find({ _id: { $in: sessionIds } })
        .select('role roleLabel')
        .lean()
    : [];
  const sessionById = new Map(sessions.map((session) => [String(session._id), session]));

  const interviewTrend = [...interviewReportsDesc]
    .reverse()
    .map((report) => {
      const session = sessionById.get(String(report.sourceId));
      const role = session?.roleLabel || session?.role || 'Mock interview';
      return {
        id: String(report._id),
        date: report.createdAt,
        label: formatShortDate(report.createdAt),
        score: Math.round(Number(report.overallScore) || 0),
        role,
      };
    });

  const atsTrend = [...atsAnalysesDesc]
    .reverse()
    .map((analysis) => {
      const atsScore = Math.round(Number(analysis.atsScore) || 0);
      const jobMatchScore = Math.round(Number(analysis.jobMatchScore) || 0);
      return {
        id: String(analysis._id),
        date: analysis.updatedAt,
        label: formatShortDate(analysis.updatedAt),
        atsScore,
        jobMatchScore,
        score: Math.round((atsScore + jobMatchScore) / 2),
      };
    });

  const skillQuizTrend = [...skillQuizzesDesc]
    .reverse()
    .map((quiz) => ({
      id: String(quiz._id),
      date: quiz.updatedAt,
      label: formatShortDate(quiz.updatedAt),
      score: Math.round(Number(quiz.scoredResult?.percentage) || 0),
      topic: quiz.topicLabel || quiz.topic || 'Skill quiz',
    }));

  const weakSkills = buildWeakSkillTallies(interviewReportsDesc, skillQuizzesDesc);

  const timeline = [
    ...interviewReportsDesc.map((report) => {
      const session = sessionById.get(String(report.sourceId));
      const role = session?.roleLabel || session?.role || 'practice';
      return {
        id: `interview-${report._id}`,
        type: 'interview',
        date: report.createdAt,
        label: `Mock interview (${role})`,
        score: Math.round(Number(report.overallScore) || 0),
      };
    }),
    ...atsAnalysesDesc.map((analysis) => {
      const atsScore = Math.round(Number(analysis.atsScore) || 0);
      const jobMatchScore = Math.round(Number(analysis.jobMatchScore) || 0);
      return {
        id: `scan-${analysis._id}`,
        type: 'scan',
        date: analysis.updatedAt,
        label: 'Resume ATS scan',
        score: Math.round((atsScore + jobMatchScore) / 2),
      };
    }),
    ...skillQuizzesDesc.map((quiz) => ({
      id: `quiz-${quiz._id}`,
      type: 'quiz',
      date: quiz.updatedAt,
      label: `Skill quiz (${quiz.topicLabel || quiz.topic || 'topic'})`,
      score: Math.round(Number(quiz.scoredResult?.percentage) || 0),
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      relativeTime: formatRelativeTime(item.date),
    }));

  const interviewScores = interviewTrend.map((item) => item.score);
  const hasAnyData = Boolean(
    interviewTrend.length || atsTrend.length || skillQuizTrend.length
  );

  return {
    hasData: hasAnyData,
    summary: {
      interviewsCompleted,
      quizzesCompleted,
      scansCompleted,
      interviewAverage: averageScores(interviewScores),
    },
    interviewTrend,
    atsTrend,
    skillQuizTrend,
    weakSkills,
    timeline,
  };
};

export const getDashboardOverview = async (user) => {
  const userId = user._id;
  const [latestAnalysis, latestInterviewReport, lastActivity, careerProgress] = await Promise.all([
    getLatestCompletedAnalysis(userId),
    InterviewReport.findOne({ userId, sourceType: 'mock_interview' })
      .sort({ createdAt: -1 })
      .lean(),
    getRecentActivity(userId),
    buildCareerProgress(userId),
  ]);

  const hasCareerData = Boolean(latestAnalysis || latestInterviewReport);

  return {
    user: {
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      provider: user.provider,
    },
    welcome: {
      firstName: user.firstName || user.name?.split(' ')[0] || 'there',
      lastActivity: lastActivity || 'No recent activity',
      aiStatus: hasCareerData ? 'Active Career Optimization Mode' : 'Upload a resume to get started',
    },
    profileStrength: buildProfileStrength(latestAnalysis),
    resumeIntelligence: buildResumeIntelligence(latestAnalysis),
    interviewReadiness: buildInterviewReadiness(latestInterviewReport),
    careerRisk: buildCareerRisk(latestAnalysis),
    careerProgress,
  };
};

export const getJobMatches = async (user) => {
  const analyses = await AtsAnalysis.find({ userId: user._id, status: 'completed' })
    .sort({ updatedAt: -1 })
    .populate('jobDescriptionId')
    .lean();

  const latestByJob = new Map();
  for (const analysis of analyses) {
    const jobId = String(analysis.jobDescriptionId?._id || analysis.jobDescriptionId);
    if (!jobId || latestByJob.has(jobId)) continue;
    latestByJob.set(jobId, analysis);
  }

  const matches = [...latestByJob.values()]
    .map((analysis) => mapAnalysisToJobMatch(analysis))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  if (!matches.length) return [];

  const topScore = matches[0].matchPercentage;
  return matches.map((match, index) => ({
    ...match,
    featured: index === 0,
    recommendedByAi: match.matchPercentage === topScore,
  }));
};
