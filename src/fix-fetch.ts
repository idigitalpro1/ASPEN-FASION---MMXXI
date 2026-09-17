// Fix for "Cannot set property fetch of #<Window> which has only a getter"
// Ensures any library attempting to assign fetch (such as polyfills or SDK wrappers)
// can set and get fetch seamlessly without throwing read-only/getter errors.
try {
  const globalObj = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};
  const nativeFetch = (typeof window !== 'undefined' && window.fetch) || (globalObj as any).fetch;

  if (typeof nativeFetch === 'function') {
    let currentFetch = nativeFetch;

    const defineFetchAccessors = (obj: any) => {
      if (!obj) return;
      try {
        Object.defineProperty(obj, 'fetch', {
          get() {
            return currentFetch;
          },
          set(fn) {
            currentFetch = fn;
          },
          configurable: true,
          enumerable: true
        });
      } catch (_) {
        // Silently ignore if object cannot be modified
      }
    };

    if (typeof Window !== 'undefined' && Window.prototype) {
      defineFetchAccessors(Window.prototype);
    }
    if (typeof window !== 'undefined') {
      defineFetchAccessors(window);
    }
    if (typeof globalThis !== 'undefined') {
      defineFetchAccessors(globalThis);
    }
    if (typeof self !== 'undefined') {
      defineFetchAccessors(self);
    }
  }
} catch (e) {
  // Silently handle
}

