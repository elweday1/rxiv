import { Todos } from './examples/Todos/todos';
import { renderDom } from './framework';

renderDom(<Todos />, document.getElementById('app')!);