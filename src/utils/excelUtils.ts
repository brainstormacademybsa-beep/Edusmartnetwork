import * as XLSX from 'xlsx';
import { calculateTotalAndGrade } from './calcUtils';

export interface ParsedExcelResult {
  studentRegNo: string;
  studentName: string;
  ca: number;
  exam: number;
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  remark: string;
  isValid: boolean;
  error?: string;
}

export function downloadResultTemplate(className: string, subject: string, students: { regNo: string; name: string }[]) {
  const rows = students.map((s) => ({
    'Student RegNo': s.regNo,
    'Student Name': s.name,
    'CA Score (0-40)': 28,
    'Exam Score (0-60)': 45,
  }));

  if (rows.length === 0) {
    // Dummy template if no students
    rows.push({
      'Student RegNo': 'CRA/2026/001',
      'Student Name': 'Sample Student',
      'CA Score (0-40)': 28,
      'Exam Score (0-60)': 45,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results Template');

  // Auto-width for columns
  const max_width = rows.reduce((w, r) => Math.max(w, (r['Student Name'] || '').length), 12);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: Math.max(25, max_width) },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.writeFile(workbook, `Result_Upload_${className.replace(/\s+/g, '_')}_${subject.replace(/\s+/g, '_')}.xlsx`);
}

export async function parseResultExcel(file: File): Promise<ParsedExcelResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsed: ParsedExcelResult[] = rawJson.map((row) => {
          const regNo = String(row['Student RegNo'] || row['RegNo'] || row['Registration Number'] || '').trim();
          const name = String(row['Student Name'] || row['Name'] || '').trim();

          const caRaw = parseFloat(row['CA Score (0-40)'] || row['CA'] || '0');
          const examRaw = parseFloat(row['Exam Score (0-60)'] || row['Exam'] || '0');

          let isValid = true;
          let error = '';

          if (!regNo) {
            isValid = false;
            error = 'Missing Student RegNo';
          } else if (isNaN(caRaw) || caRaw < 0 || caRaw > 40) {
            isValid = false;
            error = 'CA score must be between 0 and 40';
          } else if (isNaN(examRaw) || examRaw < 0 || examRaw > 60) {
            isValid = false;
            error = 'Exam score must be between 0 and 60';
          }

          const calcResult = calculateTotalAndGrade(caRaw, examRaw);

          return {
            studentRegNo: regNo,
            studentName: name || 'Student',
            ca: calcResult.ca,
            exam: calcResult.exam,
            total: calcResult.total,
            grade: calcResult.grade,
            remark: calcResult.remark,
            isValid,
            error,
          };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadCbtQuestionTemplate() {
  const rows = [
    {
      'Question Text': 'What is the capital of Nigeria?',
      'Option A': 'Lagos',
      'Option B': 'Abuja',
      'Option C': 'Kano',
      'Option D': 'Port Harcourt',
      'Correct Answer (A/B/C/D)': 'B',
      'Points (1-100)': 10,
      'Explanation (Optional)': 'Abuja became the capital city of Nigeria in 1991.',
    },
    {
      'Question Text': 'How many colors are in a rainbow?',
      'Option A': '5',
      'Option B': '6',
      'Option C': '7',
      'Option D': '8',
      'Correct Answer (A/B/C/D)': 'C',
      'Points (1-100)': 10,
      'Explanation (Optional)': 'The seven colors are Red, Orange, Yellow, Green, Blue, Indigo, and Violet.',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CBT Questions');

  worksheet['!cols'] = [
    { wch: 50 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 50 },
  ];

  XLSX.writeFile(workbook, 'CBT_Questions_Template.xlsx');
}

import { CbtQuestion } from '../types';

export async function parseCbtQuestionsExcel(file: File): Promise<CbtQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const questions: CbtQuestion[] = rawJson.map((row, idx) => {
          const text = String(row['Question Text'] || '').trim();
          const a = String(row['Option A'] || '').trim();
          const b = String(row['Option B'] || '').trim();
          const c = String(row['Option C'] || '').trim();
          const d = String(row['Option D'] || '').trim();
          let ans = String(row['Correct Answer (A/B/C/D)'] || 'A').toUpperCase().trim();
          if (!['A', 'B', 'C', 'D'].includes(ans)) ans = 'A';

          const points = parseInt(row['Points (1-100)'] || '10') || 10;
          const exp = String(row['Explanation (Optional)'] || '').trim();

          return {
            id: `q-bulk-${Date.now()}-${idx}`,
            questionText: text,
            optionA: a,
            optionB: b,
            optionC: c,
            optionD: d,
            correctAnswer: ans as 'A' | 'B' | 'C' | 'D',
            points,
            explanation: exp,
          };
        });

        resolve(questions.filter((q) => q.questionText));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportFeeReportToExcel(payments: any[], schoolName: string) {
  const rows = payments.map((p) => ({
    'Receipt No': p.receiptNo,
    'Student RegNo': p.studentRegNo,
    'Student Name': p.studentName,
    Class: p.className,
    Term: p.term,
    Session: p.session,
    'Amount Paid ($)': p.amountPaid,
    'Total Expected ($)': p.totalExpected,
    'Balance Owing ($)': p.balanceRemaining,
    Status: p.status,
    'Payment Method': p.paymentMethod,
    Date: p.paymentDate,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Report');

  XLSX.writeFile(workbook, `${schoolName.replace(/\s+/g, '_')}_Fee_Report.xlsx`);
}
