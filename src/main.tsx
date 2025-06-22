import { App } from './examples/Simple';
import { Todos } from './examples/Todos/todos';
import { renderDom } from './framework';

renderDom(<App />, document.getElementById('app')!);