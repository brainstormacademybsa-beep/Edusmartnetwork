import { CbtQuestion } from '../types';

/**
 * Parses raw copied text from Word, PDF, WhatsApp, AI generators, etc. into structured CbtQuestion array.
 */
export function parseRawTextQuestions(rawText: string): CbtQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  
  // Split into question blocks: either by double blank lines, or by lines starting with numbers/Q prefix
  // e.g. "1.", "1)", "Q1.", "Question 1:", etc.
  const blocks: string[] = [];
  const lines = normalizedText.split('\n');
  let currentBlock: string[] = [];

  const questionHeaderRegex = /^(?:\d+[\.\)]|\bQ(?:uestion)?\s*\d+[\.\:\)]?)\s+/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentBlock.length > 0) {
        // Look ahead: if next non-empty line starts with Option B/C/D, don't break block
        let isInsideQuestion = false;
        for (let j = i + 1; j < lines.length && j < i + 3; j++) {
          if (/^[A-Da-d][\.\)]\s+/.test(lines[j].trim())) {
            isInsideQuestion = true;
            break;
          }
        }
        if (!isInsideQuestion) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      }
      continue;
    }

    if (currentBlock.length > 0 && questionHeaderRegex.test(line)) {
      // New question starts
      blocks.push(currentBlock.join('\n'));
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  const parsedQuestions: CbtQuestion[] = [];

  blocks.forEach((block, idx) => {
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length === 0) return;

    let questionText = '';
    let optionA = '';
    let optionB = '';
    let optionC = '';
    let optionD = '';
    let correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
    let explanation = '';

    const optionARegex = /^(?:[Aa][\.\)]|\([Aa]\)|\[[Aa]\])\s*(.*)/;
    const optionBRegex = /^(?:[Bb][\.\)]|\([Bb]\)|\[[Bb]\])\s*(.*)/;
    const optionCRegex = /^(?:[Cc][\.\)]|\([Cc]\)|\[[Cc]\])\s*(.*)/;
    const optionDRegex = /^(?:[Dd][\.\)]|\([Dd]\)|\[[Dd]\])\s*(.*)/;
    const answerKeyRegex = /^(?:Ans(?:wer)?|Correct(?: Answer)?|Key|Solution)[\s\:\-\=]+([A-Da-d])/i;
    const explanationRegex = /^(?:Explanation|Note|Reason|Solution Note)[\s\:\-\=]+(.*)/i;

    const qLines: string[] = [];

    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];

      // Check for Answer key line
      const ansMatch = line.match(answerKeyRegex);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        continue;
      }

      // Check for Explanation line
      const expMatch = line.match(explanationRegex);
      if (expMatch) {
        explanation = expMatch[1];
        // Collect remaining lines as explanation if any
        for (let j = i + 1; j < blockLines.length; j++) {
          if (!blockLines[j].match(questionHeaderRegex) && !blockLines[j].match(optionARegex)) {
            explanation += ' ' + blockLines[j];
          }
        }
        break;
      }

      // Check for Options
      const matchA = line.match(optionARegex);
      if (matchA) {
        optionA = matchA[1].replace(/\s*\([Cc]orrect\)$/i, '').replace(/\*$/g, '');
        if (line.toLowerCase().includes('(correct)') || line.includes('*')) correctAnswer = 'A';
        continue;
      }

      const matchB = line.match(optionBRegex);
      if (matchB) {
        optionB = matchB[1].replace(/\s*\([Cc]orrect\)$/i, '').replace(/\*$/g, '');
        if (line.toLowerCase().includes('(correct)') || line.includes('*')) correctAnswer = 'B';
        continue;
      }

      const matchC = line.match(optionCRegex);
      if (matchC) {
        optionC = matchC[1].replace(/\s*\([Cc]orrect\)$/i, '').replace(/\*$/g, '');
        if (line.toLowerCase().includes('(correct)') || line.includes('*')) correctAnswer = 'C';
        continue;
      }

      const matchD = line.match(optionDRegex);
      if (matchD) {
        optionD = matchD[1].replace(/\s*\([Cc]orrect\)$/i, '').replace(/\*$/g, '');
        if (line.toLowerCase().includes('(correct)') || line.includes('*')) correctAnswer = 'D';
        continue;
      }

      // Otherwise line belongs to question text
      qLines.push(line);
    }

    // Clean up question text header numbering (e.g., "1. ", "Q2: ", "Question 3) ")
    let fullQText = qLines.join(' ');
    fullQText = fullQText.replace(/^(?:\d+[\.\)]|\bQ(?:uestion)?\s*\d+[\.\:\)]?)\s*/i, '').trim();

    if (fullQText) {
      parsedQuestions.push({
        id: `q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
        questionText: fullQText,
        optionA: optionA || 'Option A',
        optionB: optionB || 'Option B',
        optionC: optionC || 'Option C',
        optionD: optionD || 'Option D',
        correctAnswer,
        points: 10,
        explanation,
      });
    }
  });

  return parsedQuestions;
}
