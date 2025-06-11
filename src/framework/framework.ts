import { Subscription, isObservable, Observable } from 'rxjs';

// --- Type Definitions and Helpers ---
interface ComponentThunk {
  _isComponentThunk: true;
  tag: (props: any) => any;
  props: { [key: string]: any };
}
export type DOMNode = Node;
export type RxNode = DOMNode | Observable<any> | string | number | boolean | null | undefined | RxNode[];




// A helper type to make props reactive.
type RxProp<T> = T | Observable<T>;

/**
 * Our helper type that converts a DOM element's properties into JSX-compatible props,
 * adding reactivity where appropriate.
 */
// 3. The main helper type for element props, now corrected.
type ElementProps<T> = {
  // Map all properties from the DOM element's interface (e.g., HTMLButtonElement)
  // BUT explicitly Omit the conflicting 'children' property.
  [K in keyof Omit<T, 'children'>]?: T[K] extends ((...args: any[]) => any)
    ? T[K] // Keep event handlers (e.g., onclick) as-is.
    : RxProp<T[K]>; // Make all other properties (e.g., id, disabled) reactive.
} & {
  class?: RxProp<string>;
  // Explicitly define the type of the `children` prop our framework accepts.
  children?: RxNode;
};



// This is where we define the global JSX namespace that TypeScript uses.
declare global {
  namespace JSX {
    /**
     * This is the magic.
     * We use a mapped type to iterate over every tag name in TypeScript's
     * built-in `HTMLElementTagNameMap`. For each tag, it automatically
     * creates the correct props type by applying our `ElementProps` helper.
     *
     * This single type definition provides full, type-safe support for all
     * standard HTML elements without needing to list them manually.
     */
    type Element = RxNode;

    // This tells TSX which prop to use for children
    interface ElementChildrenAttribute {
      children: {};
    }

    
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: ElementProps<HTMLElementTagNameMap[K]>;
    };

  }

  // This is the other global type our framework needs to track subscriptions.
  interface Node {
    _subscriptions?: Subscription[];
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


export function rxFragment(props: { children: any }) {
  return props.children;
}

export function rxCreateElement(
  tag: any,
  props: { [key: string]: any } | null,
  ...children: any[]
): HTMLElement | DocumentFragment | ComponentThunk {
  if (typeof tag === 'function') {
    return { _isComponentThunk: true, tag, props: { ...props, children } };
  }
  // Note: The `if (tag === Fragment)` check is no longer needed here.

  const element = document.createElement(tag);
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


export function rxRender(node: RxNode, container: HTMLElement) {
  const rootNode = resolveChild(node);
  cleanup(container);
  container.replaceChildren(rootNode);
}
