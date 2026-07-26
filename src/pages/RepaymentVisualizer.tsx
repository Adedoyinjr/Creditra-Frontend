/**
 * Page re-export for the RepaymentVisualizer route module.
 *
 * The canonical implementation (including the first-paint skeleton) lives in
 * `src/components/RepaymentVisualizer.tsx`. This module re-exports the public
 * surface so route-level imports and GrantFox issue paths stay stable.
 */
export {
  RepaymentVisualizer,
  RepaymentVisualizerSkeleton,
} from "@/components/RepaymentVisualizer";
export type {
  RepaymentVisualizerProps,
  ScheduleRow,
} from "@/components/RepaymentVisualizer";
export { RepaymentVisualizer as default } from "@/components/RepaymentVisualizer";
