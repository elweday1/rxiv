import { Observable, Subject, merge } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';
import { reactive } from './reactive';
import { DeepUnwrapped } from '../types';

// --- Event binding helper ---
export function on<TState, T>(
  source$: Observable<T>,
  reducer: (state: TState, value: T) => Partial<TState> | void
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
  ...eventBindings: Array<ReturnType<typeof on<TState, any>>>
): {context: DeepUnwrapped<TState>} & TReturnedActions {
  const actionSubject = new Subject<(state: TState) => TState>();
  const externalUpdateStreams: Observable<(state: TState) => TState>[] = [];

  // --- Actions dispatcher ---
  const actions = {} as any;
    for (const key in actionsObj) {
      actions[key] = (payload?: any) => {
        actionSubject.next((state: TState) => ({ ...state, ...actionsObj[key](state, payload) }));
      };
  }

  // --- Event bindings ---
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

  // --- The Single State Stream ---
  const state$ = merge(actionSubject, ...externalUpdateStreams).pipe(
    scan((currentState, updateFn) => updateFn(currentState), initialState),
    startWith(initialState)
  )
  
  const context = reactive(state$);
  return { context, ...actions };
}

export function typeTestStore<
TState,
TActions extends Record<string, (state: TState, payload?: any) => Partial<TState> | void>,
TReturnedActions = {[K in keyof TActions]: ExtractActionPayload<TActions[K]>}
>(
  initialState: TState,
  actionsObj: TActions
  ,
  ...eventBindings: Array<ReturnType<typeof on<TState, any>>>
): TReturnedActions {
  return {} as TReturnedActions
}

typeTestStore({count: 0}, {
  addOne: ({count})=>{}
})

