import { Observable, map } from 'rxjs';
import { RxNode } from '../types';

type RenderFn<T> = (item: T, index: number) => RxNode;
interface EachProps<T> {
  items$: Observable<T[]>;
  children: RenderFn<T>;
  fallback?: RxNode;
  key?: (item: T) => string | number;
}

export function Each<T>(props: EachProps<T>) {
  const { items$, children } = props;
  const renderFn = (children as unknown as RenderFn<T>[])[0];
  const listContent$ = items$.pipe(
    map(items => items.length > 0 ? items.map(renderFn) : props.fallback)
  );
  return <>{listContent$}</>;
}