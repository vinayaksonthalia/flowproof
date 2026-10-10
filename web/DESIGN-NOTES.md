# FlowProof design notes

The direction is an editorial scientific workbench: warm paper, fine graphite rules, restrained moss accents, amber field annotations, serif question headings, and monospace measurement labels. The audience is someone doing one physical experiment, so Start appears in the first viewport with the supplies immediately nearby. The result is an observation with an experiment receipt.

The original SVG pairs two vessels marked A/B. Empty vessels introduce the experiment; the measurement screen fills them as the user enters totals, and the accepted receipt reveals the final comparison. It uses a clearly labeled **relative 0-to-larger-entered-total scale across all fills**, rather than implying a physical jug of that capacity. Numeric labels and the caption say these values were entered by the user. The drawing never models water flow, calculates litres per second, or invents a result. Equal fixed-volume trials show matching levels and zero difference.

Measurement is now a guided A/B recorder. One trial appears at a time, with a built-in timer, full-vessel counter, last partial fill entry, derived total and direct-entry fallback. A short preparation strip tells the user to catch all water in a basin before pouring it into the marked vessel. The second trial remains accessible from the segmented controls; a running timer blocks switching. The public receipt shows each capture method and the tally arithmetic.

Motion uses `motion/react` with shared tokens in `src/motion-tokens.ts`. Short step entrances preserve workflow continuity, an opacity pulse indicates a pending server validation, and the measured vessels and difference reveal draw attention to the returned observation. Transforms and opacity are the only animated properties. Reduced motion removes animated transforms and repetitive motion, using fades of 180 ms or less. Nonessential vessel animation is suppressed on devices reporting four or fewer hardware threads. Heading focus follows a step change; status/error messages remain available to assistive technology. The app is client rendered with Vite, and no server hydration is involved.

References consulted:

- [Motion useReducedMotion](https://motion.dev/docs/react-use-reduced-motion): adapt behavior to the operating system preference rather than merely making the same movement slower.
- [MotionConfig](https://motion.dev/docs/react-motion-config): provide a tree-wide reduced-motion policy in addition to explicit transform gating.
- [Motion component](https://motion.dev/docs/react-motion-component): use declarative transform/opacity animation for state changes.
- [Carbon progress indicator guidance](https://www.carbondesignsystem.com/building-blocks/core/components/progress-indicator/guidelines): keep progress visible and label the current and completed stages. FlowProof uses labels, numerals, and completion marks rather than color alone.

Assets: the drop mark and vessel diagrams are original inline SVG created for this project. No stock photographs or external illustration assets are used. Google Fonts supplies DM Sans and Manrope with system fallbacks; headings also use the installed Georgia serif. `motion` is the sole added runtime dependency for this pass.

Verification: TypeScript and Vite production build pass. Main path copy is compressed; exported receipt text retains the full limits on self-reporting, verification, and extrapolation. API request and saved-receipt retrieval contracts are unchanged.

Quality review fixes: method selectors are native radio inputs; switching methods resets their task defaults and trial entries. Each completed-task trial captures item count and a finish-line confirmation. Spillage displays an immediate repeat warning. Setup and measurement support Enter submission; clipboard feedback is independent for links and text. The Compare disclosure explains seven-day retention and access by receipt link.
