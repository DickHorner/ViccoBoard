import { createI18n } from 'vue-i18n';
import type { I18n, I18nOptions } from 'vue-i18n';

import deLang from './locales/de.json';
import enLang from './locales/en.json';

/**
 * Locale messages — directly from Sport APK parity-spec
 */
const messages = {
  de: deLang,
  en: enLang,
};

/**
 * Missing key marker — visible when a key is not found
 * Format: ⟦MISSING:namespace.key⟧
 */
function missingKeyHandler(path: string): string {
  return `⟦MISSING:${path}⟧`;
}

/**
 * Initialize vue-i18n with Sport locales
 * - Detects browser language (defaults to 'en')
 * - Shows visible markers for missing keys
 * - Safari-compatible (no special APIs required)
 */
export function createAppI18n(): I18n {
  // Detect browser language, fallback to 'en'
  const browserLang = navigator.language?.split('-')[0] || 'en';
  const defaultLocale = (browserLang === 'de') ? 'de' : 'en';

  const options: I18nOptions = {
    legacy: false, // Composition API mode
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages,
    missingWarn: false, // Disable console warn to avoid noise
    fallbackWarn: false,
    globalInjection: true,
  };

  const i18n = createI18n(options);

  /**
   * Custom missing handler - called when key is not found
   * Overrides the default v-i18n behavior to show visible marker
   */
  // @ts-ignore - missingHandler is present but not typed in vue-i18n v9
  i18n.global.missingHandler = missingKeyHandler;

  return i18n;
}

/**
 * Get all loaded locales
 */
export function getAvailableLocales(): string[] {
  return Object.keys(messages);
}

/**
 * Type-safe i18n key helper (optional, placeholder for future)
 */
export type I18nKey = keyof typeof deLang;

export default createAppI18n;
