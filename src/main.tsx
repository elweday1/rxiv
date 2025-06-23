import { ColorDemo } from './examples/Colors';
import { KanbdanBoard } from './examples/Kanban/index';
import { renderDom } from './framework';
import "./style.css"

renderDom(<ColorDemo />, document.getElementById('app')!);