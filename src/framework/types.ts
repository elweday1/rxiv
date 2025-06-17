import { Observable, Subscription } from "rxjs";
import { BaseControl } from "./core/control";


/**
 * The main recursive type. It transforms an object type `T` into the shape
 * created by our `deepUnwrap` function.
 */
export type DeepUnwrapped<T> =
  // It's an intersection of two things:
  // 1. The nested, unwrappable objects.
  {
    [K in keyof T as T[K] extends RxNode ? never : K]: DeepUnwrapped<T[K]>;
  } &
  // 2. The `$` suffixed observables for every property.
  {
    [K in keyof T as `${string & K}$`]: Observable<T[K]>;
  };
// --- Type Definitions and Helpers ---
export interface ComponentThunk {
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
  [K in keyof Omit<T, 'children' | 'style'>]?: T[K] extends Function
  ? T[K] // Keep event handlers (e.g., onclick) as-is.
  : RxProp<T[K]>; // Make all other properties (e.g., id, disabled) reactive.
} & {
  class?: RxProp<string>;
  // Explicitly define the type of the `children` prop our framework accepts.
  children?: RxNode;
  control?: BaseControl;
  style?: RxProp<string>;
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
