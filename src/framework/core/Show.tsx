import { Observable, map } from 'rxjs';
import { RxNode } from '../types';


interface ShowProps {
  when: Observable<boolean>;
  children: RxNode;
  fallback?: RxNode;
  keepRendered?: boolean
}

export function Show(props: ShowProps) {
  const { when, children, fallback } = props;
  const content$ = when.pipe(
    map(condition => (condition ? children : fallback))
  );

  return <>{content$}</>;
}