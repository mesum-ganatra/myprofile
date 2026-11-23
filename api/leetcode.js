// Vercel serverless function: GET /api/leetcode
// Reads the public LeetCode profile and returns solved counts, the activity
// calendar and recent accepted submissions. Cached at the edge for 10 minutes.
const USERNAME = 'EBKXsMPuAm';

const QUERY = `query u($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking realName }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    submissionCalendar
  }
  recentAcSubmissionList(username: $username, limit: 10) { title titleSlug timestamp }
}`;

module.exports = async function handler(req, res) {
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } }),
    });
    if (!r.ok) throw new Error('LeetCode responded ' + r.status);
    const { data } = await r.json();
    const u = data && data.matchedUser;
    if (!u) throw new Error('Profile not found or private');

    const count = (d) => {
      const row = u.submitStatsGlobal.acSubmissionNum.find((x) => x.difficulty === d);
      return row ? row.count : 0;
    };
    let calendar = {};
    try { calendar = JSON.parse(u.submissionCalendar || '{}'); } catch (e) { /* ignore */ }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json({
      username: u.username,
      url: 'https://leetcode.com/u/' + u.username + '/',
      ranking: u.profile && u.profile.ranking,
      solved: { all: count('All'), easy: count('Easy'), medium: count('Medium'), hard: count('Hard') },
      calendar,
      recent: (data.recentAcSubmissionList || []).map((s) => ({
        title: s.title,
        url: 'https://leetcode.com/problems/' + s.titleSlug + '/',
        timestamp: Number(s.timestamp),
      })),
    });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(502).json({ error: e.message });
  }
};
