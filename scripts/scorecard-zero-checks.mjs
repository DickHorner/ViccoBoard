const DEFAULT_REPO = 'DickHorner/ViccoBoard';

function fail(message) {
  console.error(`[scorecard-zero-checks] ${message}`);
  process.exit(1);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysUntil(date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function getCheck(scorecard, name) {
  return scorecard.checks.find((check) => check.name === name);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'viccoboard-scorecard-zero-checks'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return response.json();
}

async function main() {
  const repo = process.env.SCORECARD_REPO || DEFAULT_REPO;
  const scorecardRepo = `github.com/${repo}`;

  const scorecardUrl = `https://api.securityscorecards.dev/projects/${scorecardRepo}`;
  const githubRepoUrl = `https://api.github.com/repos/${repo}`;
  const githubContributorsUrl = `https://api.github.com/repos/${repo}/contributors`;

  let scorecard;
  let githubRepo;
  let contributors;

  try {
    [scorecard, githubRepo, contributors] = await Promise.all([
      fetchJson(scorecardUrl),
      fetchJson(githubRepoUrl),
      fetchJson(githubContributorsUrl)
    ]);
  } catch (error) {
    fail(String(error));
  }

  const maintained = getCheck(scorecard, 'Maintained');
  const codeReview = getCheck(scorecard, 'Code-Review');
  const cii = getCheck(scorecard, 'CII-Best-Practices');

  if (!maintained || !codeReview || !cii) {
    fail('could not find one or more target checks in Scorecard response');
  }

  console.log(`Repository: ${repo}`);
  console.log(`Scorecard snapshot: ${scorecard.date}`);
  console.log('');

  console.log(`[Maintained] score=${maintained.score}`);
  console.log(`Reason: ${maintained.reason}`);
  const createdAt = new Date(githubRepo.created_at);
  const maintainedEligibleAt = addDays(createdAt, 90);
  if (maintained.score === 0 && /within the last 90 days/i.test(maintained.reason)) {
    const remainingDays = daysUntil(maintainedEligibleAt);
    if (remainingDays > 0) {
      console.log(
        `Actionability: blocked by project age. Earliest eligibility date: ${formatDate(maintainedEligibleAt)} (${remainingDays} day(s) remaining).`
      );
    } else {
      console.log(
        `Actionability: project age gate should be cleared as of ${formatDate(maintainedEligibleAt)}. Re-run scorecard after next scheduled execution.`
      );
    }
  } else {
    console.log('Actionability: potentially improvable via ongoing commit/issue activity.');
  }
  console.log('');

  const humanContributors = contributors.filter(
    (contributor) => contributor.type === 'User'
  );
  console.log(`[Code-Review] score=${codeReview.score}`);
  console.log(`Reason: ${codeReview.reason}`);
  console.log(
    `Human contributors detected by GitHub API: ${humanContributors.length}`
  );
  if (codeReview.score === 0) {
    console.log(
      'Actionability: requires recent reviewed changesets. Route changes through PRs and obtain approval from a non-author human reviewer.'
    );
    if (humanContributors.length <= 1) {
      console.log(
        'Current blocker: only one human contributor detected; recruit at least one additional human maintainer/reviewer.'
      );
    }
  } else {
    console.log('Actionability: above zero already; continue enforced review flow.');
  }
  console.log('');

  console.log(`[CII-Best-Practices] score=${cii.score}`);
  console.log(`Reason: ${cii.reason}`);
  if (cii.score === 0) {
    console.log(
      'Actionability: manual maintainer action required on https://www.bestpractices.dev (create project + reach in-progress or higher).'
    );
  } else {
    console.log('Actionability: above zero already; continue badge progression.');
  }
}

await main();
