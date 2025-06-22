import { reactive } from "../framework";
import { of, startWith, switchMap, timer } from "rxjs"; 

const oldState = { user: { name: 'Mohammed' } }
const newState = { user: { name: 'Nasser' } };
const state$ = timer(2000).pipe(
    switchMap(()=>of(newState)),
    startWith(oldState),
)

// Create the reactive proxy,
//  no need to pluck every item,
//  props are generated on the fly
const state = reactive(state$); 

// --- In your view ---
export const App = () => (
  // Accessing user.name$ returns an Observable<string>
  // that the framework automatically subscribes to.
  <h1>Hello, {state.user.name$}</h1>
);