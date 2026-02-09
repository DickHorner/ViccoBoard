import { createI18n } from 'vue-i18n';
import deLang from './locales/de.json';
import enLang from './locales/en.json';
/**
 * Locale messages — directly from SportZens APK parity-spec
 */
const messages = {
    de: deLang,
    en: enLang,
};
/**
 * Missing key marker — visible when a key is not found
 * Format: ⟦MISSING:namespace.key⟧
 */
function missingKeyHandler(path) {
    return `⟦MISSING:${path}⟧`;
}
/**
 * Initialize vue-i18n with SportZens locales
 * - Detects browser language (defaults to 'en')
 * - Shows visible markers for missing keys
 * - Safari-compatible (no special APIs required)
 */
export function createAppI18n() {
    // Detect browser language, fallback to 'en'
    const browserLang = navigator.language?.split('-')[0] || 'en';
    const defaultLocale = (browserLang === 'de') ? 'de' : 'en';
    const options = {
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
export function getAvailableLocales() {
    return Object.keys(messages);
}
export default createAppI18n;
