// Chart.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { createDB, loadJSONToIndexedDB } from '../scripts/db.js';
import loadSignalParamsFromLocalStorage from '../scripts/signal-handler.js';
import { transformSignal } from '../scripts/signal-handler.js';

const Chart = () => {
  // React state and refs
  const [inputSymbolName, setInputSymbolName] = useState('');
  const [outputSymbolName, setOutputSymbolName] = useState('');
  
  const chartRootRef = useRef(null);
  const container1Ref = useRef(null);
  const container2Ref = useRef(null);
  const inputLegendRef = useRef(null);
  const outputLegendRef = useRef(null);
  const loadingRef = useRef(null);
  
  // Refs for charts and series (not in state as they don't affect rendering)
  const inputChartRef = useRef(null);
  const outputChartRef = useRef(null);
  const inputAreaSeriesRef = useRef(null);
  const outputAreaSeriesRef = useRef(null);
  const dbRef = useRef(null);

  // Show loading indicator
  const showLoading = () => {
    console.log("Loading chart data...");
    if (loadingRef.current) {
      loadingRef.current.classList.remove('opacity-0');
      loadingRef.current.classList.remove('pointer-events-none');
    }
  };

  // Hide loading indicator
  const hideLoading = () => {
    console.log("Hiding loading indicator...");
    if (loadingRef.current) {
      loadingRef.current.classList.add('opacity-0');
      loadingRef.current.classList.add('pointer-events-none');
    }
  };

  // Format legend
  const formatLegend = (signalParams = {}) => {
    const { signalShape, amplitude, frequency, phase } = signalParams;
    
    const inputFormatters = {
      square: `f(t) = A ⋅ Π(t / T) = ${amplitude} ⋅ Π(t / ${frequency})`,
      triangle: `f(t) = A ⋅ Λ(t / 2T) = ${amplitude} ⋅ Λ(t / ${frequency})`,
      sinc: `f(t) = A ⋅ sinc(f₀ ⋅ t - ϕ) = A ⋅ sin(f₀ ⋅ πt - ϕ) / (f₀ ⋅ πt - ϕ) = ${amplitude} ⋅ sinc(${frequency} ⋅ t - ${phase})`,
      sin: `f(t) = A ⋅ sin(2π ⋅ f₀ ⋅ t + ϕ) = ${amplitude} ⋅ sin(2π ⋅ ${frequency} ⋅ t + ${phase})`,
      cos: `f(t) = A ⋅ cos(2π ⋅ f₀ ⋅ t + ϕ) = ${amplitude} ⋅ cos(2π ⋅ ${frequency} ⋅ t + ${phase})`,
      exp: `f(t) = ${amplitude}⋅exp(t)`
    };

    const outputFormatters = {
      square: `abs(FFT(f(t))) = A ⋅ T ⋅ sinc(T ⋅ f) = ${amplitude} ⋅ ${frequency} ⋅ sinc(${frequency} ⋅ f)`,
      triangle: `abs(FFT(f(t))) = A ⋅ T ⋅ sinc²(T ⋅ f) = ${amplitude} ⋅ ${frequency} ⋅ sinc²(${frequency} ⋅ f)`,
      sinc: `abs(FFT(f(t))) = A ⋅ Π(f / f₀) = ${amplitude} ⋅ Π(f / ${frequency})`,
      cos: `abs(FFT(f(t))) = A ⋅ ½[𝛿(f - f₀) + 𝛿(f + f₀)] = ${amplitude} ⋅ ½[𝛿(f - ${frequency}) + 𝛿(f + ${frequency})]`,
      sin: `abs(FFT(f(t))) = 0`,
    };

    return {
      inputSymbolName: inputFormatters[signalShape] || `f(t)`,
      outputSymbolName: outputFormatters[signalShape] || `re(FFT(f(t)))`
    };
  };

  // Function to get data from IndexedDB
  const getDataFromIndexedDB = async (frequencyLimit) => {
    const inputSignal = [];
    const outputSignal = [];

    if (dbRef.current) {
      const data = await dbRef.current.signals.toArray();
      data.forEach((row) => {
        outputSignal.push({
          time: parseFloat(row.Freq),
          value: parseFloat(row["abs(FFT)"]),
        });
        inputSignal.push({
          time: parseFloat(row.input),
          value: parseFloat(row["re(signal)"]),
        });
      });
    }

    const outputSignalSliced = outputSignal.filter(point =>
      point.time >= -frequencyLimit && point.time <= frequencyLimit
    );

    return {
      inputSignal,
      outputSignal,
      outputSignalSliced
    };
  };

  // Format tooltip HTML
  const setTooltipHtml = (legend, name, time, value) => {
    if (legend) {
      legend.innerHTML = `
        <div class="text-lg my-0">${name}</div>
        <div class="text-base my-0">${value}</div>
        <div class="text-sm my-0">${time}</div>
      `;
    }
  };

  // Format price for display
  const formatPrice = (price) => (Math.round(price * 100) / 100).toFixed(2);

  // Get the last bar for a series
  const getLastBar = (series) => {
    const lastIndex = series.dataByIndex(Infinity, -1);
    return series.dataByIndex(lastIndex);
  };

  // Update legend for input chart
  const inputUpdateLegend = (param) => {
    if (!inputAreaSeriesRef.current || !inputLegendRef.current) return;

    const validCrosshairPoint = !(
      param === undefined || param.time === undefined || param.point?.x < 0 || param.point?.y < 0
    );
    
    const bar = validCrosshairPoint 
      ? param.seriesData.get(inputAreaSeriesRef.current) 
      : getLastBar(inputAreaSeriesRef.current);
    
    if (!bar) return;
    
    const time = bar.time;
    const price = bar.value !== undefined ? bar.value : bar.close;
    const formattedPrice = formatPrice(price);
    
    setTooltipHtml(inputLegendRef.current, inputSymbolName, time, formattedPrice);
  };

  // Update legend for output chart
  const outputUpdateLegend = (param) => {
    if (!outputAreaSeriesRef.current || !outputLegendRef.current) return;

    const validCrosshairPoint = !(
      param === undefined || param.time === undefined || param.point?.x < 0 || param.point?.y < 0
    );
    
    const bar = validCrosshairPoint 
      ? param.seriesData.get(outputAreaSeriesRef.current) 
      : getLastBar(outputAreaSeriesRef.current);
    
    if (!bar) return;
    
    const time = bar.time;
    const price = bar.value !== undefined ? bar.value : bar.close;
    const formattedPrice = formatPrice(price);
    
    setTooltipHtml(outputLegendRef.current, outputSymbolName, time, formattedPrice);
  };

  // Update chart data - this gets exposed to window
  const updateChartData = async (signalParams = {}) => {
    try {
      showLoading();
      
      // Update legend names
      const { inputSymbolName: newInputName, outputSymbolName: newOutputName } = formatLegend(signalParams);
      setInputSymbolName(newInputName);
      setOutputSymbolName(newOutputName);

      // Get new data
      const frequencyLimit = parseInt(signalParams.freqrange);
      const { inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit);
      
      // Update chart series
      if (inputAreaSeriesRef.current) {
        inputAreaSeriesRef.current.setData(inputSignal);
      }
      if (outputAreaSeriesRef.current) {
        outputAreaSeriesRef.current.setData(outputSignalSliced);
      }
      
      // Update legends
      inputUpdateLegend(undefined);
      outputUpdateLegend(undefined);

      // Fit content
      if (inputChartRef.current) {
        inputChartRef.current.timeScale().fitContent();
      }
      if (outputChartRef.current) {
        outputChartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    } finally {
      hideLoading();
    }
  };

  // Initialize charts and data
  useEffect(() => {
    // Show loading initially
    showLoading();

    // Expose functions to window
    window.showChartLoading = showLoading;
    window.updateChartData = updateChartData;

    // Initialize DB and load initial data
    const initializeCharts = async () => {
      try {
        // Create database
        dbRef.current = await createDB();
        
        // Get initial parameters
        const signalParams = loadSignalParamsFromLocalStorage();
        
        // Get legend labels
        const { inputSymbolName: initialInput, outputSymbolName: initialOutput } = formatLegend(signalParams);
        setInputSymbolName(initialInput);
        setOutputSymbolName(initialOutput);
        
        // Create charts
        const chartOptions = {
          width: 800,
          height: 300,
          layout: {
            textColor: 'white',
            background: { color: '#171717' },
            attributionLogo: false,
          },
          localization: {
            timeFormatter: time => time.toString(),
          },
        };
        
        const optionsToApply = {
          autoScale: true,
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

        // Create input chart
        if (container1Ref.current) {
          const inputChart = createChart(container1Ref.current, chartOptions);
          inputChart.applyOptions(optionsToApply);
          const inputAreaSeries = inputChart.addAreaSeries({
            topColor: '#d5b8f9',
            bottomColor: 'rgba(213, 184, 249, 0.5)',
            lineColor: '#d5b8f9',
            lineWidth: 2,
            priceLineVisible: false,
          });
          
          inputChartRef.current = inputChart;
          inputAreaSeriesRef.current = inputAreaSeries;
          
          // Configure time scale
          inputChart.timeScale().applyOptions({
            minBarSpacing: 0.1,
            fixLeftEdge: true,
            fixRightEdge: true,
            timeVisible: true,
            tickMarkFormatter: time => time.toString(),
          });
          
          // Subscribe to crosshair move
          inputChart.subscribeCrosshairMove(inputUpdateLegend);
        }
        
        // Create output chart
        if (container2Ref.current) {
          const outputChart = createChart(container2Ref.current, chartOptions);
          outputChart.applyOptions(optionsToApply);
          const outputAreaSeries = outputChart.addAreaSeries({
            topColor: '#d5b8f9',
            bottomColor: 'rgba(143, 67, 234, 0.33)',
            lineColor: '#d5b8f9',
            lineWidth: 2,
            priceLineVisible: false,
          });
          
          outputChartRef.current = outputChart;
          outputAreaSeriesRef.current = outputAreaSeries;
          
          // Configure time scale
          outputChart.timeScale().applyOptions({
            minBarSpacing: 0.1,
            fixLeftEdge: true,
            fixRightEdge: true,
            timeVisible: true,
            tickMarkFormatter: time => time.toString(),
          });
          
          // Subscribe to crosshair move
          outputChart.subscribeCrosshairMove(outputUpdateLegend);
        }
        
        // Load initial data
        const frequencyLimit = parseInt(signalParams.freqrange);
        let { inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit);
        
        // Poll until data is available
        while (!inputSignal.length && !outputSignalSliced.length) {
          console.log("No data available yet, waiting 1000ms...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const response = await fetch('https://srv785333.hstgr.cloud/execute-fft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signalParams)
            });
            
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // This is where you read the JSON response returned by the server.
            const fftData = await response.json();
            console.log("Received FFT JSON:", fftData);
            await loadJSONToIndexedDB(fftData);            
        } catch (error) {
            console.error('Error executing FFT:', error);
            alert('Error executing FFT');
        }
    
          ({ inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit));
        }
        
        console.log("Data loaded, updating charts");
        
        // Set data to series
        if (inputAreaSeriesRef.current) {
          inputAreaSeriesRef.current.setData(inputSignal);
        }
        if (outputAreaSeriesRef.current) {
          outputAreaSeriesRef.current.setData(outputSignalSliced);
        }
        
        // Update legends
        inputUpdateLegend(undefined);
        outputUpdateLegend(undefined);
        
        // Fit content
        if (inputChartRef.current) {
          inputChartRef.current.timeScale().fitContent();
        }
        if (outputChartRef.current) {
          outputChartRef.current.timeScale().fitContent();
        }
        
        // Hide loading indicator
        hideLoading();
      } catch (error) {
        console.error("Error initializing charts:", error);
        hideLoading();
      }
    };
    
    initializeCharts();
    
    // Cleanup on unmount
    return () => {
      if (inputChartRef.current) {
        inputChartRef.current.remove();
      }
      if (outputChartRef.current) {
        outputChartRef.current.remove();
      }
      window.showChartLoading = undefined;
      window.updateChartData = undefined;
    };
  }, []); // Empty dependency array = run once on mount

  return (
    <div id="chart-root" className="relative" ref={chartRootRef}>
      {/* Loading overlay */}
      <div 
        id="chart-loading" 
        ref={loadingRef}
        className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-20 transition-opacity duration-300"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-purple-500 border-purple-200/30 rounded-full animate-spin"></div>
          <p className="text-white font-medium">Loading chart data...</p>
        </div>
      </div>
      
      {/* Input chart container */}
      <div 
        id="container1" 
        ref={container1Ref}
        className="my-10 flex mx-auto w-[800px] h-[300px] justify-center relative"
      >
        <div 
          id="inputLegend" 
          ref={inputLegendRef}
          className="absolute left-0 transform z-10 text-sm font-sans font-light text-white"
        ></div>
      </div>
      
      {/* Output chart container */}
      <div 
        id="container2" 
        ref={container2Ref}
        className="flex mx-auto w-[800px] h-[300px] justify-center relative"
      >
        <div 
          id="outputLegend" 
          ref={outputLegendRef}
          className="absolute left-0 transform z-10 text-sm font-sans font-light text-white"
        ></div>
      </div>
    </div>
  );
};

export default Chart;
