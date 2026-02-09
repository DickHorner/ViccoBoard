import type { I18n } from 'vue-i18n';
import deLang from './locales/de.json';
/**
 * Initialize vue-i18n with SportZens locales
 * - Detects browser language (defaults to 'en')
 * - Shows visible markers for missing keys
 * - Safari-compatible (no special APIs required)
 */
export declare function createAppI18n(): I18n;
/**
 * Get all loaded locales
 */
export declare function getAvailableLocales(): string[];
/**
 * Type-safe i18n key helper (optional, placeholder for future)
 */
export type I18nKey = keyof typeof deLang;
export default createAppI18n;
