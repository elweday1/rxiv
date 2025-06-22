import { RxNode } from 'framework/types';
import { Observable } from 'rxjs';

// Type definitions (can be in a shared types file)
type RenderFn<T> = (item: T, index: number) => RxNode;

interface EachProps<T> {
  items$: Observable<T[]>;
  children: RenderFn<T> | [RenderFn<T>];
  fallback?: RxNode;
  keyFn: (item: T, index: number) => string | number; // Key is now mandatory for <Each>
}

/**
 * A component for efficiently rendering lists using keyed reconciliation.
 */
export function Each<T>(props: EachProps<T>) {
  const { items$, children, keyFn, fallback } = props;
  const renderFn = Array.isArray(children) ? children[0] : children;

  return {
    _isKeyedList: true,
    items$,
    keyFn,
    renderFn,
    fallback,
  } as unknown as RxNode;
}