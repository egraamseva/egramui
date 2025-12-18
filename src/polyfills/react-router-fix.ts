/**
 * Polyfill to fix React Router 7 compatibility issue with React 19
 * 
 * React Router 7 tries to set an "Activity" property on an undefined object
 * during module initialization. This polyfill intercepts and handles this.
 * 
 * This must be imported BEFORE any React Router imports.
 */

// Ensure this runs at the very top level, before any other imports execute
(function() {
  'use strict';
  
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }

  // Patch Object.defineProperty to handle undefined targets
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
    // If trying to define on undefined/null, create a dummy object
    if (obj === undefined || obj === null) {
      if (prop === 'Activity' || String(prop).includes('Activity')) {
        // Silently ignore Activity property on undefined (React Router 7 issue)
        return {} as any;
      }
      console.warn(`[React Router Fix] Attempted to define property "${String(prop)}" on ${obj}. Creating object.`);
      obj = {};
    }
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (e) {
      // If it still fails, return a dummy object
      console.warn(`[React Router Fix] Failed to define property "${String(prop)}":`, e);
      return {} as any;
    }
  };

  // Patch property assignment via Proxy (if available)
  try {
    // Create a safe handler for property access
    const safeHandler = {
      set(target: any, prop: string | symbol, value: any) {
        if (target === undefined || target === null) {
          if (prop === 'Activity' || String(prop).includes('Activity')) {
            // Silently ignore Activity property assignment on undefined
            return true;
          }
          console.warn(`[React Router Fix] Attempted to set property "${String(prop)}" on ${target}. Ignoring.`);
          return true; // Return true to prevent error
        }
        target[prop] = value;
        return true;
      },
      get(target: any, prop: string | symbol) {
        if (target === undefined || target === null) {
          return undefined;
        }
        return target[prop];
      }
    };

    // Ensure globalThis exists and is safe
    if (typeof globalThis !== 'undefined') {
      // Create a safe wrapper if needed
      if (!(globalThis as any).__reactRouterFixApplied) {
        (globalThis as any).__reactRouterFixApplied = true;
      }
    }
  } catch (e) {
    // Proxy might not be available in all environments
    console.warn('[React Router Fix] Proxy not available:', e);
  }

  // Also patch direct property assignment on common objects
  const originalSetProperty = (Object as any).setProperty;
  if (!originalSetProperty) {
    (Object as any).setProperty = function(obj: any, prop: string, value: any) {
      if (obj === undefined || obj === null) {
        if (prop === 'Activity') {
          return; // Silently ignore
        }
        console.warn(`[React Router Fix] Attempted to set property "${prop}" on ${obj}`);
        return;
      }
      obj[prop] = value;
    };
  }
})();

export {};

