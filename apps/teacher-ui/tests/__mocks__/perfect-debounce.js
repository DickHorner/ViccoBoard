// CJS stub for perfect-debounce (ESM-only package) for Jest test environments
function debounce(fn, delay) {
  let timer;
  function debounced() {
    const args = arguments;
    const ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  }
  debounced.cancel = function() { clearTimeout(timer); };
  return debounced;
}

module.exports = { debounce };
