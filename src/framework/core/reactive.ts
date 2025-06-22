import { Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';
import { DeepUnwrapped } from '../types';

const proxyCache = new WeakMap<Observable<any>, any>();

export function reactive<T extends object>(source$: Observable<T>): DeepUnwrapped<T> {
  if (proxyCache.has(source$)) {
    return proxyCache.get(source$);
  }

  const propCache = new Map<string | symbol, any>();

  const proxy = new Proxy({}, {
    get(_, prop: string | symbol) {
      if (propCache.has(prop)) {
        return propCache.get(prop);
      }

      if (typeof prop === 'string' && prop.endsWith('$')) {
        const baseProp = prop.slice(0, -1); // e.g., 'user$' -> 'user'
        const result$ = source$.pipe(
          map(val => (val as any)?.[baseProp]),
          distinctUntilChanged(),
          shareReplay(1)
        );

        propCache.set(prop, result$);
        return result$;

      } else {
        const nestedSource$ = source$.pipe(
          map(val => (val as any)?.[prop]),
          distinctUntilChanged(),
          shareReplay(1)
        );
        const nestedProxy = reactive(nestedSource$ as Observable<any>);
        propCache.set(prop, nestedProxy);
        return nestedProxy;
      }
    }
  });

  proxyCache.set(source$, proxy);
  return proxy as DeepUnwrapped<T>;
}