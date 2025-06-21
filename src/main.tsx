import { rxRender, rxCreateElement } from './framework';
import { DrawingBoard } from './examples/drawingBoard';
import { Todos } from './examples/todos';

rxRender(<Todos />, document.getElementById('app')!);