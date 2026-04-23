// CJS stub for perfect-debounce (ESM-only package) for Jest test environments
function debounce(fn, delay) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

module.exports = { debounce };
