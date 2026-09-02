import * as XLSX from 'xlsx';
import { calculateTotalAndGrade } from './calcUtils';
import { CbtQuestion } from '../types';

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

/**
 * Universal safe browser file downloader:
 * Works seamlessly on iOS Safari, Android Chrome, desktop browsers, and iframes.
 */
export function saveDownloadBlob(blob: Blob, filename: string): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // 1. Primary standard method: Blob URL with DOM-attached anchor
    if (window.URL && typeof window.URL.createObjectURL === 'function') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(link);
      
      // Dispatch click event
      link.click();

      // Clean up after slight delay to ensure mobile webkit captures download
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Download cleanup warning:', e);
        }
      }, 4000);

      return true;
    }
  } catch (err) {
    console.warn('URL.createObjectURL failed, falling back to data URL:', err);
  }

  // 2. Secondary fallback method: FileReader Data URL
  try {
    const reader = new FileReader();
    reader.onload = function (e) {
      const link = document.createElement('a');
      link.href = e.target?.result as string;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 4000);
    };
    reader.readAsDataURL(blob);
    return true;
  } catch (err2) {
    console.error('Data URL fallback failed:', err2);
    return false;
  }
}

/**
 * Exports a SheetJS workbook as an .xlsx file using the safe download pipeline
 */
export function exportWorkbook(workbook: XLSX.WorkBook, filename: string) {
  const safeFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    // Generate binary Excel array
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    const dispatched = saveDownloadBlob(blob, safeFilename);
    if (!dispatched) {
      XLSX.writeFile(workbook, safeFilename);
    }
  } catch (err) {
    console.warn('Custom XLSX blob write failed, falling back to XLSX.writeFile:', err);
    try {
      XLSX.writeFile(workbook, safeFilename);
    } catch (finalErr) {
      console.error('XLSX.writeFile fallback error:', finalErr);
    }
  }
}

/**
 * Exports data as a CSV file using UTF-8 BOM for full Excel / Google Sheets compatibility
 */
export function downloadCsvFile(csvContent: string, filename: string) {
  const safeFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveDownloadBlob(blob, safeFilename);
}

// =========================================================================
// CBT QUESTION TEMPLATE DOWNLOADS
// =========================================================================

export const SAMPLE_CBT_QUESTIONS_ROWS = [
  {
    'Question Text': 'What is the capital of Nigeria?',
    'Option A': 'Lagos',
    'Option B': 'Abuja',
    'Option C': 'Kano',
    'Option D': 'Port Harcourt',
    'Correct Answer (A/B/C/D)': 'B',
    'Points (1-100)': 10,
    'Explanation (Optional)': 'Abuja became the official federal capital territory in 1991.',
  },
  {
    'Question Text': 'How many colors are in a standard rainbow?',
    'Option A': '5',
    'Option B': '6',
    'Option C': '7',
    'Option D': '8',
    'Correct Answer (A/B/C/D)': 'C',
    'Points (1-100)': 10,
    'Explanation (Optional)': 'The seven colors are Red, Orange, Yellow, Green, Blue, Indigo, and Violet.',
  },
  {
    'Question Text': 'Which organ pumps blood throughout the human body?',
    'Option A': 'Heart',
    'Option B': 'Lungs',
    'Option C': 'Liver',
    'Option D': 'Brain',
    'Correct Answer (A/B/C/D)': 'A',
    'Points (1-100)': 10,
    'Explanation (Optional)': 'The heart is the primary muscular organ in the circulatory system.',
  },
  {
    'Question Text': 'What is the value of 15 x 4?',
    'Option A': '45',
    'Option B': '50',
    'Option C': '60',
    'Option D': '75',
    'Correct Answer (A/B/C/D)': 'C',
    'Points (1-100)': 10,
    'Explanation (Optional)': '15 multiplied by 4 equals 60.',
  },
];

/**
 * Downloads the CBT questions template in .xlsx format
 */
export function downloadCbtQuestionTemplate(filename = 'CBT_Questions_Template.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_CBT_QUESTIONS_ROWS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CBT Questions');

  worksheet['!cols'] = [
    { wch: 45 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 45 },
  ];

  exportWorkbook(workbook, filename);
}

/**
 * Downloads the CBT questions template in .csv format for mobile spreadsheet compatibility
 */
