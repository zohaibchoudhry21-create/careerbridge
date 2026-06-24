const hashString = (value) => {
  let hash = 0;
  const str = String(value || '');

  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getDashboardOverview = (user) => {
  const seed = hashString(user._id || user.email);
  const profileStrength = 72 + (seed % 18);
  const atsScore = 68 + (seed % 20);
  const skillsMatched = 10 + (seed % 8);
  const skillsTotal = 20;
  const interviewReadiness = 60 + (seed % 25);

  return {
    user: {
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      provider: user.provider,
    },
    welcome: {
      firstName: user.name?.split(' ')[0] || 'there',
      lastActivity: 'Resume optimized 2 days ago',
      aiStatus: 'Active Career Optimization Mode',
    },
    profileStrength: {
      score: profileStrength,
      maxScore: 100,
      atsScore,
      skillsMatched,
      skillsTotal,
      missingSkills: [
        { label: 'React', priority: true },
        { label: 'Cloud Basics', priority: false },
        { label: 'AI Tools', priority: false },
      ],
    },
    resumeIntelligence: {
      atsOptimizationStatus: 'Active',
      keywordGaps: ['React.js', 'Node.js', 'API Integration'],
      aiInsight: {
        improvementPotential: '+12% Match',
        message: 'Improvement potential if project descriptions are quantified.',
      },
    },
    interviewReadiness: {
      score: interviewReadiness,
      weakAreas: ['Eye Contact', 'Voice Stability'],
      strongArea: 'Technical Knowledge',
    },
    careerRisk: {
      level: seed % 3 === 0 ? 'LOW' : seed % 3 === 1 ? 'MEDIUM' : 'HIGH',
      summary: 'Market demand for non-AI Frontend roles is decreasing.',
      recommendation:
        'Pivot toward AI-enabled development. Learning AI tools will increase match rate by 35%.',
    },
  };
};

export const getJobMatches = (user) => {
  const seed = hashString(`${user._id}-jobs`);

  return [
    {
      id: 'job-1',
      title: 'Frontend Developer',
      company: 'Google',
      location: 'Remote',
      salary: '$120k - $160k',
      matchPercentage: 80 + (seed % 10),
      recommendedByAi: true,
      applyUrl: '#',
      logoUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAdJ_RoZOf1lC7WVUeDGOxtRofLA3BnZf9WalCZyzK2JrHXHgt2foGIuL13MZYbvyVhWSSrqeaEvbXg2cyZStKEgMObZtonxO1V_leVOJNHRi3VjfKDgSMdU8EiT2g9djUWPgS3KmNLliK9fTD73DsVLl73ujjZqNeIXW-qYIcCJUxtVH9C_xWQGBoyna_xRYwIkz9g9yh7gwx-nkTky7XZHf0d98sFTvmLYi__7Y_BSkcWbl8vJlXVJmD7zsf8DkjLBT-qvSwlwNU',
      featured: true,
    },
    {
      id: 'job-2',
      title: 'WordPress Developer',
      company: 'Automattic',
      location: 'Hybrid',
      salary: '$95k - $130k',
      matchPercentage: 75 + (seed % 10),
      recommendedByAi: false,
      applyUrl: '#',
      logoUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDITMJtgmBVHMWCxYBQNBa3bnlZeLlJRz8gjvonmYI3OcYUzVdH83L7-AQ4WGK6CtDQ-qNbVI2bi_Wswa4UTS2_Y5_2sx1q7IqJj0Y-aAKSPuD_Lu0vhdOikCP4Eg20dFtiEVhjevDV_Exho9Y6SSZrt09P4X-9_bLQZ-G-Ud3DV8Vma55aJmZHGse6ehXVKR4si-9vX2Wu0PKe3Ir_c30igEVHQQhx4wM-iEVX17xI8YRcu1dAeCMqdd_3l1EPxzufPvjKJ6Sbf98',
      featured: false,
    },
    {
      id: 'job-3',
      title: 'Junior AI Assistant',
      company: 'OpenAI',
      location: 'San Francisco',
      salary: '$140k - $180k',
      matchPercentage: 70 + (seed % 10),
      recommendedByAi: false,
      applyUrl: '#',
      logoUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBwneywfakh6dN63jqdWoghmsJoP8xMi_N4fsHQBOTnVpJE7KEan6lo2OJaduSHHplb2507oB8UhTTDKzasvC_GTui5x56ZL3mDcbBdUrmiMbL59lAkfnPqk93hkmAzt9QqTNvCMVjlO583V_Wx4OCgGryHFxZY0G4KB3FxNveGjmISfzgkcsUgXgDse5bFNUdstl-80sD2O4ZG6kysv6QMEInRf4EKbpI_9Br0htKzz1NtYP95YI7e_qmT7ez4oa3A8Xo7A1PkISU',
      featured: false,
    },
  ];
};
