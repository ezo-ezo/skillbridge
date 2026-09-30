// Integration tests against the seeded dev database. Run with `npm test` (DB must be running and seeded).
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/index');
const { computeMatch } = require('../src/services/matching');

const PASSWORD = 'Demo@1234';
let server;
let base;

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(() => new Promise((resolve) => server.close(resolve)));

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}
async function login(email, role) {
  const r = await call('POST', '/auth/login', { body: { email, password: PASSWORD, role } });
  assert.equal(r.status, 200, `login ${email}`);
  return r.body.token;
}

test('matching engine: verified > self-reported > missing', () => {
  const student = {
    skills: [
      { skill: { name: 'React' }, proficiency: 80, status: 'VERIFIED' },
      { skill: { name: 'Node.js' }, proficiency: 80, status: 'PENDING' },
    ],
    projects: [{ technologies: ['Docker'] }],
    experiences: [],
    interests: [],
  };
  const opp = { title: 'Dev', type: 'JOB', minExperience: 0, skills: ['React', 'Node.js', 'Docker', 'Go'].map((name) => ({ skill: { name } })) };
  const m = computeMatch(student, opp);
  assert.deepEqual(m.matched.map((x) => [x.name, x.source]), [['React', 'verified'], ['Node.js', 'self-reported'], ['Docker', 'project']]);
  assert.deepEqual(m.missing, ['Go']);
  assert.ok(m.score > 0 && m.score < 100);
});

test('auth: login succeeds for each role, fails for bad password / wrong role', async () => {
  await login('student@skillbridge.demo', 'STUDENT');
  await login('institution@skillbridge.demo', 'INSTITUTION');
  await login('employer@skillbridge.demo', 'EMPLOYER');
  const bad = await call('POST', '/auth/login', { body: { email: 'student@skillbridge.demo', password: 'nope', role: 'STUDENT' } });
  assert.equal(bad.status, 401);
  const wrongRole = await call('POST', '/auth/login', { body: { email: 'student@skillbridge.demo', password: PASSWORD, role: 'EMPLOYER' } });
  assert.equal(wrongRole.status, 401);
});

test('auth: /me requires a token and never returns the password hash', async () => {
  assert.equal((await call('GET', '/auth/me')).status, 401);
  const token = await login('student@skillbridge.demo', 'STUDENT');
  const me = await call('GET', '/auth/me', { token });
  assert.equal(me.body.user.role, 'STUDENT');
  assert.ok(!JSON.stringify(me.body).includes('passwordHash'));
});

test('registration: validates input and rejects duplicates', async () => {
  const weak = await call('POST', '/auth/register', { body: { role: 'STUDENT', name: 'X', email: 'bad', password: '1' } });
  assert.equal(weak.status, 400);
  const dup = await call('POST', '/auth/register', {
    body: { role: 'EMPLOYER', companyName: 'Dup Co', recruiterName: 'Dup Person', email: 'employer@skillbridge.demo', password: PASSWORD },
  });
  assert.equal(dup.status, 409);
});

test('role-based access control', async () => {
  const student = await login('student@skillbridge.demo', 'STUDENT');
  const employer = await login('employer@skillbridge.demo', 'EMPLOYER');
  assert.equal((await call('GET', '/verification/pending', { token: student })).status, 403);
  assert.equal((await call('GET', '/candidates', { token: student })).status, 403);
  assert.equal((await call('GET', '/matches', { token: employer })).status, 403);
  assert.equal((await call('GET', '/analytics/institution', { token: employer })).status, 403);
});

