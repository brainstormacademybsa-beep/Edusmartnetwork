export interface ClassGroup {
  category: string;
  classes: string[];
}

export const DEFAULT_SCHOOL_CLASSES: ClassGroup[] = [
  {
    category: 'Early Childhood & Nursery',
    classes: [
      'Creche / Playgroup',
      'Nursery 1',
      'Nursery 2',
      'Nursery 3',
      'Kindergarten 1',
      'Kindergarten 2',
    ],
  },
  {
    category: 'Primary / Basic School',
    classes: [
      'Primary 1',
      'Primary 2',
      'Primary 3',
      'Primary 4',
      'Primary 5',
      'Primary 6',
    ],
  },
  {
    category: 'Junior Secondary School (JSS)',
    classes: [
      'JSS 1',
      'JSS 1A',
      'JSS 1B',
      'JSS 1C',
      'JSS 2',
      'JSS 2A',
      'JSS 2B',
      'JSS 2C',
      'JSS 3',
      'JSS 3A',
      'JSS 3B',
      'JSS 3C',
    ],
  },
  {
    category: 'Senior Secondary School (SSS)',
    classes: [
      'SSS 1 Science',
      'SSS 1 Art',
      'SSS 1 Commercial',
      'SSS 2 Science',
      'SSS 2 Art',
      'SSS 2 Commercial',
      'SSS 3 Science',
      'SSS 3 Art',
      'SSS 3 Commercial',
    ],
  },
];

export const FLAT_CLASS_LIST: string[] = DEFAULT_SCHOOL_CLASSES.flatMap((g) => g.classes);

/**
 * Get all available class names for a school, combining defaults with any custom classes
 * found in existing user profiles, CBT exams, and student result records.
 */
export function getAllSchoolClassNames(existingCustomClasses: string[] = []): string[] {
  const set = new Set<string>([...FLAT_CLASS_LIST]);
  existingCustomClasses.forEach((cls) => {
    if (cls && cls.trim()) {
      set.add(cls.trim());
    }
  });
  return Array.from(set);
}
