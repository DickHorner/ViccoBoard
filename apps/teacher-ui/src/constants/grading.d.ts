/**
 * Grading scheme constants
 */
export declare const DEFAULT_GRADING_SCHEME: "default";
export declare const GRADING_SCHEMES: {
    readonly default: "Default (1-6 German)";
    readonly 'numeric-1-15': "Numeric (1-15 Points)";
    readonly 'letter-a-f': "Letter Grades (A-F)";
    readonly percentage: "Percentage (0-100%)";
};
export type GradingSchemeKey = keyof typeof GRADING_SCHEMES;
