import type { Category } from './types';

export const MAX_PDF_MB = Number(import.meta.env.VITE_MAX_PDF_MB) > 0 ? Number(import.meta.env.VITE_MAX_PDF_MB) : 20;
export const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;
export const PAGE_SIZE = 12;

export interface CategoryMeta {
  value: Category;
  label: string;
  plural: string;
  hint: string;
  emptyText: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'reference_book', label: 'Reference Book', plural: 'Reference Books', hint: 'Textbooks and reference material for this subject.', emptyText: 'No reference books have been added for this subject yet.' },
  { value: 'study_material', label: 'Study Material', plural: 'Study Materials', hint: 'Lecture notes, handouts, practical and laboratory documents.', emptyText: 'No study materials have been added for this subject yet.' },
  { value: 'suggestion', label: 'Suggestion', plural: 'Suggestions', hint: 'Examination suggestions.', emptyText: 'No suggestions have been added for this subject yet.' },
  { value: 'assignment', label: 'Assignment', plural: 'Assignments', hint: 'Assignments given for this subject.', emptyText: 'No assignments have been added for this subject yet.' },
  { value: 'other', label: 'Other Document', plural: 'Other Documents', hint: 'Miscellaneous academic documents.', emptyText: 'No other documents have been added for this subject yet.' },
];

export function categoryMeta(value: string): CategoryMeta {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[4];
}
