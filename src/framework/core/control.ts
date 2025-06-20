import { BehaviorSubject, Subject } from 'rxjs';

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
  [K in E[number] as `${string & K}$`]: Subject<HTMLElementEventMap[K]>;
};
/** The base interface that all controls share. */
export interface BaseControl {
  element$: BehaviorSubject<HTMLElement | null>;
}

/** The interface for a control that manages a value (two-way binding). */
export interface ValueControl<T> extends BaseControl {
  value$: BehaviorSubject<T | undefined>;
  setValue: (value: T) => void;
  _valueDef: { prop: string; event: string };
}

/** The interface for a control that only streams DOM events. */
export interface EventsControl<E extends EventsDef> extends BaseControl {
  events: EventSubjects<E>;
  _eventsDef: E;
}


// --- Type Definitions for the Control System ---

/** The base interface that all controls share, providing the element reference. */
export interface BaseControl {
  _isControl: true;
  element$: BehaviorSubject<HTMLElement | null>;
}

/** The interface for the value-binding part of a control. */
export interface ValuePart<T> {
  value$: BehaviorSubject<T | undefined>;
  setValue: (value: T) => void;
  _valueDef: { prop: string; event: string };
}

/** The interface for the event-streaming part of a control. */
export interface EventsPart<E extends EventsDef> {
  events: EventSubjects<E>;
  _eventsDef: E;
}

interface ControlConfig<TValue, TEvents extends EventsDef> {
  value?: { prop: string; event: string; initialValue?: TValue };
  events?: TEvents;
}

// --- Type Definitions for the Control System ---

/** The base interface that all controls share. */
export interface BaseControl {
  _isControl: true;
  element$: BehaviorSubject<HTMLElement | null>;
}

/** The interface for the value-binding part of a control. */
export interface ValuePart<T> {
  value$: BehaviorSubject<T | undefined>;
  setValue: (value: T) => void;
  _valueDef: { prop: string; event: string };
}

/** The interface for the event-streaming part of a control. */
export interface EventsPart<E extends EventsDef> {
  events: EventSubjects<E>;
  _eventsDef: E;
}

/** The final Control type is a union of all possible valid shapes. */
export type Control<T, E extends EventsDef> = BaseControl & Partial<ValuePart<T> & EventsPart<E>>;

/** The configuration object for createControl. */
interface ControlConfig<TValue, TEvents extends EventsDef> {
  value?: { prop: string; event: string; initialValue?: TValue };
  events?: TEvents;
}


// --- The `createControl` Function with Overloads ---

// Overload 1: For creating a control with both value and events.
export function control<TValue, const TEvents extends EventsDef>(
  config: {
    value: { prop: string; event: string; initialValue?: TValue },
    events: TEvents
  }
): BaseControl & ValuePart<TValue> & EventsPart<TEvents>;

// Overload 2: For creating a control with only a value.
export function control<TValue>(
  config: { value: { prop: string; event: string; initialValue?: TValue } }
): BaseControl & ValuePart<TValue>;

// Overload 3: For creating a control with only events.
export function control<const TEvents extends EventsDef>(
  config: { events: TEvents }
): BaseControl & EventsPart<TEvents>;

// Overload 4: For creating a simple ref-only control.
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