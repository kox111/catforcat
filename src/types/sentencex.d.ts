declare module "sentencex" {
  /**
   * Segment text into sentences using language-specific rules.
   * @param lang - ISO 639-1 language code (e.g., 'en', 'es', 'fr')
   * @param text - Text to segment into sentences
   * @returns Array of sentences
   */
  export function segment(lang: string, text: string): string[];
}
