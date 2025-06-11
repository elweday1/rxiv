
import { BehaviorSubject, map } from 'rxjs';
import { rxRender, Each, rxCreateElement } from './framework';
import './style.css';

type Todo = { id: number, title: string, completed: boolean };

const todos$ = new BehaviorSubject<Todo[]>([]);
const newTodo$ = new BehaviorSubject<string>('');

const addItem = () => {
  todos$.next([...todos$.value, {
    id: Date.now(),
    title: newTodo$.value,
    completed: false,
  }]);
  newTodo$.next('');
}

const TodoInput = ( // Can be a function or an Expression
  <input type="text" value={newTodo$} oninput={(e) => newTodo$.next(e.target.value)} />
)

const TodosList = () => (
  <ul>
    <Each items$={todos$}>
      {(item, index) => (
        <li>
          <span>{item.title}</span>
          <button
            onclick={() => todos$.next(todos$.value.filter((_, i) => i !== index))}
          >Remove Todo</button>
        </li>
      )}
    </Each>
  </ul>
)

// --- VIEW SECTION ---
const App = () => (
  <div>
    <h1>Clean Architecture Example</h1>
    {TodoInput}
    <button onclick={addItem}>Add Item</button>
    <hr />
    <h2>List Rendering</h2>
    <TodosList />
    <hr />
    <h2>Remaining Todos</h2>
    {/* This is a reactive expression */}
    <p>{todos$.pipe(map(todos => todos.filter(todo => !todo.completed).length))}</p>
  </div>
);

// --- Rendering ---
rxRender(<App />, document.getElementById('app')!);