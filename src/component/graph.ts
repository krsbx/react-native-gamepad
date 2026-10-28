export interface GridNeighbors {
  left: number | null;
  right: number | null;
  up: number | null;
  down: number | null;
}

/**
 * Deterministic neighbor indexes for a row-major grid. Clamps at row edges
 * (no wrapping) and never navigates into indexes beyond `count`.
 */
export function gridNeighbors(
  index: number,
  columns: number,
  count: number
): GridNeighbors {
  if (index < 0 || index >= count || columns <= 0) {
    return { left: null, right: null, up: null, down: null };
  }
  const inFirstColumn = index % columns === 0;
  const inLastColumn = (index % columns) + 1 === columns;
  return {
    left: inFirstColumn ? null : index - 1,
    right: inLastColumn || index + 1 >= count ? null : index + 1,
    up: index - columns >= 0 ? index - columns : null,
    down: index + columns < count ? index + columns : null,
  };
}

/** A cell's laid-out box, relative to its FocusGroup. */
export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Neighbor indexes from the cells' actual on-screen boxes, so wrapped or
 * centered rows (where index ± columns doesn't line up visually) still move
 * to the cell the user sees in that direction.
 *
 * Up/down: the nearest row in that direction, then the cell in it whose
 * horizontal center is closest. Left/right: the nearest cell in the same row.
 * Ties go to the lower index. Unmeasured cells are skipped; a direction with
 * no candidate is null (edge).
 */
export function spatialNeighbors(
  index: number,
  rects: readonly (CellRect | undefined)[]
): GridNeighbors {
  const none: GridNeighbors = { left: null, right: null, up: null, down: null };
  const current = rects[index];
  if (current == null) {
    return none;
  }
  const cx = current.x + current.width / 2;
  const cy = current.y + current.height / 2;
  // Two centers within half a cell height of each other share a row.
  const rowTolerance = current.height / 2;

  const cells: { index: number; cx: number; cy: number }[] = [];
  rects.forEach((rect, i) => {
    if (rect != null && i !== index) {
      cells.push({
        index: i,
        cx: rect.x + rect.width / 2,
        cy: rect.y + rect.height / 2,
      });
    }
  });

  const vertical = (sign: 1 | -1): number | null => {
    const ahead = cells.filter((c) => (c.cy - cy) * sign > rowTolerance);
    if (ahead.length === 0) {
      return null;
    }
    const rowCy = ahead.reduce((best, c) =>
      Math.abs(c.cy - cy) < Math.abs(best.cy - cy) ? c : best
    ).cy;
    return closest(
      ahead.filter((c) => Math.abs(c.cy - rowCy) <= rowTolerance),
      (c) => Math.abs(c.cx - cx)
    );
  };

  const horizontal = (sign: 1 | -1): number | null =>
    closest(
      cells.filter(
        (c) => Math.abs(c.cy - cy) <= rowTolerance && (c.cx - cx) * sign > 0
      ),
      (c) => Math.abs(c.cx - cx)
    );

  return {
    left: horizontal(-1),
    right: horizontal(1),
    up: vertical(-1),
    down: vertical(1),
  };
}

function closest<T extends { index: number }>(
  items: T[],
  distance: (item: T) => number
): number | null {
  let best: T | null = null;
  for (const item of items) {
    if (
      best == null ||
      distance(item) < distance(best) ||
      (distance(item) === distance(best) && item.index < best.index)
    ) {
      best = item;
    }
  }
  return best?.index ?? null;
}
