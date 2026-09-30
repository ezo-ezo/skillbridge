// Profile completeness (0-100). Each check has a weight; unmet checks are returned as tips.
function profileCompletion(profile, user) {
  const skills = profile.skills || [];
  const checks = [
    { label: 'Add a profile photo', weight: 8, ok: !!user.avatarUrl },
    { label: 'Write a headline', weight: 7, ok: !!profile.headline },
    { label: 'Write a bio', weight: 10, ok: !!profile.bio && profile.bio.length > 30 },
    { label: 'Link GitHub or LinkedIn', weight: 8, ok: !!(profile.githubUrl || profile.linkedinUrl) },
    { label: 'Add at least 5 skills', weight: 15, ok: skills.length >= 5 },
    { label: 'Get a skill verified', weight: 15, ok: skills.some((s) => s.status === 'VERIFIED') },
    { label: 'Add a project', weight: 12, ok: (profile.projects || []).length >= 1 },
    { label: 'Submit a credential', weight: 12, ok: (profile.credentials || []).length >= 1 },
    { label: 'Add experience', weight: 7, ok: (profile.experiences || []).length >= 1 },
    { label: 'Add an achievement', weight: 6, ok: (profile.achievements || []).length >= 1 },
  ];
  const score = checks.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0);
  return { score, tips: checks.filter((c) => !c.ok).map((c) => c.label) };
}

module.exports = { profileCompletion };
