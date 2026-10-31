// Where a unit opens: on the Overview until there is something earned to show.

import { resolve } from '$app/paths';

export function unitHref(packId: string, unitId: string, started: boolean): string {
	const params = { pack: packId, unit: unitId };
	return started
		? resolve('/unit/[pack]/[unit]', params)
		: resolve('/unit/[pack]/[unit]/overview', params);
}
