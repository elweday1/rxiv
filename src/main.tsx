import { rxRender, rxCreateElement } from './framework';
import { DrawingBoard } from './examples/drawingBoard';

rxRender(<DrawingBoard />, document.getElementById('app')!);