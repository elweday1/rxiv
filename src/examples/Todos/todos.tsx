import { Each } from "../../framework";
import { control } from "../../framework/core/control";
import { store, on } from "../../framework/core/store";

import { filter, from, map, merge, scan, switchMap } from "rxjs";

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
    scan((acc)=>acc+1,0),
    switchMap((idx) => from(
        fetch("https://jsonplaceholder.typicode.com/todos")
            .then<Todo[]>(res => res.json())
            .then((todos) => [todos[idx]])
    ))
)

const todosStore = store(
    { todos: [] as Todo[], newTodo: "" },
    {
        deleteTodo: ({ todos }, { idx }) => {
            const updatedTodos = todos.filter((_, i) => i !== idx);
            return { todos: updatedTodos };
        },
        markDone: ({ todos }, { idx }) => {
            const updatedTodos = todos.map((todo, i) => 
                i === idx ? { ...todo, completed: !todo.completed } : todo
            );
            return { todos: updatedTodos };
        }
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
const checkedTodosCount$ = todosStore.context.todos$.pipe(
    map(todos => todos.filter((t)=>t.completed).length)
) 

function TodoItem({todo, idx}:{todo: Todo, idx: number}) {
    return (
    <>
        <li>
            <button onclick={() => todosStore.deleteTodo({ idx })} >
                X
            </button>

            <input type="checkbox" onchange={() => todosStore.markDone({ idx })} checked={todo.completed}  />
            <span data-done={todo.completed} style={todo.completed ? "text-decoration: line-through" : ""}>{todo.title}</span>
        </li>
        </>
    )
}

export const Todos = () => {
    return (
        <div>
            <h1>Todos</h1>
            <div>
                <input 
                    type="text"
                    value={todosStore.context.newTodo$}
                    control={fieldControl} />
                <button control={addTodoBtnControl}> +</button>
            </div>
            <button control={btnControl}>Load Random Todo</button>
            <ul>
                <Each
                    keyFn={({id})=>id.toString()}
                    items$={todosStore.context.todos$}
                    fallback={<p>No todos here</p>}>
                    {(todo, idx)=> <TodoItem todo={todo} idx={idx} />}
                </Each>
            </ul>
            <p>Checked {checkedTodosCount$}/{todosCount$}</p>
        </div>
    )
}

