import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialRuns,
  initialIncidents,
  services,
  filterRecords,
  recentRuns,
  runStats,
  dailySeries,
  serviceStatus,
  setRecordStatus,
  makeRetry,
  toCsv,
} from "./model.js";
test("environment, status and search combine", () => {
  const result = filterRecords(initialRuns, {
    env: "staging",
    status: "failed",
    query: "DATA",
  });
  assert.ok(result.length);
  assert.ok(
    result.every(
      (r) =>
        r.env === "staging" &&
        r.status === "failed" &&
        r.service === "data-platform",
    ),
  );
});
test("chart totals match the same recent execution population", () => {
  const rows = recentRuns(initialRuns, 7),
    series = dailySeries(rows, 7);
  assert.equal(
    series.reduce((a, d) => a + d.total, 0),
    rows.length,
  );
  assert.deepEqual(dailySeries(initialRuns, 14).slice(-7), series);
  assert.equal(runStats([{ status: "running", duration: 1 }]).rate, null);
});
test("closing incidents updates service health without mutating originals", () => {
  const service = services.find((s) => s.id === "billing-service");
  assert.equal(serviceStatus(service, initialIncidents), "attention");
  const next = setRecordStatus(initialIncidents, "INC-042", "resolved");
  assert.equal(serviceStatus(service, next), "healthy");
  assert.equal(initialIncidents[0].status, "investigating");
});
test("retry preserves environment and gets a unique current-date id", () => {
  const retry = makeRetry(initialRuns, initialRuns[7]);
  assert.equal(retry.env, initialRuns[7].env);
  assert.equal(retry.status, "running");
  assert.equal(retry.date, "2026-10-31");
  assert.ok(retry.id > Math.max(...initialRuns.map((r) => r.id)));
});
test("CSV quotes fields and neutralizes spreadsheet formulas", () => {
  const output = toCsv(
    [{ name: "  =formula", title: 'a,"b"\nc' }],
    ["name", "title"],
  );
  assert.ok(output.includes('"\'  =formula"'));
  assert.ok(output.includes('"a,""b""\nc"'));
});
