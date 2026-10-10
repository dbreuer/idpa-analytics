import assert from "node:assert/strict";
import test from "node:test";

import { deploymentsForCommit } from "../scripts/trigger-vercel-deploy.mjs";

test("production publishing reuses the deployment for the exact refreshed commit", () => {
  const commitSha = "a".repeat(40);
  const deployments = deploymentsForCommit({
    deployments: [
      { uid: "preview-match", target: "preview", sha: commitSha },
      { uid: "old-production", target: "production", sha: "b".repeat(40) },
      { uid: "production-match", target: "production", meta: { githubCommitSha: commitSha } },
    ],
  }, commitSha);
  assert.deepEqual(deployments.map((deployment) => deployment.uid), ["production-match"]);
});

test("deployment verification rejects malformed Vercel status responses", () => {
  assert.throws(() => deploymentsForCommit({}, "a".repeat(40)), /no deployment list/);
});
