/**
 * String utility functions
 */
/**
 * Generate initials from first and last name
 * @param firstName - First name (can be null or undefined)
 * @param lastName - Last name (can be null or undefined)
 * @returns Uppercase initials or "?" if names are missing
 */
export function getInitials(firstName, lastName) {
    const first = (firstName ?? '').charAt(0) || '?';
    const last = (lastName ?? '').charAt(0) || '?';
    return `${first}${last}`.toUpperCase();
}
/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
