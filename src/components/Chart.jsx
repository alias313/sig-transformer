// Chart.jsx (or Chart.tsx)
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const Chart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const inputAreaSeriesRef = useRef(null);
  const outputAreaSeriesRef = useRef(null);
  const inputLegendRef = useRef(null);
  const outputLegendRef = useRef(null);

  useEffect(() => {
    console.log("useEffect is running!"); // Add this line	
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const chartOptions = {
      width: 800,
      height: 300,
      layout: {
        textColor: 'white',
        background: { color: '#13151a' },
      },
    };
    const optionsToApply = {
      rightPriceScale: {
        scaleMargins: {
          top: 0.4,
          bottom: 0.15,
        },
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
    };

    const inputChart = createChart(chartContainer.querySelector('#container1'), chartOptions);
    inputChart.applyOptions(optionsToApply);
    const inputAreaSeries = inputChart.addAreaSeries({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(213, 184, 249, 0.5)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const outputChart = createChart(chartContainer.querySelector('#container2'), chartOptions);
    outputChart.applyOptions(optionsToApply);
    const outputAreaSeries = outputChart.addAreaSeries({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(143, 67, 234, 0.33)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const inputExpression = "f(t)=1*sinc(2π*f*t)";
    const outputExpression = "FFT(f(t))";

    const inputContainer = chartContainer.querySelector('#container1');
    const inputLegend = document.createElement('div');
    inputLegend.style = `position: absolute; left: 250px; top: 0px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
    inputLegend.style.color = 'white';
    inputContainer.appendChild(inputLegend);

    const outputContainer = chartContainer.querySelector('#container2');
    const outputLegend = document.createElement('div');
    outputLegend.style = `position: absolute; left: 250px; top: 0px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
    outputLegend.style.color = 'white';
    outputContainer.appendChild(outputLegend);

    const inputSetTooltipHtml = (name, time, value) => {
      inputLegend.innerHTML = `<div style="font-size: 24px; margin: 4px 0px;">${name}</div><div style="font-size: 22px; margin: 4px 0px;">${value}</div><div>${time}</div>`;
    };

    const outputSetTooltipHtml = (name, time, value) => {
      outputLegend.innerHTML = `<div style="font-size: 24px; margin: 4px 0px;">${name}</div><div style="font-size: 22px; margin: 4px 0px;">${value}</div><div>${time}</div>`;
    };

    const getLastBar = series => {
      const lastIndex = series.dataByIndex(Infinity, -1);
      return series.dataByIndex(lastIndex);
    };

    const formatPrice = price => (Math.round(price * 100) / 100).toFixed(2);

    const inputUpdateLegend = param => {
      const validCrosshairPoint = !(
        param === undefined || param.time === undefined || param.point.x < 0 || param.point.y < 0
      );
      const bar = validCrosshairPoint ? param.seriesData.get(inputAreaSeries) : getLastBar(inputAreaSeries);
      const time = bar.time;
      const price = bar.value !== undefined ? bar.value : bar.close;
      const formattedPrice = formatPrice(price);
      inputSetTooltipHtml(inputExpression, time, formattedPrice);
    };

    const outputUpdateLegend = param => {
      const validCrosshairPoint = !(
        param === undefined || param.time === undefined || param.point.x < 0 || param.point.y < 0
      );
      const bar = validCrosshairPoint ? param.seriesData.get(outputAreaSeries) : getLastBar(outputAreaSeries);
      const time = bar.time;
      const price = bar.value !== undefined ? bar.value : bar.close;
      const formattedPrice = formatPrice(price);
      outputSetTooltipHtml(outputExpression, time, formattedPrice);
    };

    inputChart.subscribeCrosshairMove(inputUpdateLegend);
    outputChart.subscribeCrosshairMove(outputUpdateLegend);

    inputUpdateLegend(undefined);
    outputUpdateLegend(undefined);

    inputChart.timeScale().applyOptions({
      minBarSpacing: 0.1,
      fixLeftEdge: true,
      fixRightEdge: true,
      timeVisible: true,
    });

    outputChart.timeScale().applyOptions({
      minBarSpacing: 0.1,
      fixLeftEdge: true,
      fixRightEdge: true,
      timeVisible: true,
    });

    inputChart.timeScale().fitContent();
    outputChart.timeScale().fitContent();

    chartRef.current = { inputChart, outputChart };
    inputAreaSeriesRef.current = inputAreaSeries;
    outputAreaSeriesRef.current = outputAreaSeries;
    inputLegendRef.current = inputLegend;
    outputLegendRef.current = outputLegend;

    // Initial data load (optional)
    loadInitialData();

    async function loadInitialData() {
      const response = await fetch(`/api/generate-signal?a=-10&b=10&signalType=square&amplitude=1&frequency=1&phase=0&interval=0.01`);
      if (response.ok) {
        const data = await response.json();
        const chartData = JSON.parse(data.data);
        updateCharts(chartData);
      } else {
        console.error('Error loading initial data');
      }
    }

    // Listen for the custom event
    document.addEventListener('update-chart', (event) => {
      const chartData = event.detail;
      updateCharts(chartData);
    });

    function updateCharts(chartData) {
      // Assuming chartData has 'inputSignal' and 'outputSignalSliced' properties
      inputAreaSeriesRef.current.setData(chartData.inputSignal);
      outputAreaSeriesRef.current.setData(chartData.outputSignalSliced);

      // Redraw the charts
      chartRef.current.inputChart.timeScale().fitContent();
      chartRef.current.outputChart.timeScale().fitContent();
    }

    return () => {
      document.removeEventListener('update-chart', (event) => {
        const chartData = event.detail;
        updateCharts(chartData);
      });
    }
  }, []);

  return (
    <div ref={chartContainerRef}>
	  <h1>React Chart Component</h1> {/* Add this line */}
      <div className="signal-input">
        <input type="text" placeholder="Asquare(t/T)" /><br />
      </div>
      <div id="container1"></div>
      <div id="container2"></div>
    </div>
  );
};

export default Chart;

