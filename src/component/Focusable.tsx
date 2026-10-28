import type { ComponentProps, JSXElementConstructor, ReactNode } from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { findNodeHandle, Pressable } from "react-native";
import { DIRECTIONS, type FocusDirection } from "../constant";
import { FocusGroupContext } from "./context";

export type FocusableStyle =
  | StyleProp<ViewStyle>
  | ((state: { focused: boolean; pressed: boolean }) => StyleProp<ViewStyle>);

/**
 * A component `Focusable` can render via `as`. It must:
 * - forward `ref` to a native view (focus() and measureLayout() are called on it),
 * - pass `focusable`, `onFocus`, `onBlur`, `onLayout`, `nextFocus*` and
 *   `style` through to that view,
 * - call `onPress` when activated (tap or confirm key).
 * RN's Pressable and Touchable* components all qualify.
 */
export type FocusableComponent = JSXElementConstructor<any>;

interface FocusableOwnProps<C extends FocusableComponent> {
  /** Component to render as the focusable cell. Defaults to `Pressable`. */
  as?: C;
  /** Cell index within the owning FocusGroup. */
  index: number;
  /** Activation handler; fires on tap and on confirm-key while focused. */
  onPress?: (event: GestureResponderEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: BlurEvent) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  /**
   * Static style or a function of focus/press state. `pressed` is only
   * tracked for the default Pressable; with a custom `as` it is always false
   * (let the component draw its own pressed state).
   */
  style?: FocusableStyle;
  /** Children, or a render function receiving the focused state. */
  children: ReactNode | ((state: { focused: boolean }) => ReactNode);
}

/** Props Focusable owns outright; set by the focus graph, not the caller. */
type InjectedProp =
  | "ref"
  | "focusable"
  | "nextFocusUp"
  | "nextFocusDown"
  | "nextFocusLeft"
  | "nextFocusRight";

export type FocusableProps<C extends FocusableComponent = typeof Pressable> =
  FocusableOwnProps<C> &
    Omit<ComponentProps<C>, keyof FocusableOwnProps<C> | InjectedProp>;

/**
 * Rail 1 focusable cell: renders `as` (default Pressable) as a focusable
 * native view with deterministic nextFocus edges provided by the owning
 * FocusGroup, which derives them from each cell's measured position. RN's
 * nextFocus* props take node handles (numbers), so neighbor refs are resolved
 * via findNodeHandle after mount — when all cells' refs are attached.
 * The selection highlight is yours to draw via the style function.
 */
export function Focusable<C extends FocusableComponent = typeof Pressable>({
  as,
  index,
  onPress,
  onFocus,
  onBlur,
  onLayout,
  style,
  children,
  ...rest
}: FocusableProps<C>) {
  const group = useContext(FocusGroupContext);

  if (group == null) {
    throw new Error("<Focusable> must be rendered inside a <FocusGroup>.");
  }

  const Component: FocusableComponent = as ?? Pressable;
  const [edges, setEdges] = useState<FocusEdges>({});
  const ref = group.getRef(index);
  // Highlight follows the group's active cell, not native focus — a tap
  // (Android touch mode) blurs every cell but must keep the highlight.
  const focused = group.activeIndex === index;
  const { neighborRefs } = group;

  useEffect(() => {
    if (__DEV__ && typeof ref.current?.measureLayout !== "function") {
      console.warn(
        `<Focusable index={${index}}>: the \`as\` component must forward ` +
          "`ref` to a native view, or focus and navigation won't work."
      );
    }
  }, [index, ref]);

  useEffect(() => {
    const neighbors = neighborRefs(index);

    const next: FocusEdges = {};
    for (const direction of DIRECTIONS) {
      const neighbor = neighbors[direction];

      if (neighbor?.current != null) {
        next[direction] = findNodeHandle(neighbor.current) ?? undefined;
      }
    }
    setEdges(next);
  }, [neighborRefs, index]);

  // Measure against the group view rather than using onLayout's
  // parent-relative box, so cells may be wrapped in other views.
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      const groupView = group.groupRef.current;

      if (ref.current == null || groupView == null) {
        return;
      }

      ref.current.measureLayout(groupView, (x, y, width, height) => {
        group.reportLayout(index, { x, y, width, height });
      });
    },
    [group, index, ref, onLayout]
  );

  const resolvedStyle =
    typeof style !== "function"
      ? style
      : Component === Pressable
        ? ({ pressed }: { pressed: boolean }) => style({ focused, pressed })
        : style({ focused, pressed: false });

  return (
    <Component
      {...rest}
      ref={ref}
      focusable
      onLayout={handleLayout}
      onPress={(event: GestureResponderEvent) => {
        group.selectIndex(index);
        onPress?.(event);
      }}
      onFocus={(event: FocusEvent) => {
        group.cellFocused(index);
        onFocus?.(event);
      }}
      onBlur={(event: BlurEvent) => {
        group.cellBlurred();
        onBlur?.(event);
      }}
      nextFocusLeft={edges.left}
      nextFocusRight={edges.right}
      nextFocusUp={edges.up}
      nextFocusDown={edges.down}
      style={resolvedStyle}
    >
      {typeof children === "function" ? children({ focused }) : children}
    </Component>
  );
}

type FocusEdges = Partial<Record<FocusDirection, number>>;
