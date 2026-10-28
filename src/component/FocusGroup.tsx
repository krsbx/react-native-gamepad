import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { DIRECTIONS } from "../constant";
import type {
  CellElement,
  FocusGroupApi,
  GroupElement,
  NeighborRefs,
} from "./context";
import { FocusGroupContext } from "./context";
import { createFocusTracker } from "./focusTracker";
import type { CellRect } from "./graph";
import { gridNeighbors, spatialNeighbors } from "./graph";

export interface FocusGroupProps {
  /**
   * Row-major column count, used only until cells have been laid out. After
   * that, neighbors come from the cells' measured positions, so wrapped and
   * centered rows navigate the way they look.
   */
  columns?: number;
  /** Total number of focusable cells, for edge clamping. */
  count: number;
  /** Called when the highlighted cell changes (by D-pad focus or a tap). */
  onFocusedIndexChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Rail 1 focus group: owns one stable ref per cell index and computes the
 * deterministic focus graph from the cells' laid-out geometry. The OS still
 * performs D-pad focus movement and confirm-key clicks — this component only
 * wires the graph and the selection callbacks.
 *
 * The highlighted cell lives here rather than in native focus, because
 * Android drops native focus whenever the user touches the screen.
 */
export function FocusGroup({
  columns,
  count,
  onFocusedIndexChange,
  style,
  children,
}: FocusGroupProps) {
  const refs = useRef(new Map<number, RefObject<CellElement | null>>());
  const groupRef = useRef<GroupElement | null>(null);
  const rects = useRef<(CellRect | undefined)[]>([]);
  const changeRef = useRef(onFocusedIndexChange);
  // Bumped (at most once per frame) when cell boxes change, so cells
  // recompute their nextFocus edges.
  const [layoutVersion, setLayoutVersion] = useState(0);
  const pendingFrame = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tracker] = useState(() =>
    createFocusTracker({
      onActiveChange: (index) => {
        setActiveIndex(index);
        changeRef.current?.(index);
      },
    })
  );

  useEffect(() => {
    changeRef.current = onFocusedIndexChange;
  }, [onFocusedIndexChange]);

  useEffect(
    () => () => {
      if (pendingFrame.current != null) {
        cancelAnimationFrame(pendingFrame.current);
      }
      tracker.dispose();
    },
    [tracker]
  );

  const getRef = useCallback((index: number): RefObject<CellElement | null> => {
    let ref = refs.current.get(index);
    if (ref == null) {
      ref = { current: null };
      refs.current.set(index, ref);
    }
    return ref;
  }, []);

  const reportLayout = useCallback((index: number, rect: CellRect) => {
    const prev = rects.current[index];
    if (
      prev != null &&
      prev.x === rect.x &&
      prev.y === rect.y &&
      prev.width === rect.width &&
      prev.height === rect.height
    ) {
      return;
    }

    rects.current[index] = rect;

    if (pendingFrame.current == null) {
      pendingFrame.current = requestAnimationFrame(() => {
        pendingFrame.current = null;
        setLayoutVersion((v) => v + 1);
      });
    }
  }, []);

  const neighborRefs = useCallback(
    (index: number): NeighborRefs => {
      const measured = rects.current.slice(0, count);
      const neighbors =
        measured[index] != null
          ? spatialNeighbors(index, measured)
          : columns != null
            ? gridNeighbors(index, columns, count)
            : null;
      const result: NeighborRefs = {};

      if (neighbors == null) return result;

      for (const direction of DIRECTIONS) {
        const neighbor = neighbors[direction];

        if (neighbor != null) {
          result[direction] = getRef(neighbor);
        }
      }

      return result;
    },
    // layoutVersion: rects live in a ref, so re-create when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, count, getRef, layoutVersion]
  );

  const cellFocused = useCallback(
    (index: number) => {
      const redirect = tracker.focus(
        index,
        (target) => getRef(target).current != null
      );
      if (redirect != null) {
        getRef(redirect).current?.focus();
      }
    },
    [getRef, tracker]
  );

  const focusIndex = useCallback(
    (index: number) => {
      // Highlight even if Android refuses native focus (touch mode).
      tracker.select(index);
      getRef(index).current?.focus();
    },
    [getRef, tracker]
  );

  const api = useMemo<FocusGroupApi>(
    () => ({
      activeIndex,
      getRef,
      neighborRefs,
      groupRef,
      reportLayout,
      cellFocused,
      cellBlurred: tracker.blur,
      selectIndex: tracker.select,
      focusIndex,
    }),
    [
      activeIndex,
      getRef,
      neighborRefs,
      reportLayout,
      cellFocused,
      tracker,
      focusIndex,
    ]
  );

  return (
    <FocusGroupContext.Provider value={api}>
      <View ref={groupRef} style={[styles.group, style]}>
        {children}
      </View>
    </FocusGroupContext.Provider>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
