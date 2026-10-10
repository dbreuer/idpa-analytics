import { pathToFileURL } from "node:url";

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function deploymentsForCommit(payload, commitSha) {
  if (!Array.isArray(payload?.deployments)) {
    throw new Error("Vercel deployment status response has no deployment list.");
  }
  return payload.deployments.filter((deployment) => {
    const deploySha = deployment.meta?.githubCommitSha
      ?? deployment.gitSource?.sha
      ?? deployment.sha;
    return deploySha === commitSha && deployment.target === "production";
  });
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required GitHub Actions secret/variable ${name} is not configured.`);
  return value;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Vercel API request failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function listCommitDeployments({ token, projectId, teamId, commitSha }) {
  const url = new URL("https://api.vercel.com/v7/deployments");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("target", "production");
  url.searchParams.set("sha", commitSha);
  url.searchParams.set("limit", "10");
  if (teamId) url.searchParams.set("teamId", teamId);
  const payload = await requestJson(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  return deploymentsForCommit(payload, commitSha);
}

async function triggerDeployHook(hookUrl) {
  const response = await fetch(hookUrl, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Vercel Deploy Hook rejected the deployment request with HTTP ${response.status}.`);
  }
}

function readyState(deployment) {
  return deployment.readyState ?? deployment.state;
}

async function verifyPublishedPage(publicSiteUrl, year) {
  const site = new URL(publicSiteUrl);
  if (
    site.protocol !== "https:"
    || site.hostname !== "statisztika.lovesznaplo.hu"
    || site.pathname !== "/"
    || site.search
    || site.hash
  ) {
    throw new Error("PUBLIC_SITE_URL must be the HTTPS origin https://statisztika.lovesznaplo.hu.");
  }
  const url = new URL(`/idpa/${year}`, site);
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
  if (response.status !== 200) {
    throw new Error(`Published season smoke test returned HTTP ${response.status}.`);
  }
  const html = await response.text();
  if (!html.includes(`href="${url.toString()}"`) || !html.includes(`${year}. évi szezon`)) {
    throw new Error("Published season smoke test did not find the expected canonical URL and season content.");
  }
}

async function main() {
  const hookUrl = requiredEnvironment("VERCEL_DEPLOY_HOOK_URL");
  const token = requiredEnvironment("VERCEL_TOKEN");
  const projectId = requiredEnvironment("VERCEL_PROJECT_ID");
  const publicSiteUrl = requiredEnvironment("PUBLIC_SITE_URL");
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const commitSha = requiredEnvironment("PUBLISHED_COMMIT_SHA");
  const yearText = requiredEnvironment("SEASON_YEAR");
  if (!/^[1-9]\d{3}$/.test(yearText)) throw new Error("SEASON_YEAR must be a four-digit year.");
  const year = Number(yearText);
  const timeoutAt = Date.now() + 25 * 60_000;
  let hookTriggered = false;
  let deployment;

  while (Date.now() < timeoutAt) {
    const matches = await listCommitDeployments({ token, projectId, teamId, commitSha });
    deployment = matches.sort((a, b) => Number(b.createdAt ?? b.created ?? 0) - Number(a.createdAt ?? a.created ?? 0))[0];
    if (deployment) {
      const state = readyState(deployment);
      if (state === "READY") {
        await verifyPublishedPage(publicSiteUrl, year);
        console.log(`Production deployment ${deployment.uid} is READY; canonical season ${year} passed its smoke test.`);
        return;
      }
      if (["ERROR", "CANCELED", "BLOCKED"].includes(state)) {
        throw new Error(`Vercel production deployment for ${commitSha.slice(0, 8)} ended in state ${state}.`);
      }
    } else if (!hookTriggered) {
      const waitForGitDeploymentUntil = Date.now() + 120_000;
      while (Date.now() < waitForGitDeploymentUntil) {
        await sleep(15_000);
        const candidates = await listCommitDeployments({ token, projectId, teamId, commitSha });
        deployment = candidates[0];
        if (deployment) break;
      }
      if (!deployment) {
        await triggerDeployHook(hookUrl);
        hookTriggered = true;
        console.log("No Git-triggered production deployment was found; requested one through the Vercel Deploy Hook.");
      }
    }
    await sleep(15_000);
  }

  throw new Error(`No READY Vercel production deployment for ${commitSha.slice(0, 8)} became available before timeout.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Vercel deployment verification failed.");
    process.exitCode = 1;
  });
}
