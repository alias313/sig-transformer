import { useRef, useEffect, useCallback } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';

const renderMathJax = (element) => {
    if (window.MathJax && element) {
        try {
            if (window.MathJax.typeset) {
                window.MathJax.typeset([element]);
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, element]);
            } else {
                console.warn("MathJax typeset method not found");
            }
        } catch (error) {
            console.error('Error triggering MathJax:', error);
        }
    }
};

const setTooltipHtml = (legend, name, time, value) => {
  if (legend) {
    legend.innerHTML = `
      <div class="mathjax-formula text-base md:text-lg my-0">${name}</div>
      <div class="text-sm md:text-base my-0">${value}</div>
      <div class="test-xs md:text-sm my-0">${time}</div>
      `;
      requestAnimationFrame(() => renderMathJax(legend));
  }
};

const formatPrice = (price) => price.toFixed(3);

const getLastBar = (series) => {
  if (!series) return null;
  const data = series.data();
  return data.length > 0 ? data[data.length - 1] : null;
};

export function useLightweightChart(
  containerRef,
  legendRef,
  symbolNameRef,
  chartOptions,
  seriesOptions,
) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const updateLegend = useCallback(
    (param) => {
      if (!seriesRef.current || !legendRef.current || !symbolNameRef.current)
        return;

      const validCrosshairPoint = !(
        param === undefined ||
        param.time === undefined ||
        param.point?.x < 0 ||
        param.point?.y < 0
      );

      let bar = null;
      if (validCrosshairPoint) {
        if (param.seriesData && param.seriesData.has(seriesRef.current)) {
          bar = param.seriesData.get(seriesRef.current);
        } else {
          console.warn('Could not get series data from crosshair event. Falling back to last bar.');
          bar = getLastBar(seriesRef.current);
        }
      } else {
        bar = getLastBar(seriesRef.current);
      }

      if (!bar) return;

      const time = bar.time ?? 'N/A';
      const price = bar.value ?? bar.close ?? 0;
      const formattedPrice = formatPrice(price);
      const symbolName = symbolNameRef.current;

      setTooltipHtml(
        legendRef.current,
        symbolName,
        time.toString(),
        formattedPrice,
      );
    },
    [legendRef, symbolNameRef],
  );

  useEffect(() => {
    let chart;
    if (!containerRef.current) return;

    chart = createChart(containerRef.current, chartOptions);
    const series = chart.addSeries(AreaSeries, seriesOptions);

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove(updateLegend);

    updateLegend(undefined);

    return () => {
      if (chart) {
        chart.unsubscribeCrosshairMove(updateLegend);
        chart.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [containerRef, JSON.stringify(chartOptions), JSON.stringify(seriesOptions), updateLegend]);

  const setData = useCallback((data) => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
      requestAnimationFrame(() => updateLegend(undefined));
    }
  }, [updateLegend]);

  const fitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  return { setData, fitContent, updateLegend };
}
