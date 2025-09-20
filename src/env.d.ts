/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.astro' {
  const Component: any;
  export default Component;
}
declare function showChartLoading(): void;
declare function hideChartLoading(): void;
declare function updateChartData(): void;
