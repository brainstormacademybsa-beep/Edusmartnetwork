import { StudentResult } from '../types';

export function calculateGrade(total: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; remark: string } {
  if (total >= 75) return { grade: 'A', remark: 'Excellent' };
  if (total >= 65) return { grade: 'B', remark: 'Very Good' };
  if (total >= 50) return { grade: 'C', remark: 'Good' };
  if (total >= 40) return { grade: 'D', remark: 'Fair' };
  return { grade: 'F', remark: 'Needs Improvement' };
}

export function calculateTotalAndGrade(ca: number, exam: number) {
  const safeCa = Math.min(40, Math.max(0, ca || 0));
  const safeExam = Math.min(60, Math.max(0, exam || 0));
  const total = safeCa + safeExam;
  const { grade, remark } = calculateGrade(total);
  return {
    ca: safeCa,
    exam: safeExam,
    total,
    grade,
    remark,
  };
}

export function calculatePositions(results: StudentResult[]): StudentResult[] {
  // Group results by (className + term + session + subject)
  const groups: Record<string, StudentResult[]> = {};

  results.forEach((r) => {
    const key = `${r.className}_${r.term}_${r.session}_${r.subject}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...r });
  });

  const updatedResults: StudentResult[] = [];

  Object.values(groups).forEach((group) => {
    // Sort descending by total score
    group.sort((a, b) => b.total - a.total);

    let rank = 1;
    for (let i = 0; i < group.length; i++) {
      if (i > 0 && group[i].total < group[i - 1].total) {
        rank = i + 1;
      }
      group[i].position = rank;
      updatedResults.push(group[i]);
    }
  });

  return updatedResults;
}

export function generatePinCode(): string {
  const segment1 = Math.floor(1000 + Math.random() * 9000);
  const segment2 = Math.floor(1000 + Math.random() * 9000);
  const segment3 = Math.floor(1000 + Math.random() * 9000);
  return `${segment1}-${segment2}-${segment3}`;
}

export function generateReceiptNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${year}-${rand}`;
}

export function generateApplicationRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${year}-${rand}`;
}

export function generateStudentRegNo(schoolName: string, count: number): string {
  const year = new Date().getFullYear();
  const initials = schoolName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3) || 'EDU';
  const numStr = String(count).padStart(3, '0');
  return `${initials}/${year}/${numStr}`;
}
