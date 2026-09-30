// Deterministic skill-matching engine. No external API needed.
//
// Score = 70% skill coverage + 15% experience fit + 15% interest/type fit
//   skill coverage per required skill:
//     verified skill      -> 0.80 + 0.20 * proficiency   (trusted: issuer-verified)
//     self-reported skill -> 0.45 + 0.15 * proficiency   (claimed, unverified)
//     only used in a project -> 0.35                     (weak evidence)
//     missing             -> 0
const WEIGHTS = { skills: 0.7, experience: 0.15, interest: 0.15 };

const norm = (s) => String(s || '').trim().toLowerCase();

function experienceYears(experiences = []) {
  const now = Date.now();
  const ms = experiences.reduce((sum, e) => {
    const start = new Date(e.startDate).getTime();
    const end = e.endDate ? new Date(e.endDate).getTime() : now;
    return sum + Math.max(0, end - start);
  }, 0);
  return ms / (365 * 24 * 3600 * 1000);
}

// student: { skills:[{skill:{name}, proficiency, status}], projects:[{technologies}], experiences, interests }
// opportunity: { title, type, minExperience, skills:[{skill:{name}}] }
function computeMatch(student, opportunity) {
  const required = opportunity.skills.map((s) => s.skill.name);
  const owned = new Map(student.skills.map((s) => [norm(s.skill.name), s]));
  const projectTech = new Set((student.projects || []).flatMap((p) => p.technologies.map(norm)));

  const matched = [];
  const missing = [];
  let skillPoints = 0;

  for (const name of required) {
    const own = owned.get(norm(name));
    if (own && own.status === 'VERIFIED') {
      skillPoints += 0.8 + 0.2 * (own.proficiency / 100);
      matched.push({ name, source: 'verified', proficiency: own.proficiency });
    } else if (own) {
      skillPoints += 0.45 + 0.15 * (own.proficiency / 100);
      matched.push({ name, source: 'self-reported', proficiency: own.proficiency });
    } else if (projectTech.has(norm(name))) {
      skillPoints += 0.35;
      matched.push({ name, source: 'project', proficiency: null });
    } else {
      missing.push(name);
    }
  }
  const skillScore = required.length ? skillPoints / required.length : 0.5;

  const years = experienceYears(student.experiences) + (student.projects?.length || 0) * 0.2;
  const experienceScore = opportunity.minExperience > 0 ? Math.min(1, years / opportunity.minExperience) : 1;

  const haystack = [opportunity.title, opportunity.type, ...required].map(norm).join(' ');
  const interestHit = (student.interests || []).some((i) => i && haystack.includes(norm(i)));
  const interestScore = interestHit ? 1 : 0.5;

  const score = Math.round(
    100 * (WEIGHTS.skills * skillScore + WEIGHTS.experience * experienceScore + WEIGHTS.interest * interestScore),
  );

  const verifiedCount = matched.filter((m) => m.source === 'verified').length;
  const parts = [];
  if (required.length) {
    parts.push(
      `You match ${matched.length} of ${required.length} required skills${verifiedCount ? `, ${verifiedCount} of them verified` : ''}.`,
    );
  } else {
    parts.push('This opportunity lists no specific skills, so the match is based on your overall profile.');
  }
  if (missing.length) parts.push(`Missing: ${missing.join(', ')}.`);
  if (opportunity.minExperience > 0) {
    parts.push(
      experienceScore >= 1
        ? `Your projects and experience cover the ${opportunity.minExperience}-year requirement.`
        : `This role prefers ${opportunity.minExperience}+ years of experience; you are at about ${years.toFixed(1)}.`,
    );
  }
  if (interestHit) parts.push('It lines up with your stated interests.');

  return {
    score: Math.min(100, Math.max(0, score)),
    matched,
    missing,
    explanation: parts.join(' '),
    breakdown: {
      skills: Math.round(skillScore * 100),
      experience: Math.round(experienceScore * 100),
      interest: Math.round(interestScore * 100),
    },
  };
}

module.exports = { computeMatch, experienceYears };
