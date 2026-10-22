/**
 * Pure calculation logic matching logic.py for unit testing and front-end accuracy.
 */

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';

export interface CheckInResult {
  success: boolean;
  status: AttendanceStatus;
  message: string;
}

export function evaluateCheckInTiming(
  sessionStartTime: Date,
  checkInTime: Date,
  sessionCode: string,
  enteredCode: string
): CheckInResult {
  const cleanSession = sessionCode.replace(/[-\s]/g, '').toLowerCase();
  const cleanEntered = enteredCode.replace(/[-\s]/g, '').toLowerCase();

  if (!cleanEntered) {
    return {
      success: false,
      status: 'Absent',
      message: 'PIN or QR token cannot be empty.'
    };
  }

  if (cleanSession !== cleanEntered) {
    return {
      success: false,
      status: 'Absent',
      message: 'Invalid PIN or QR token.'
    };
  }

  const elapsedMinutes = Math.max(0, (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));

  if (elapsedMinutes < 15.0) {
    return {
      success: true,
      status: 'Present',
      message: `Verified: Present (${elapsedMinutes.toFixed(1)}m elapsed).`
    };
  } else if (elapsedMinutes <= 45.0) {
    return {
      success: true,
      status: 'Late',
      message: `Verified: Late (+${Math.floor(elapsedMinutes)}m arrival).`
    };
  } else {
    return {
      success: false,
      status: 'Absent',
      message: 'Session verification window closed (>45m elapsed).'
    };
  }
}

export function calculateAttendancePercentage(
  present: number,
  late: number,
  absent: number,
  excused: number
): { percentage: number; compliance: 'Good Standing' | 'Notice' | '<80% Warning Threshold' } {
  const total = present + late + absent + excused;
  if (total === 0) {
    return { percentage: 100.0, compliance: 'Good Standing' };
  }
  // Formula: (Present + Late * 0.8) / Total * 100
  const percentage = Math.round(((present + late * 0.8) / total) * 1000) / 10;
  let compliance: 'Good Standing' | 'Notice' | '<80% Warning Threshold' = 'Good Standing';
  if (percentage < 80.0) {
    compliance = '<80% Warning Threshold';
  } else if (percentage < 90.0) {
    compliance = 'Notice';
  }
  return { percentage, compliance };
}

export function checkEarlyWarningFlag(
  overallRate: number,
  consecutiveAbsences: number
): { isFlagged: boolean; riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' } {
  const isFlagged = overallRate < 80.0 || consecutiveAbsences >= 3;
  if (!isFlagged) {
    return { isFlagged: false, riskLevel: 'NORMAL' };
  }
  if (overallRate < 70.0 || consecutiveAbsences >= 4) {
    return { isFlagged: true, riskLevel: 'CRITICAL' };
  }
  if (overallRate < 75.0 || consecutiveAbsences >= 3) {
    return { isFlagged: true, riskLevel: 'HIGH' };
  }
  return { isFlagged: true, riskLevel: 'MODERATE' };
}
