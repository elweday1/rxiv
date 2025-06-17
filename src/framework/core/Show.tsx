// src/Show.ts
import { Observable, map } from 'rxjs';
import { rxCreateElement, rxFragment } from '../framework';
import { RxNode } from '../types';


interface ShowProps {
  when: Observable<boolean>;
  children: RxNode;
  fallback?: RxNode;
}

export function Show(props: ShowProps) {
  const { when, children, fallback } = props;
  const content$ = when.pipe(
    map(condition => (condition ? children : fallback))
  );

  return <>{content$}</>;
}