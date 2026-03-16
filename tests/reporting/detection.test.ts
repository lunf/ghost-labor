import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSeat, toNumber } from "@/lib/reporting/detection";

test("evaluateSeat flags missing employee", () => {
  const result = evaluateSeat({
    now: new Date("2026-03-16T00:00:00Z"),
    inactivityDays: 90,
    employeeStatus: null,
    lastLoginAt: new Date("2026-03-01T00:00:00Z")
  });

  assert.deepEqual(result, {
    reason: "employee_not_found",
    inactivityDays: null
  });
});

test("evaluateSeat flags inactive employee", () => {
  const result = evaluateSeat({
    now: new Date("2026-03-16T00:00:00Z"),
    inactivityDays: 90,
    employeeStatus: "INACTIVE",
    lastLoginAt: new Date("2026-03-01T00:00:00Z")
  });

  assert.deepEqual(result, {
    reason: "employee_inactive",
    inactivityDays: null
  });
});

test("evaluateSeat flags threshold inactivity", () => {
  const result = evaluateSeat({
    now: new Date("2026-03-16T00:00:00Z"),
    inactivityDays: 30,
    employeeStatus: "ACTIVE",
    lastLoginAt: new Date("2026-01-01T00:00:00Z")
  });

  assert.deepEqual(result, {
    reason: "inactive_for_threshold",
    inactivityDays: 74
  });
});

test("evaluateSeat returns null for recently active user", () => {
  const result = evaluateSeat({
    now: new Date("2026-03-16T00:00:00Z"),
    inactivityDays: 30,
    employeeStatus: "ACTIVE",
    lastLoginAt: new Date("2026-03-10T00:00:00Z")
  });

  assert.equal(result, null);
});

test("toNumber converts numeric input safely", () => {
  assert.equal(toNumber("15.25"), 15.25);
  assert.equal(toNumber(9), 9);
});
