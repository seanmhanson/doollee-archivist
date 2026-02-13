/**
 * Utility to set a debounce on a function call to prevent multiple frequent calls, and
 * provide helpers to force execution or clear pending calls.
 * @param fn the function to be debounced
 * @param delay the delay in ms to enforce between calls
 */
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout | null = null;

  const debouncedFn = function (...args: Parameters<T>): void {
    clear();

    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };

  const forcedFn = function (...args: Parameters<T>): ReturnType<T> {
    clear();
    return fn(...args) as ReturnType<T>;
  };

  const clear = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return {
    debouncedFn,
    forcedFn,
    clear,
  };
}

export default debounce;
