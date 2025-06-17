import { BehaviorSubject, Observable, Subject, Subscription, merge } from 'rxjs';
import { map, scan, shareReplay, startWith, withLatestFrom } from 'rxjs/operators';
import { reactive } from './reactive';
import { DeepUnwrapped } from '../types';

type StateUpdate<TState> = Partial<TState> | ((state: TState) => TState);

type ActionsDefinition<TState, TActions> = (
  // `dispatch` is the new `set`. It sends an update into the stream.
  dispatch: (update: StateUpdate<TState>) => void,
  // `on` now takes a reducer function.
  on: <T>(
    source$: Observable<T>,
    reducer: (state: TState, value: T) => TState
  ) => void
) => TActions;


export function createStore<TState extends object, TActions extends object>(
  initialState: TState,
  define: ActionsDefinition<TState, TActions>
) {
  // --- Internal Subjects and Streams ---
  const state$ = new BehaviorSubject<TState>(initialState);
  const actionSubject = new Subject<StateUpdate<TState>>();
  const externalUpdateStreams: Observable<StateUpdate<TState>>[] = [];

  // --- Utilities passed to the definition function ---
  const dispatch = (update: StateUpdate<TState>) => {
    actionSubject.next(update);
  };

  const on = <T>(
    source$: Observable<T>,
    reducer: (state: TState, value: T) => TState
  ) => {
    // We convert the external stream into a stream of state-updating functions.
    const updateStream = source$.pipe(
      map(value => (state: TState) => reducer(state, value))
    );
    externalUpdateStreams.push(updateStream);
  };

  // --- Create the public API ---
  const actions = define(dispatch, on);
  const state = reactive(state$) as DeepUnwrapped<TState>;

  // --- The Single State Stream ---
  // Merge all sources of state change into one stream.
  merge(actionSubject, ...externalUpdateStreams).pipe(
    // `scan` is like `reduce` for observables. It accumulates state.
    scan((currentState, updateFn) => {
      if (typeof updateFn === 'function') {
        return (updateFn as (state: TState) => TState)(currentState);
      }
      return { ...currentState, ...updateFn };
    }, initialState)
  ).subscribe(newState => {
    // There is now only ONE subscription that updates the state.
    state$.next(newState);
  });

  return { state, ...actions };
}