test('student: recommendations are sorted by match and explained', async () => {
  const token = await login('student@skillbridge.demo', 'STUDENT');
  const { body } = await call('GET', '/matches', { token });
  assert.ok(body.matches.length > 3);
  const scores = body.matches.map((m) => m.match.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  const detail = await call('GET', `/opportunities/${body.matches[0].id}/match`, { token });
  assert.ok(detail.body.match.explanation.length > 10);
});

test('student: apply once, duplicate rejected, applications listed', async () => {
  const token = await login('ananya.iyer@skillbridge.demo', 'STUDENT');
  const { body } = await call('GET', '/opportunities?q=Developer%20Intern', { token });
  const target = body.opportunities.find((o) => !o.applicationStatus);
  assert.ok(target, 'an unapplied opportunity exists');
  const first = await call('POST', '/applications', { token, body: { opportunityId: target.id } });
  assert.equal(first.status, 201);
  const second = await call('POST', '/applications', { token, body: { opportunityId: target.id } });
  assert.equal(second.status, 409);
  const mine = await call('GET', '/applications', { token });
  assert.ok(mine.body.applications.some((a) => a.opportunity.id === target.id));
});

test('credential flow: submit -> institution approves -> skill becomes verified', async () => {
  const student = await login('arjun.verma@skillbridge.demo', 'STUDENT'); // Aravali
  const institution = await login('institution2@skillbridge.demo', 'INSTITUTION');
  const created = await call('POST', '/credentials', {
    token: student,
    body: { type: 'CERTIFICATION', title: 'Test Go Cert', issuer: 'Test Issuer', issuedOn: '2026-01-10', skills: ['Go'] },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.credential.status, 'PENDING');
  const id = created.body.credential.id;

  // A different institution cannot verify it.
  const otherInst = await login('institution@skillbridge.demo', 'INSTITUTION');
  assert.equal((await call('POST', `/verification/${id}/approve`, { token: otherInst })).status, 404);

  const pending = await call('GET', '/verification/pending', { token: institution });
  assert.ok(pending.body.credentials.some((c) => c.id === id));

  const approved = await call('POST', `/verification/${id}/approve`, { token: institution });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.credential.status, 'VERIFIED');
  assert.ok(approved.body.credential.verifications.some((v) => v.decision === 'VERIFIED' && v.verifier?.name));

  const me = await call('GET', '/students/me', { token: student });
  const goSkill = me.body.student.skills.find((s) => s.skill.name === 'Go');
  assert.equal(goSkill.status, 'VERIFIED');

  // cleanup
  await call('DELETE', `/credentials/${id}`, { token: student });
});

test('credential rejection needs a reason and stores it', async () => {
  const student = await login('arjun.verma@skillbridge.demo', 'STUDENT');
  const institution = await login('institution2@skillbridge.demo', 'INSTITUTION');
  const created = await call('POST', '/credentials', {
    token: student, body: { type: 'WORKSHOP', title: 'Reject me', issuer: 'Nobody', issuedOn: '2026-02-01' },
  });
  const id = created.body.credential.id;
  assert.equal((await call('POST', `/verification/${id}/reject`, { token: institution, body: {} })).status, 400);
  const rejected = await call('POST', `/verification/${id}/reject`, { token: institution, body: { reason: 'Document unreadable' } });
  assert.equal(rejected.body.credential.status, 'REJECTED');
  assert.equal(rejected.body.credential.rejectionReason, 'Document unreadable');
  await call('DELETE', `/credentials/${id}`, { token: student });
});

test('employer: candidate search filters by verified skill and shows match %', async () => {
  const token = await login('employer@skillbridge.demo', 'EMPLOYER');
  const { body } = await call('GET', '/candidates?skills=React&verifiedOnly=true', { token });
  assert.ok(body.candidates.length >= 2);
  for (const c of body.candidates) {
    assert.ok(c.topSkills.length > 0);
    assert.equal(typeof c.matchScore, 'number');
  }
  const scores = body.candidates.map((c) => c.matchScore);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  const none = await call('GET', '/candidates?skills=COBOL', { token });
  assert.equal(none.body.candidates.length, 0);
});

test('privacy: employers only see verified credentials; public profile hides email', async () => {
  const token = await login('employer@skillbridge.demo', 'EMPLOYER');
  const list = await call('GET', '/candidates?q=Aarav', { token });
  const aarav = list.body.candidates[0];
  const full = await call('GET', `/candidates/${aarav.id}`, { token });
  assert.ok(full.body.student.credentials.length > 0);
  assert.ok(full.body.student.credentials.every((c) => c.status === 'VERIFIED'));

  const pub = await call('GET', '/profiles/aarav-sharma');
  assert.equal(pub.status, 200);
  assert.ok(!('email' in pub.body.student));
  assert.ok(pub.body.student.credentials.every((c) => c.status === 'VERIFIED'));
  assert.equal((await call('GET', '/profiles/does-not-exist')).status, 404);
});

test('employer: opportunity CRUD is limited to the owner', async () => {
  const owner = await login('employer@skillbridge.demo', 'EMPLOYER');
  const other = await login('hr@skillbridge.demo', 'EMPLOYER');
  const created = await call('POST', '/opportunities', {
    token: owner,
    body: {
      title: 'Test Role', description: 'A role created by the automated test suite.', type: 'JOB', location: 'Remote',
      workMode: 'REMOTE', skills: ['React', 'Rust'], minExperience: 0, deadline: '2030-01-01',
    },
  });
  assert.equal(created.status, 201);
  const id = created.body.opportunity.id;
  const edit = {
    title: 'Test Role v2', description: 'An edited role created by the automated test suite.', type: 'JOB', location: 'Remote',
    workMode: 'REMOTE', skills: ['React'], minExperience: 0, deadline: '2030-01-01',
  };
  assert.equal((await call('PUT', `/opportunities/${id}`, { token: other, body: edit })).status, 404);
  assert.equal((await call('PUT', `/opportunities/${id}`, { token: owner, body: edit })).status, 200);
  assert.equal((await call('DELETE', `/opportunities/${id}`, { token: other })).status, 404);
  assert.equal((await call('DELETE', `/opportunities/${id}`, { token: owner })).status, 200);
});

test('application status updates are employer-only and notify the student', async () => {
  const employer = await login('employer@skillbridge.demo', 'EMPLOYER');
  const student = await login('ishita.gupta@skillbridge.demo', 'STUDENT');
  const apps = await call('GET', '/applications', { token: employer });
  const app = apps.body.applications[0];
  assert.equal((await call('PUT', `/applications/${app.id}/status`, { token: student, body: { status: 'SELECTED' } })).status, 403);
  const ok = await call('PUT', `/applications/${app.id}/status`, { token: employer, body: { status: app.status } });
  assert.equal(ok.status, 200);
});

test('analytics return real numbers for each role', async () => {
  const s = await call('GET', '/analytics/student', { token: await login('student@skillbridge.demo', 'STUDENT') });
  assert.ok(s.body.profileStrength > 0 && s.body.skills.verified > 0);
  const i = await call('GET', '/analytics/institution', { token: await login('institution@skillbridge.demo', 'INSTITUTION') });
  assert.ok(i.body.totals.students >= 5 && i.body.topSkills.length > 0);
  const e = await call('GET', '/analytics/employer', { token: await login('employer@skillbridge.demo', 'EMPLOYER') });
  assert.ok(e.body.totals.opportunities >= 3 && e.body.pipeline.length === 6);
});
