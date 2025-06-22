import { rxRender, rxCreateElement } from './framework';
import { DrawingBoard } from './examples/DrawingBoard/drawingBoard';
import { Todos } from './examples/Todos/todos';

rxRender(<Todos />, document.getElementById('app')!);