import { useCallback, useContext } from "react";
import { FocusGroupContext } from "./context";

/**
 * Programmatic focus within the nearest FocusGroup (for focus memory when
 * returning to a screen).
 */
export function useFocus(): { focus: (index: number) => void } {
  const group = useContext(FocusGroupContext);
  const focus = useCallback(
    (index: number) => {
      group?.focusIndex(index);
    },
    [group]
  );

  return { focus };
}
