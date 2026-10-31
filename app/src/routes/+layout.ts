// Client only: every screen shows what is saved on this device, so there is
// nothing useful to render ahead of time. The static build serves the fallback page
// (vite.config.ts).
export const ssr = false;
export const prerender = false;
