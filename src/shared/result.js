// result shapes shared by every platform adapter's act()
export const ok = (detail) => ({ status: 'done', detail });
export const skipped = (detail) => ({ status: 'skipped', detail });
export const fail = (detail) => ({ status: 'failed', detail, url: location.href });
