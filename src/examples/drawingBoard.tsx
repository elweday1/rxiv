import { rxCreateElement } from '../framework';
import { control } from '../framework';
import { callGeminiVisionAPI } from '../gemini';
import { debounceTime, filter, map, merge, pairwise, startWith, switchMap, takeUntil, tap, withLatestFrom, of, catchError, from } from 'rxjs';
import '../style.css';

const canvasControl = control({ events: ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 'touchstart', 'touchmove', 'touchend', 'touchcancel'] });
const colorControl = control({ value: { prop: 'value', event: 'change', initialValue: '#000000' } })
const sizeControl = control({ value: { prop: 'value', event: 'change', initialValue: 8 } });
const canvasContext$ = canvasControl.element$.pipe(
  filter((canvas): canvas is HTMLCanvasElement => canvas !== null),
  map(canvas => canvas.getContext('2d')),
  filter((ctx): ctx is CanvasRenderingContext2D => ctx !== null),
);

const startDrawing$ = merge(
  canvasControl.events.mousedown$.pipe(map(event => ({ x: event.offsetX, y: event.offsetY }))),
  canvasControl.events.touchstart$.pipe(map(event => ({ x: event.touches[0].clientX, y: event.touches[0].clientY }))),
);

const stopDrawing$ = merge(
  canvasControl.events.mouseup$,
  canvasControl.events.mouseleave$,
  canvasControl.events.touchend$,
  canvasControl.events.touchcancel$,
);
const moveDrawing$ = merge(
  canvasControl.events.mousemove$.pipe(map(event => ({ x: event.offsetX, y: event.offsetY }))),
  canvasControl.events.touchmove$.pipe(map(event => ({ x: event.touches[0].clientX, y: event.touches[0].clientY }))),
)

const imageDescription$ = startDrawing$.pipe(
  switchMap(downEvent => moveDrawing$.pipe(
    startWith(downEvent),
    pairwise(),
    takeUntil(stopDrawing$)
  )),
  withLatestFrom(canvasContext$, colorControl.value$, sizeControl.value$),
  tap(([[prev, current], ctx, color, size]) => {
    if (!color || !size) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
  }),
  switchMap(() => merge(
    of({ message: 'Drawing...', error: false }),
    canvasControl.element$.pipe(
      filter((canvas): canvas is HTMLCanvasElement => canvas !== null),
      debounceTime(2500),
      map(canvas => canvas.toDataURL('image/png').replace('data:image/png;base64,', '')),
      switchMap(base64Data => from(callGeminiVisionAPI(base64Data)).pipe(
        map(apiResult => ({ message: apiResult.message, error: false })),
        startWith({ message: 'Analyzing...', error: false }),
        catchError((error) => {
          return of({ error: true, message: `Failed to communicate with the Gemini API: ${error}` });
        })
      )),
    )
  )),
  map(result => result.message)
);

export const DrawingBoard = () => (
  <div>
    <h1>Reactive Canvas</h1>
    <div class="controls">
      <label>
        Color
        <input type="color" control={colorControl} />
      </label>
      <label>
        Brush Size: {sizeControl.value$}px
        <input type="range" min="1" max="100" control={sizeControl} />
      </label>
    </div>
    <canvas
      control={canvasControl}
      width={800}
      height={600}
    ></canvas>
    <p> {imageDescription$}</p>
  </div>
);