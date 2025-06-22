import { Observable, Subject, merge } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';
import { reactive } from './reactive';
import { DeepUnwrapped } from '../types';

export function on<TState, T, X>(
  source$: Observable<T>,
  reducer: (state: TState, value: T) => (Partial<TState> & X) | void
) {
  return { source$, reducer };
}

type ExtractActionPayload<T extends (state: any, payload?: any) => any> = Parameters<T>[1]

export function store<
TState extends object,
TActions extends Record<string, (state: TState, payload?: any) => Partial<TState> | void>,
TReturnedActions = {[K in keyof TActions]: ExtractActionPayload<TActions[K]>}
>(
  initialState: TState,
  actionsObj: TActions,
  ...eventBindings: Array<ReturnType<typeof on<TState, any, any>>>
): {context: DeepUnwrapped<TState>} & TReturnedActions {
  const actionSubject = new Subject<(state: TState) => TState>();
  const externalUpdateStreams: Observable<(state: TState) => TState>[] = [];

  const actions = {} as any;
    for (const key in actionsObj) {
      actions[key] = (payload?: any) => {
        actionSubject.next((state: TState) => ({ ...state, ...actionsObj[key](state, payload) }));
      };
  }

  for (const binding of eventBindings) {
    const updateStream = binding.source$.pipe(
      map((value: any) => (state: TState) => {
        const result = binding.reducer(state, value);
        if (!result) return state;
        return { ...state, ...result };
      })
    );
    externalUpdateStreams.push(updateStream);
  }

  const state$ = merge(actionSubject, ...externalUpdateStreams).pipe(
    scan((currentState, updateFn) => updateFn(currentState), initialState),
    startWith(initialState)
  )
  
  const context = reactive(state$);
  return { context, ...actions };
}

