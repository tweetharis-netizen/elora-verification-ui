import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names using clsx and tailwind-merge.
 * This ensures that conflicting Tailwind classes are handled correctly.
 * 
 * @param inputs - Class names, arrays, or objects (from clsx)
 * @returns A single string of merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper for conditional class strings, returning a single merged string.
 * Useful when you have multiple conditional blocks that need merging.
 * 
 * @param inputs - Class names, arrays, or objects
 * @returns A single string of merged class names
 */
export function cnv(...inputs: ClassValue[]) {
  return cn(inputs);
}
