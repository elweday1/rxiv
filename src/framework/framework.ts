import { Subscription, fromEvent, isObservable } from 'rxjs';
import { ComponentThunk, RxNode } from './types';
import { BaseControl, EventsControl, ValueControl } from './core/control';

/**
 * The implementation that connects a control object to a real DOM element.
 * It reads the control's definition and attaches all necessary subscriptions and listeners.
 * @param element The real HTMLElement that was just created.
 * @param control The control object passed to the `control` prop in JSX.
 */
function applyControl(element: HTMLElement, control: BaseControl) {
  // 1. Element Reference (The base feature of all controls)
  // This makes the DOM element available on the control's `element$` stream.
  control.element$.next(element);
  // We also store a reference on the element itself for the cleanup process.
  (element as any)._ref = control.element$;

  // Cast to specific control types to check for features.
  const valueCtrl = control as ValueControl<any>;
  const eventsCtrl = control as EventsControl<any>;

  // 2. Two-Way Value Binding (if the control has this feature)
  if (valueCtrl.value$ && valueCtrl._valueDef) {
    const { prop: valueProp, event: eventName } = valueCtrl._valueDef;

    // If the control starts with no value, read it from the DOM attribute.
    if (valueCtrl.value$.getValue() === undefined) {
      valueCtrl.setValue((element as any)[valueProp]);
    }

    // STATE -> DOM: Subscribe to the control's value and update the element's property.
    const valueToDomSub = valueCtrl.value$.subscribe((value: any) => {
      updateProp(element, valueProp, value);
    });
    addSubscription(element, valueToDomSub);

    // DOM -> STATE: Listen for the specified DOM event and update the control's value.
    const domToValueSub = fromEvent(element, eventName).subscribe((event: Event) => {
      valueCtrl.setValue((event.target as any)[valueProp]);
    });
    addSubscription(element, domToValueSub);
  }

  // 3. Event Streams (if the control has this feature)
  if (eventsCtrl.events && eventsCtrl._eventsDef) {
    for (const eventName of eventsCtrl._eventsDef) {
      // TypeScript fix: use 'as keyof typeof eventsCtrl.events' to index safely
      const eventKey = (eventName + "$") as keyof typeof eventsCtrl.events;
      const eventSubject = eventsCtrl.events[eventKey];
      if (eventSubject) {
        // For each defined event, listen on the element and pipe it into the control's subject.
        const eventSub = fromEvent(element, eventName).subscribe(e => {
          eventSubject.next(e);
        });
        addSubscription(element, eventSub);
      }
    }
  }
}

// Add this helper function inside `framework.ts` before `rxCreateElement`.
function updateProp(element: HTMLElement, key: string, value: any) {

  // Check if the key is a direct property on the DOM element object.
  // This handles `value`, `checked`, `disabled`, `selected`, `className`, etc.
  if (key in element) {
    (element as any)[key] = value;
  } else {
    // For all other attributes (like 'data-*', 'aria-*', 'for', etc.), use setAttribute.
    // We also handle boolean attributes like 'hidden'. If the value is falsey, remove the attribute.
    if (value === false || value === null || value === undefined) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, String(value === true ? '' : value));
    }
  }
}

function cleanup(element: Node) {
  if (element._subscriptions) {
    element._subscriptions.forEach(sub => sub.unsubscribe());
    element._subscriptions = [];
  }
  element.childNodes.forEach(cleanup);
}

function addSubscription(element: Node, subscription: Subscription) {
  element._subscriptions = element._subscriptions || [];
  element._subscriptions.push(subscription);
}

// --- The Core Reactive Engine ---
function resolveChild(child: any): Node {
  if (typeof child === 'function') {
    // We wrap it in a "thunk" and resolve it, reusing our existing logic.
    const thunk = { _isComponentThunk: true, tag: child, props: {} };
    return resolveChild(thunk);
  }

  if (child && child._isComponentThunk) {
    const { tag, props } = child as ComponentThunk;
    const componentResult = tag(props);
    return resolveChild(componentResult);
  }

  if (child instanceof Node) return child;
  if (isObservable(child)) {
    const placeholder = document.createElement('span');
    const sub = child.subscribe(value => {
      placeholder.childNodes.forEach(cleanup);
      const newNode = resolveChild(value);
      placeholder.replaceChildren(newNode);
    });
    addSubscription(placeholder, sub);
    return placeholder;
  }
  if (Array.isArray(child)) {
    const fragment = document.createDocumentFragment();
    child.forEach(item => fragment.appendChild(resolveChild(item)));
    return fragment;
  }
  if (child === false || child === null || child === undefined) {
    return document.createDocumentFragment();
  }
  if (typeof child === 'function') {
    // We wrap it in a "thunk" and resolve it, reusing our existing logic.
    const thunk = { _isComponentThunk: true, tag: child, props: {} };
    return resolveChild(thunk);
  }

  return document.createTextNode(String(child));
}


export function fragmentComponent(props: { children: any }) {
  return props.children;
}

export function createElement(
  tag: any,
  props: { [key: string]: any } | null,
  ...children: any[]
): HTMLElement | DocumentFragment | ComponentThunk {
  if (typeof tag === 'function') {
    return { _isComponentThunk: true, tag, props: { ...props, children } };
  }
  // Note: The `if (tag === Fragment)` check is no longer needed here.
  const element = document.createElement(tag);
  if (props?.control) {
    applyControl(element, props.control);
  }
  for (const key in props) {
    if (!props.hasOwnProperty(key)) continue;

    const propValue = props[key];

    if (key.startsWith('on') && typeof propValue === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), propValue);
    } else if (isObservable(propValue)) {
      // If the prop is reactive, subscribe to it and call our new update helper.
      const sub = propValue.subscribe(value => {
        updateProp(element, key, value);
      });
      addSubscription(element, sub);
    } else {
      // If the prop is static, just call the update helper once.
      updateProp(element, key, propValue);
    }
  }
  children.forEach(child => element.appendChild(resolveChild(child)));
  return element;
}


export function renderDom(node: RxNode, container: HTMLElement) {
  const rootNode = resolveChild(node);
  cleanup(container);
  container.replaceChildren(rootNode);
}
