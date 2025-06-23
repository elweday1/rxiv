import { BehaviorSubject, merge, Observable, of, Subject, withLatestFrom } from 'rxjs';

/**
 * Defines the contract for how a control reads/writes a value from/to a DOM element.
 */
export interface ControlValueAccessor {
  /** The DOM property to get/set the value from (e.g., 'value', 'checked'). */
  prop: string;
  /** The DOM event to listen to for changes (e.g., 'input', 'change'). */
  event: string;
}

/** A helper type that defines an array of valid DOM event names. */
export type EventsDef = Readonly<(keyof HTMLElementEventMap)[]>;

/** A Mapped Type that creates a correctly typed object of event Subjects. */
export type EventSubjects<E extends EventsDef> = {
  [K in E[number]as `${string & K}$`]: Subject<HTMLElementEventMap[K]>;
};
/** The base interface that all controls share. */
export interface BaseControl {
  element$: BehaviorSubject<HTMLElement | null>;
}

/** The interface for a control that manages a value (two-way binding). */
export interface ValueControl<T> extends BaseControl {
  value$: BehaviorSubject<T>;
  setValue: (value: T) => void;
  _valueDef: { prop: string; event: string };
}

/** The interface for a control that only streams DOM events. */
export interface EventsControl<E extends EventsDef> extends BaseControl {
  events: EventSubjects<E>;
  _eventsDef: E;
}

/** The base interface that all controls share, providing the element reference. */
export interface BaseControl {
  _isControl: true;
  element$: BehaviorSubject<HTMLElement | null>;
}

/** The interface for the value-binding part of a control. */
export interface ValuePart<T> {
  value$: BehaviorSubject<T>;
  setValue: (value: T) => void;
  _valueDef: { prop: string; event: string };
}

export interface EventsPart<E extends EventsDef> {
  events: EventSubjects<E>;
  _eventsDef: E;
}

interface ControlConfig<TValue, TEvents extends EventsDef> {
  value?: { prop: string; event: string; initialValue?: TValue };
  events?: TEvents;
}

export type Control<T, E extends EventsDef> = BaseControl & Partial<ValuePart<T> & EventsPart<E>>;

interface ControlConfig<TValue, TEvents extends EventsDef> {
  value?: { prop: string; event: string; initialValue?: TValue };
  events?: TEvents;
}

export function control<TValue, const TEvents extends EventsDef>(
  config: {
    value: { prop: string; event: string; initialValue?: TValue },
    events: TEvents
  }
): BaseControl & ValuePart<TValue> & EventsPart<TEvents>;

export function control<TValue>(
  config: { value: { prop: string; event: string; initialValue?: TValue } }
): BaseControl & ValuePart<TValue>;

export function control<const TEvents extends EventsDef>(
  config: { events: TEvents }
): BaseControl & EventsPart<TEvents>;

export function control(): BaseControl;

/**
 * The single implementation for `control`.
 * It builds the control object based on the provided configuration.
 * The overloads above provide the strict type safety.
 */
export function control(config: ControlConfig<any, any> = {}): any {

  const control: BaseControl & Partial<ValuePart<any> & EventsPart<any>> = {
    _isControl: true,
    element$: new BehaviorSubject<HTMLElement | null>(null),
  };

  if (config.value) {
    control.value$ = new BehaviorSubject(config.value.initialValue);
    control.setValue = (newValue: any) => control.value$?.next(newValue);
    control._valueDef = { prop: config.value.prop, event: config.value.event };
  }

  if (config.events) {
    control.events = {};
    for (const eventName of config.events) {
      control.events[`${eventName}$`] = new Subject<Event>();
    }
    control._eventsDef = [...config.events] as EventsDef;
  }

  return control;
}

type Observed<T> = T extends Observable<infer U> ? U : T;

type ControlFactory = () => { element$: any, value$?: any, events?: any };
type ValueType<T extends ControlFactory> = ReturnType<T> extends { value$: BehaviorSubject<infer V> } ? V : never;
type EventsType<T extends ControlFactory> = ReturnType<T> extends { events: infer E } ? E : never;
type EventStream<T> = Observable<{ key: string; event: T }>;
type EventsProxy<T extends ControlFactory> = { [K in keyof EventsType<T>]: EventStream<Observed<EventsType<T>[K]>> };

// --- Overloaded Function Signatures ---
// Overload 1: For controls with both value and events
export function multiControl<TFactory extends ControlFactory>(
  controlFactory: TFactory
): {
  at: (key: string) => ReturnType<TFactory>;
  values$: Observable<{ key: string; value: ValueType<TFactory> }>;
  events: EventsProxy<TFactory>;
  getControls: () => Map<string, ReturnType<TFactory>>;
};

// Overload 2: For controls with only a value
export function multiControl<TFactory extends ControlFactory>(
  controlFactory: TFactory
): TFactory extends () => { value$: any } ? {
  at: (key: string) => ReturnType<TFactory>;
  values$: Observable<{ key: string; value: ValueType<TFactory> }>;
  getControls: () => Map<string, ReturnType<TFactory>>;
} : never;

// Overload 3: For controls with only events
export function multiControl<TFactory extends ControlFactory>(
  controlFactory: TFactory
): TFactory extends () => { events: any } ? {
  at: (key: string) => ReturnType<TFactory>;
  events: EventsProxy<TFactory>;
  getControls: () => Map<string, ReturnType<TFactory>>;
} : never;

export function multiControl<TFactory extends ControlFactory>(
  controlFactory: TFactory
): any {
  const controls = new Map<string, ReturnType<TFactory>>();
  const valuesSubject$ = new Subject<any>();
  const eventSubjects = new Map<string, Subject<any>>();

  const at = (key: string): ReturnType<TFactory> => {
    if (controls.has(key)) {
      return controls.get(key)!;
    }
    const newControl = controlFactory();
    controls.set(key, newControl as any);

    if ('value$' in newControl) {
      (newControl.value$ as BehaviorSubject<any>).subscribe(value => {
        valuesSubject$.next({ key, value });
      });
    }

    if ('events' in newControl) {
      for (const eventName in newControl.events) {
        if (!eventSubjects.has(eventName)) {
          eventSubjects.set(eventName, new Subject());
        }
        const masterSubject = eventSubjects.get(eventName)!;
        (newControl.events as any)[eventName].subscribe((event: any) => {
          masterSubject.next({ key, event });
        });
      }
    }
    return newControl as any;
  };

  const eventsProxy = new Proxy({}, {
    get(_, prop: string) {
      if (!eventSubjects.has(prop)) {
        eventSubjects.set(prop, new Subject());
      }
      return eventSubjects.get(prop)!.asObservable();
    }
  });

  return {
    at,
    events: eventsProxy,
    values$: valuesSubject$.asObservable(),
    getControls: () => controls,
  };
}