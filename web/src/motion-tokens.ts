export const motionTokens = {
  duration: { instant: .08, fast: .18, normal: .35, slow: .6, crawl: 1 },
  easing: { smooth: [.22, 1, .36, 1] as const, sharp: [.4, 0, .2, 1] as const },
  distance: { xs: 4, sm: 8, md: 16, lg: 24 },
  scale: { subtle: .98, press: .95, pop: 1.04 },
};
export const springs = {
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 10 },
  instant: { type: 'spring' as const, stiffness: 600, damping: 35 },
  release: { type: 'spring' as const, stiffness: 200, damping: 20, restDelta: .001 },
};
export function shouldAnimate(essential = false) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return essential || typeof navigator === 'undefined' || navigator.hardwareConcurrency > 4;
}
