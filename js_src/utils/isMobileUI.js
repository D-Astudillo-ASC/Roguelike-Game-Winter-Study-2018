// TODO: Sync this with CSS definitions.
export function isMobileUI() {
  const mq = window.matchMedia("(max-width: 1024px)");
  return mq.matches;
}