export function downloadCbtQuestionCsvTemplate(filename = 'CBT_Questions_Template.csv') {
  const headers = [
    'Question Text',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer (A/B/C/D)',
    'Points (1-100)',
    'Explanation (Optional)',
  ];

  const escapeCsv = (str: any) => {
    const val = String(str ?? '');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvRows = [
    headers.join(','),
    ...SAMPLE_CBT_QUESTIONS_ROWS.map((row) =>
      [
        escapeCsv(row['Question Text']),
        escapeCsv(row['Option A']),
        escapeCsv(row['Option B']),
        escapeCsv(row['Option C']),
        escapeCsv(row['Option D']),
        escapeCsv(row['Correct Answer (A/B/C/D)']),
        escapeCsv(row['Points (1-100)']),
        escapeCsv(row['Explanation (Optional)']),
      ].join(',')
    ),
  ];

  downloadCsvFile(csvRows.join('\r\n'), filename);
}

// =========================================================================
// CBT QUESTIONS EXCEL / CSV PARSER
// =========================================================================

export async function parseCbtQuestionsExcel(file: File): Promise<CbtQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const questions: CbtQuestion[] = [];

        rawJson.forEach((row, idx) => {
          // Normalize keys to find questions & options even if casing/spacing varies
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
                return String(row[k]).trim();
              }
            }
            // Case-insensitive fallback
            const lowerKeys = keys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
            for (const [actualKey, val] of Object.entries(row)) {
              const cleanActualKey = actualKey.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (lowerKeys.includes(cleanActualKey) && val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
            return '';
          };

          const text = getVal('Question Text', 'Question', 'Questions', 'question_text', 'question', 'item', 'problem');
          const a = getVal('Option A', 'OptionA', 'A', 'Option 1', 'Choice A', 'opt_a');
          const b = getVal('Option B', 'OptionB', 'B', 'Option 2', 'Choice B', 'opt_b');
          const c = getVal('Option C', 'OptionC', 'C', 'Option 3', 'Choice C', 'opt_c');
          const d = getVal('Option D', 'OptionD', 'D', 'Option 4', 'Choice D', 'opt_d');

          let ansRaw = getVal('Correct Answer (A/B/C/D)', 'Correct Answer', 'CorrectAnswer', 'Correct', 'Answer', 'Ans', 'Key').toUpperCase();
          let ans: 'A' | 'B' | 'C' | 'D' = 'A';
          if (ansRaw.includes('B') || ansRaw === '2') ans = 'B';
          else if (ansRaw.includes('C') || ansRaw === '3') ans = 'C';
          else if (ansRaw.includes('D') || ansRaw === '4') ans = 'D';
          else ans = 'A';

          const pointsRaw = getVal('Points (1-100)', 'Points', 'Point', 'Score', 'Marks', 'Mark', 'points');
          const points = parseInt(pointsRaw) || 10;
          const exp = getVal('Explanation (Optional)', 'Explanation', 'Explain', 'Note', 'Reason', 'Remarks', 'explanation');

          if (text) {
            questions.push({
              id: `q-bulk-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
              questionText: text,
              optionA: a || 'Option A',
              optionB: b || 'Option B',
              optionC: c || 'Option C',
              optionD: d || 'Option D',
              correctAnswer: ans,
              points: Math.max(1, Math.min(100, points)),
              explanation: exp,
            });
          }
        });

        resolve(questions);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// =========================================================================
// RESULTS TEMPLATE DOWNLOAD & PARSER
// =========================================================================

export function downloadResultTemplate(
  className: string,
  subject: string,
  students: { regNo: string; name: string }[]
) {
  const rows = students.map((s) => ({
    'Student RegNo': s.regNo,
    'Student Name': s.name,
    'CA Score (0-40)': 28,
    'Exam Score (0-60)': 45,
  }));

  if (rows.length === 0) {
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

  const max_width = rows.reduce((w, r) => Math.max(w, (r['Student Name'] || '').length), 12);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: Math.max(25, max_width) },
    { wch: 18 },
    { wch: 18 },
  ];

  const filename = `Result_Upload_${className.replace(/\s+/g, '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
  exportWorkbook(workbook, filename);
}

export async function parseResultExcel(file: File): Promise<ParsedExcelResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed: ParsedExcelResult[] = rawJson.map((row) => {
          const regNo = String(
            row['Student RegNo'] || row['RegNo'] || row['Registration Number'] || row['ID'] || ''
          ).trim();
          const name = String(row['Student Name'] || row['Name'] || '').trim();

          const caRaw = parseFloat(row['CA Score (0-40)'] || row['CA'] || row['CA Score'] || '0');
          const examRaw = parseFloat(row['Exam Score (0-60)'] || row['Exam'] || row['Exam Score'] || '0');

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

          const calcResult = calculateTotalAndGrade(isNaN(caRaw) ? 0 : caRaw, isNaN(examRaw) ? 0 : examRaw);

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

// =========================================================================
// FEE REPORT EXCEL EXPORTER
// =========================================================================

export function exportFeeReportToExcel(payments: any[], schoolName: string) {
  const rows = payments.map((p) => ({
    'Receipt No': p.receiptNo,
    'Student RegNo': p.studentRegNo,
    'Student Name': p.studentName,
    Class: p.className,
    Term: p.term,
    Session: p.session,
    'Amount Paid': p.amountPaid,
    'Total Expected': p.totalExpected,
    'Balance Owing': p.balanceRemaining,
    Status: p.status,
    'Payment Method': p.paymentMethod,
    Date: p.paymentDate,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Report');

  const filename = `${schoolName.replace(/\s+/g, '_')}_Fee_Report.xlsx`;
  exportWorkbook(workbook, filename);
}
