// Stub for uuid used in test environments.
// uuid v11 ships ESM-only in dist-node/; this CJS stub avoids transform issues.
let counter = 0;
const v4 = () => `test-id-${(++counter).toString(16).padStart(8, '0')}-0000-0000-0000-000000000000`;
module.exports = { v4 };
