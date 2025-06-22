import { Each } from "../../framework";
import { control } from "../../framework/core/control";
import { store, on } from "../../framework/core/store";
import { filter, from, map, merge, switchMap } from "rxjs";

type Todo = { userId: number, id: number, title: string, completed: boolean }
const btnControl = control({
    events: ["click"]
})

const fieldControl = control({
    events: ["keypress"],
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

const loadTodos$ = btnControl.events.click$.pipe(
    switchMap(() => from(
        fetch("https://jsonplaceholder.typicode.com/todos")
            .then<Todo[]>(res => res.json())
            .then((todos) => todos.filter((_, idx) => idx < 10))
    ))
)

const todosStore = store(
    { todos: [] as Todo[], newTodo: "" },
    {
        removeTodo: ({ todos }, { idx }) => (
            { todos: todos.filter((_, i) => i!=idx) }
        )
    },
    on(addTodo$, ({ newTodo, todos }) => {
        if (!newTodo) return;
        const todoItem = { 
            completed: false,
            id: todos.length,
            title: newTodo,
            userId: 123
        };
        return { newTodo: "", todos: [todoItem, ...todos] }
    }),
    on(fieldControl.value$, (_, newTodo) => ({ newTodo })),
    on(loadTodos$, ({ todos }, newTodos) => (
        { todos: [...todos, ...newTodos] })
    )
);

const todosCount$ = todosStore.context.todos$.pipe(
    map(todos => todos.length)
);

function TodoItem({todo, idx}:{todo: Todo, idx: number}) {
    return (
    <>
        <li>
            <button onclick={() => todosStore.removeTodo({ idx })}>x</button>
            <span>{todo.title}</span>
        </li>
        </>
    )
}


const items: Todo[] = [{
    completed: false, 
    id: 0,
    title: "Hello world",
    userId: 0
}] 
export const Todos = () => {
    return (
        <div>
            <h1>Todos</h1>
            <div>
                <input 
                    type="text"
                    value={todosStore.context.newTodo$}
                    control={fieldControl} />
                <button control={addTodoBtnControl}> Add todo</button>
            </div>
            <button control={btnControl}>Load Todos</button>
            <ul>
                {items.map((todo, idx)=> <TodoItem todo={todo} idx={idx} />)}
                <Each
                    key={({id})=>id.toString()}
                    items$={todosStore.context.todos$}
                    fallback={<p>No todos here</p>}>
                    {(todo, idx)=> <TodoItem todo={todo} idx={idx} />}
                </Each>
            </ul>
            <p>Count: {todosCount$}</p>
        </div>
    )
}

