import type { ComponentRef, RefObject } from "react";
import { createContext } from "react";
import { Pressable, View } from "react-native";
import type { FocusDirection } from "../constant";

/**
 * The instance type a Focusable's ref points at. Derived from Pressable's ref
 * (RN 0.88 keeps the host-element type private) so both the ref prop and
 * element methods like focus() type-check.
 */
export type CellElement = ComponentRef<typeof Pressable>;

/** The FocusGroup's container view; cell layouts are measured against it. */
export type GroupElement = ComponentRef<typeof View>;

export type NeighborRefs = Partial<
  Record<FocusDirection, RefObject<CellElement | null>>
>;

export interface FocusGroupApi {
  /** The highlighted cell, kept even while Android touch mode drops focus. */
  activeIndex: number | null;
  /** Stable ref for a cell index, created on first request. */
  getRef: (index: number) => RefObject<CellElement | null>;
  /** Refs of the neighbors in each direction; missing at a grid edge. */
  neighborRefs: (index: number) => NeighborRefs;
  /** Container view that cell layouts are measured relative to. */
  groupRef: RefObject<GroupElement | null>;
  /** Records a cell's box (relative to the group) after layout. */
  reportLayout: (
    index: number,
    rect: { x: number; y: number; width: number; height: number }
  ) => void;
  /** A cell received native focus (may redirect it to the active cell). */
  cellFocused: (index: number) => void;
  /** A cell lost native focus. */
  cellBlurred: () => void;
  /** Highlights a cell without moving native focus (e.g. it was tapped). */
  selectIndex: (index: number) => void;
  /** Highlights a cell and moves native focus to it when Android allows. */
  focusIndex: (index: number) => void;
}

export const FocusGroupContext = createContext<FocusGroupApi | null>(null);
