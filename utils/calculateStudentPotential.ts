// Student potential calculation utility
// Ball: Perfect=5, Better=4, Good=3, Bad=2, Worse=1
// Overdue: -1 ball

export type Status = 'Worse' | 'Bad' | 'Good' | 'Better' | 'Perfect';

export interface StudentTask {
  status: Status;
  isOverdue: boolean;
}

export interface StudentPotentialResult {
  percent: number; // 0-100
  label: Status;
  delta: number; // % change
  status: Status;
}

const statusBall: Record<Status, number> = {
  Worse: 1,
  Bad: 2,
  Good: 3,
  Better: 4,
  Perfect: 5,
};

const statusThresholds: Array<{ min: number; label: Status }> = [
  { min: 4.5, label: 'Perfect' },
  { min: 3.5, label: 'Better' },
  { min: 2.5, label: 'Good' },
  { min: 1.5, label: 'Bad' },
  { min: 0, label: 'Worse' },
];

export function calculateStudentPotential(tasks: StudentTask[], prevPercent?: number): StudentPotentialResult {
  if (!tasks.length) {
    return { percent: 0, label: 'Worse', delta: 0, status: 'Worse' };
  }
  let total = 0;
  for (const t of tasks) {
    let ball = statusBall[t.status];
    if (t.isOverdue) ball -= 1;
    total += Math.max(0, ball);
  }
  const avg = total / tasks.length;
  const percent = Math.round((avg / 5) * 100);
  const label = statusThresholds.find(th => avg >= th.min)!.label;
  const delta = prevPercent !== undefined ? percent - prevPercent : 0;
  return { percent, label, delta, status: label };
}
