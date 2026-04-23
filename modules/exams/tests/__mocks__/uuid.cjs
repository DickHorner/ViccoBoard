// CJS stub for uuid (v14+ is ESM-only) for Jest test environments.
// Uses Node.js built-in crypto.randomUUID() which is available since Node 14.17.
const { randomUUID } = require('crypto');

module.exports = {
  v4: () => randomUUID(),
  // Note: v7 generates time-ordered UUIDs, but for test purposes crypto.randomUUID()
  // (which is v4) is sufficient. If tests assert v7 time-ordering, a real v7 implementation
  // would be needed.
  v7: () => randomUUID(),
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  validate: (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid),
  version: (uuid) => parseInt(uuid[14], 16),
  parse: (uuid) => {
    const hex = uuid.replace(/-/g, '');
    const matches = hex.match(/.{2}/g);
    if (!matches) throw new TypeError(`Invalid UUID: "${uuid}"`);
    return Uint8Array.from(matches.map(b => parseInt(b, 16)));
  },
  stringify: (arr) => {
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  },
};
