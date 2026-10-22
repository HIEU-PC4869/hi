import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCheckInTiming, calculateAttendancePercentage, checkEarlyWarningFlag } from './rules.ts';

test('check-in timing: less than 15 mins yields Present', () => {
  const start = new Date(2025, 3, 18, 10, 0, 0);
  const checkIn = new Date(2025, 3, 18, 10, 8, 0); // 8 mins later
  const res = evaluateCheckInTiming(start, checkIn, '849-210', '849210');
  assert.equal(res.success, true);
  assert.equal(res.status, 'Present');
});

test('check-in timing: between 15 and 45 mins yields Late', () => {
  const start = new Date(2025, 3, 18, 10, 0, 0);
  const checkIn = new Date(2025, 3, 18, 10, 22, 0); // 22 mins later
  const res = evaluateCheckInTiming(start, checkIn, '849-210', '849 210');
  assert.equal(res.success, true);
  assert.equal(res.status, 'Late');
});

test('check-in timing: over 45 mins marks expired', () => {
  const start = new Date(2025, 3, 18, 10, 0, 0);
  const checkIn = new Date(2025, 3, 18, 10, 50, 0); // 50 mins later
  const res = evaluateCheckInTiming(start, checkIn, '849-210', '849210');
  assert.equal(res.success, false);
  assert.equal(res.status, 'Absent');
});

test('check-in timing: incorrect pin rejected', () => {
  const start = new Date(2025, 3, 18, 10, 0, 0);
  const checkIn = new Date(2025, 3, 18, 10, 5, 0);
  const res = evaluateCheckInTiming(start, checkIn, '849-210', '000000');
  assert.equal(res.success, false);
});

test('attendance percentage calculation and thresholds', () => {
  // CS-301: 25 present, 2 late, 1 absent, 0 excused -> (25 + 1.6)/28 = 26.6/28 = 95% -> Good Standing
  const res1 = calculateAttendancePercentage(25, 2, 1, 0);
  assert.equal(res1.percentage, 95);
  assert.equal(res1.compliance, 'Good Standing');

  // PHY-102: 19 present, 2 late, 4 absent, 1 excused -> (19 + 1.6)/26 = 20.6/26 = 79.2% -> <80% Warning Threshold
  const res2 = calculateAttendancePercentage(19, 2, 4, 1);
  assert.equal(res2.percentage, 79.2);
  assert.equal(res2.compliance, '<80% Warning Threshold');
});

test('early warning system flag logic', () => {
  // < 80% or >= 3 consecutive absences
  const david = checkEarlyWarningFlag(68.5, 4);
  assert.equal(david.isFlagged, true);
  assert.equal(david.riskLevel, 'CRITICAL');

  const sarah = checkEarlyWarningFlag(84.0, 3);
  assert.equal(sarah.isFlagged, true);
  assert.equal(sarah.riskLevel, 'HIGH');

  const compliant = checkEarlyWarningFlag(92.0, 0);
  assert.equal(compliant.isFlagged, false);
  assert.equal(compliant.riskLevel, 'NORMAL');
});
