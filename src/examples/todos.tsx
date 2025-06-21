import { rxCreateElement, Each } from "../framework";
import { control } from "../framework/core/control";
import { store, on } from "../framework/utils/store";
import { filter, from, map, merge, switchMap} from "rxjs";

type Todo = { userId: number, id: number, title: string, completed: boolean }

const btnControl = control({
    events: ["click"]
})

const fieldControl = control({
    events: ["change", "keypress"],
    value: {
        event: "change",
        prop: "value",
        initialValue: ""
    }
})

const addTodoBtnControl = control({ events: ["click"] })
const addTodo$ = merge(
    addTodoBtnControl.events.click$,
    fieldControl.events.keypress$.pipe(
        filter((event) => event.key === "Enter")
    )
)

const todosStore = store(
    { todos: [] as Todo[], newTodo: "" },
    {
        removeTodo: ({ todos }, { idx }) => {
            return { todos: todos.filter((_, index) => index != idx) }
        }
    },
    on(addTodo$, ({ newTodo, todos }) => {
        if (!newTodo) return;
        return { newTodo: "", todos: [{ completed: false, id: todos.length, title: newTodo, userId: 123 }, ...todos] }
    }),
    on(fieldControl.value$, (_, newTodo)=>({newTodo})),
    on(btnControl.events.click$.pipe(
        switchMap(() => from(
            fetch("https://jsonplaceholder.typicode.com/todos")
                .then<Todo[]>(res => res.json())
                .then((todos) => todos.filter((_, idx) => idx < 10))
        ))
    ), ({todos}, newTodos) => ({ todos: [...todos, ...newTodos] }))
);

export const Todos = () => {
    return (
        <div>
            <h1>Todos</h1>
            <div>
                <input type="text" value={todosStore.context.newTodo$} control={fieldControl} />
                <button control={addTodoBtnControl}> Add todo</button>
            </div>
            <button control={btnControl}>Load Todos</button>
            <ul>
                <Each
                    items$={todosStore.context.todos$}
                    fallback={<p>No todos here</p>}>
                    {(todo, idx) => <li><button onclick={() => todosStore.removeTodo({ idx })}>x</button>{todo.title}</li>}
                </Each>
            </ul>
            <p>Count: {todosStore.context.todos$.pipe(map(todos => todos.length))}</p>
        </div>
    )
}

