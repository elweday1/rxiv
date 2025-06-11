// src/deepUnwrap.ts
import { Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';


// A helper type to identify primitives, which should not be recursively unwrapped.
type Primitives = string | number | boolean | Date | null | undefined | Function | Array<any>;

/**
 * The main recursive type. It transforms an object type `T` into the shape
 * created by our `deepUnwrap` function.
 */
export type DeepUnwrapped<T> =
  // It's an intersection of two things:
  // 1. The nested, unwrappable objects.
  {
    [K in keyof T as T[K] extends Primitives ? never : K]: DeepUnwrapped<T[K]>;
  } &
  // 2. The `$` suffixed observables for every property.
  {
    [K in keyof T as `${string & K}$`]: Observable<T[K]>;
  };

// Cache for the top-level proxies to avoid re-creating them for the same source observable.
const proxyCache = new WeakMap<Observable<any>, any>();

export function unwrap<T extends object>(source$: Observable<T>): DeepUnwrapped<T> {
  // If we've already created a proxy for this exact observable, return it.
  if (proxyCache.has(source$)) {
    return proxyCache.get(source$);
  }

  // Cache for the derived observables and nested proxies for this specific proxy instance.
  // This prevents re-creating `state.user$` every time you access it.
  const propCache = new Map<string | symbol, any>();

  const proxy = new Proxy({}, {
    get(_, prop: string | symbol) {
      // Return from cache if this property has already been accessed.
      if (propCache.has(prop)) {
        return propCache.get(prop);
      }

      // The core API logic starts here.
      if (typeof prop === 'string' && prop.endsWith('$')) {
        // --- CASE 1: The user wants an OBSERVABLE (`user$`, `company$`, etc.) ---
        const baseProp = prop.slice(0, -1); // e.g., 'user$' -> 'user'

        const result$ = source$.pipe(
          // Pluck the property from the source object when it emits.
          map(val => (val as any)?.[baseProp]),
          // Only emit when the value of this specific property changes.
          distinctUntilChanged(),
          // CRITICAL OPTIMIZATION: Share the result among all subscribers.
          // This ensures the map/distinctUntilChanged logic only runs once per source emission.
          shareReplay(1)
        );

        propCache.set(prop, result$);
        return result$;

      } else {
        // --- CASE 2: The user wants a NESTED UNWRAPPED OBJECT (`user`) ---
        
        // First, create an observable of the nested property.
        const nestedSource$ = source$.pipe(
          map(val => (val as any)?.[prop]),
          distinctUntilChanged(),
          shareReplay(1)
        );

        // Then, recursively call deepUnwrap on this new observable.
        // This will return a new proxy for the nested level, allowing infinite chaining.
        const nestedProxy = unwrap(nestedSource$ as Observable<any>);

        propCache.set(prop, nestedProxy);
        return nestedProxy;
      }
    }
  });

  proxyCache.set(source$, proxy);
  // We cast to DeepUnwrapped<T> because the proxy will conform to this shape at runtime.
  return proxy as DeepUnwrapped<T>;
}