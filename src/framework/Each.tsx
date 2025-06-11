import { Observable, map } from 'rxjs';
import { rxFragment, RxNode, rxCreateElement } from './framework';

type RenderFn<T> = (item: T, index: number) => RxNode;
interface EachProps<T> {
  items$: Observable<T[]>;
  children: RenderFn<T>;
  fallback?: RxNode;
}

export function Each<T>(props: EachProps<T>) {
  const { items$, children } = props;
  const renderFn = (children as unknown as RenderFn<T>[])[0];
  const listContent$ = items$.pipe(
    map(items => items.length > 0 ? items.map(renderFn) : props.fallback)
  );
  return <>{listContent$}</>;
}