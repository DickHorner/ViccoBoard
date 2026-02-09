/**
 * UUID helper with Safari-safe fallback for randomUUID.
 */
export function createUuid() {
    if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        if (typeof crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            // Per RFC 4122 v4
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            const toHex = (n) => n.toString(16).padStart(2, '0');
            const hex = Array.from(bytes, toHex).join('');
            return (hex.substring(0, 8) + '-' +
                hex.substring(8, 12) + '-' +
                hex.substring(12, 16) + '-' +
                hex.substring(16, 20) + '-' +
                hex.substring(20));
        }
    }
    // Very last resort fallback (non-cryptographic)
    const fallback = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${fallback()}${fallback()}-${fallback()}-${fallback()}-${fallback()}-${fallback()}${fallback()}${fallback()}`;
}
