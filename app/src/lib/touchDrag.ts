// Where a dragged slip aims, and when a press is a tap. Copied from Geoclick2027
// (9b449cc).
//
// A finger hides what is under it, and a drop counts where it lands, so on a
// touch screen the drop point sits a fingertip above the finger. Near the top of
// the screen there is no room above, so it goes below the finger instead. A mouse
// pointer hides nothing and aims where it points.
//
// Pure: QuizView owns the pointer events and the hit-testing.

/** How far above the finger the drop point sits, in CSS px: about a fingertip. */
export const TOUCH_LIFT_PX = 48;

/** How far a press may wander and still count as a tap rather than a drag. */
export const TAP_SLOP_PX = 8;

/** The drop point for a pointer at (x, y), in the same viewport coordinates. */
export function aimPoint(x: number, y: number, touch: boolean): { x: number; y: number } {
	if (!touch) return { x, y };
	const above = y - TOUCH_LIFT_PX;
	return { x, y: above >= 0 ? above : y + TOUCH_LIFT_PX };
}

/** Whether a press that started at (x0, y0) and is now at (x, y) has become a
 * drag. */
export function movedPastSlop(x0: number, y0: number, x: number, y: number): boolean {
	return Math.hypot(x - x0, y - y0) > TAP_SLOP_PX;
}
