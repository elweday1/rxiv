# RXIV
A fine-grained, truly reactive rxjs-based UI framework for when things get serious.
RXIV is a lightweight framework for building powerful, type-safe user interfaces. It challenges the conventional approach of virtual DOMs and complex lifecycle hooks by leveraging two powerful tools directly: RxJS for state and logic, and JSX for declarative views.
## Core Principles
RXIV is built on a few opinionated principles:
 * No Virtual DOM. Truly Fine-Grained Reactivity. When a piece of state changes, only the exact DOM nodes that depend on it are updated. No diffing, no complex reconciliation. Just surgical precision.
 * RxJS is a First-Class Citizen. State is not a static snapshot; it's a flow of events over time. RXIV treats RxJS as the complete application architecture it is, providing tools to work with streams declaratively.
 * Zero Manual Subscriptions. Manual .subscribe() and .unsubscribe() calls are a primary source of bugs and memory leaks. In RXIV, you never manage a subscription yourself. The framework's lifecycle management handles all setup and teardown automatically.
 * Embrace the Platform. The framework doesn't hide powerful Web APIs like IntersectionObserver or the DOM Event system. It provides tools to supercharge them with streams, leading to more performant and transparent code.
 * Declarative Side Effects. There are no useEffect dependency arrays. An effect's lifecycle is tied directly and declaratively to its presence in the UI tree, making cleanup guaranteed and automatic.
 * All kinds of data (sync, async, events, ...) are defined with the same language: Observables
Key Features
 * Fine-grained reactivity powered by RxJS.
 * Declarative UI with standard JSX and TSX.
 * A powerful, composable control system for two-way binding and reactive forms.
 * First-class side-effect management with automatic cleanup.
 * [UNDER-DEVELOPMENT] Type-safe routing with async data loaders and parameter inference.
 * [UNDER-DEVELOPMENT] A "headless" (logic-only) core decoupled from the DOM renderer, making it platform-agnostic.

### Getting Started
Get a new project running in minutes with Vite.
 * Scaffold a Vite project:
 ```bash
   npm create vite@latest my-delta-app -- --template vanilla-ts
    cd my-delta-app
```

 * Install dependencies:
   ```bash
    npm install rxjs
   ```

 * Configure tsconfig.json for JSX:
   Make sure your compilerOptions include the JSX factory settings.
   // TODO
   ```

* Create your global types file:
   You'll need a src/globals.d.ts file to teach TypeScript about your JSX implementation. Use the one we created in our last steps.
### Core Concepts & API
#### Simple Subscription
```tsx
import { interval } from "rxjs";
const count$ = interval(100); // no need to subscripe or unsusrcibe
const App = () => (
  <h1>Current Count is {count$}</h1>
);
```
#### reactive
The reactive() utility is the primary way to work with state in your views. It takes an Observable<Object> and returns a proxy that allows clean, nested access to your state as new observables.
```tsx
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
```

### The control API 
The unified control prop is the primary way to manage element state, events, and references.
// --- In your logic ---
```tsx
import { control } from 'rxiv/core';

const btnControl = control({ events: ['click'] });
const nameControl = control<string>({ value: { prop: 'value', event: 'change', initialValue: '' } });


// Logic is clean and type-safe
buttonControl.events.click$.pipe(
  switchMap(()=>nameControl.value$),
  // dont manually subscribe to observables
).subscripe(console.log)


// --- In your view ---
const Form = () => (
  <div>
    <input type="text" value={nameControl.value$} control={nameControl} />
    <button control={buttonControl}>Log Name</button>
  </div>
);
```

Contributing
This framework is an exploration into the power of pure, fine-grained reactivity. Contributions, ideas, and critiques are welcome. Feel free to open an issue or submit a pull request.
License
MIT