import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import { createDB } from '@/scripts/db.js';
import { loadSignalParamsFromLocalStorage, fetchSignal } from '@/scripts/signal-handler.js';

import {
    Tabs,
    TabsList,
    TabsTrigger,
  } from '@/components/ui/tabs';

  const renderMathJax = (element) => {
    if (window.MathJax && element) {
        try {
            // Use the correct MathJax API method
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

const Chart = () => {
  const chartRootRef = useRef(null);
  const container1Ref = useRef(null);
  const container2Ref = useRef(null);

  const inputLegendRef = useRef(null);
  const outputLegendRef = useRef(null);
  const inputSymbolNameRef = useRef('');
  const outputSymbolNameRef = useRef('');

  const [outputDataType, setOutputDataType] = useState('modulus');
  
  const inputChartRef = useRef(null);
  const outputChartRef = useRef(null);
  const inputAreaSeriesRef = useRef(null);
  const outputAreaSeriesRef = useRef(null);
  const dbRef = useRef(null);

  const formatLegend = (signalParams = {}, outputType) => {
    const { b, signalShape, amplitude, frequency, phase } = signalParams;
    
    let inputFormatters = {
      square: `$f(t) = A \\cdot  \\Pi (t / T) = ${amplitude} \\cdot  \\Pi (t / ${frequency})$`,
      triangle: `$f(t) = A \\cdot  \\Lambda (t / 2T) = ${amplitude} \\cdot  \\Lambda (t / ${frequency})$`,
      sinc: `$f(t) = A \\cdot \\text{sinc}(f_0t - \\varphi ) = A \\cdot \\frac{\\sin(f_0 \\pi t - \\varphi )}{f_0 \\pi t - \\varphi } = ${amplitude} \\cdot \\text{sinc}(${frequency}t - ${phase})$`,
      sin: `$f(t) = A \\cdot  \\sin(2\\pi f_0t + \\varphi ) = ${amplitude} \\cdot  \\sin(2\\pi \\cdot ${frequency}t + ${phase})$`,
      cos: `$f(t) = A \\cdot  cos(2\\pi f_0t + \\varphi ) = ${amplitude} \\cdot  cos(2\\pi \\cdot ${frequency}t + ${phase})$`,
      exp: `$f(t) = ${amplitude}\\cdot \\exp(t)$`
    };

    let outputFormatters = {
      square: `$|\\mathcal{F}| = |A| \\cdot  T|\\text{sinc}(Tf)| = ${Math.abs(amplitude)} \\cdot ${frequency} \\cdot |\\text{sinc}(${frequency}f)|$`,
      triangle: `$|\\mathcal{F}| = |A| \\cdot  T\\text{sinc}^2(Tf) = ${Math.abs(amplitude)} \\cdot ${frequency} \\cdot \\text{sinc}^2(${frequency}f)$`,
      sinc: `$|\\mathcal{F}| = |A| \\cdot  \\Pi (f / f_0) = ${Math.abs(amplitude)} \\cdot  \\Pi (f / ${frequency})$`,
      cos: `$|\\mathcal{F}| = |A| \\cdot  \\frac{1}{2}[\\delta (f + f_0) + \\delta (f - f_0)] = ${Math.abs(amplitude)} \\cdot  \\frac{1}{2}[\\delta (f + ${frequency}) + \\delta (f - ${frequency})]$`,
      sin: `$|\\mathcal{F}| = |A| \\cdot  \\frac{1}{2}[\\delta (f + f_0) + \\delta (f - f_0)] = ${Math.abs(amplitude)} \\cdot  \\frac{1}{2}[\\delta (f + ${frequency}) + \\delta (f - ${frequency})]$`,
      exp: `$|\\mathcal{F}| = \\exp(${b}) \\cdot  \\frac{${Math.abs(amplitude)}}{f^2+1}$`
    };

    switch (outputType) {
        case 'real':
            outputFormatters = {
                square: `$\\Re(\\mathcal{F}) = A \\cdot  T\\text{sinc}(Tf) = ${amplitude} \\cdot  ${frequency} \\cdot  \\text{sinc}(${frequency}f)$`,
                triangle: `$\\Re(\\mathcal{F}) = A \\cdot  T\\text{sinc}^2(Tf) = ${amplitude} \\cdot  ${frequency} \\cdot  \\text{sinc}^2(${frequency}f)$`,
                sinc: `$\\Re(\\mathcal{F}) = A \\cdot  \\Pi(f / f_0) = ${amplitude} \\cdot  \\Pi(f / ${frequency})$`,
                cos: `$\\Re(\\mathcal{F}) = A \\cdot  \\frac{1}{2}[\\delta (f + f_0) + \\delta (f - f_0)] = ${amplitude} \\cdot  \\frac{1}{2}[\\delta (f + ${frequency}) + \\delta (f - ${frequency})]$`,
                sin: `$\\Re(\\mathcal{F}) = 0$`,
                exp: `$\\Re(\\mathcal{F})$`
            };
            break;
        case 'imaginary':
            outputFormatters = {
                square: `$\\Im(\\mathcal{F}) = 0$`,
                triangle: `$\\Im(\\mathcal{F}) = 0$`,
                sinc: `$\\Im(\\mathcal{F}) = 0$`,
                cos: `$\\Im(\\mathcal{F}) = 0$`,
                sin: `$\\Im(\\mathcal{F}) = A \\cdot  \\frac{1}{2}[\\delta (f + f_0) - \\delta (f - f_0)] = ${amplitude} \\cdot  \\frac{1}{2}[\\delta (f + ${frequency}) - \\delta (f - ${frequency})]$`,
                exp: `$\\Im(\\mathcal{F})$`
            };
            break;
    }
    
    return {
      inputSymbolName: inputFormatters[signalShape] || `f(t)`,
      outputSymbolName: outputFormatters[signalShape] || `re(FFT(f(t)))`
    };
  };

  const getDataFromIndexedDB = async (frequencyLimit, outputType) => {
    const inputSignal = [];
    const outputSignal = [];

    let outputFunction = 'abs'

    switch (outputType) {
      case 'real':
        outputFunction = 're';
        break;
      case 'imaginary':
        outputFunction = 'im';
        break;
      case 'modulus':
        outputFunction = 'abs';
        break;
      default:
        outputFunction = 'abs';
    }

    if (dbRef.current) {
      const data = await dbRef.current.signals.toArray();
      data.forEach((row) => {
        outputSignal.push({
          time: parseFloat(row.Freq),
          value: parseFloat(row[`${outputFunction}(FFT)`]),
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

  const setTooltipHtml = (legend, name, time, value) => {
    if (legend) {
      legend.innerHTML = `
        <div class="mathjax-formula text-base md:text-lg my-0">${name}</div>
        <div class="text-sm md:text-base my-0">${value}</div>
        <div class="test-xs md:text-sm my-0">${time}</div>
        `;
        setTimeout(() => renderMathJax(legend), 0);
    }

    renderMathJax(legend);
  };

  const formatPrice = (price) => price.toFixed(3);

  const getLastBar = (series) => {
    const lastIndex = series.dataByIndex(Infinity, -1);
    return series.dataByIndex(lastIndex);
  };

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
    
    setTooltipHtml(inputLegendRef.current, inputSymbolNameRef.current, time, formattedPrice);
  };

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
    
    setTooltipHtml(outputLegendRef.current, outputSymbolNameRef.current, time, formattedPrice);
  };

  const updateChartData = async (signalParams = {}) => {
    try {        
      const { inputSymbolName: newInputName, outputSymbolName: newOutputName } = formatLegend(signalParams);
      inputSymbolNameRef.current = newInputName;
      outputSymbolNameRef.current = newOutputName;

      const frequencyLimit = parseInt(signalParams.freqrange);
      const { inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit);
      
      if (inputAreaSeriesRef.current) {
        inputAreaSeriesRef.current.setData(inputSignal);
      }
      if (outputAreaSeriesRef.current) {
        outputAreaSeriesRef.current.setData(outputSignalSliced);
      }
      
      inputUpdateLegend(undefined);
      outputUpdateLegend(undefined);

      if (inputChartRef.current) {
        inputChartRef.current.timeScale().fitContent();
      }
      if (outputChartRef.current) {
        outputChartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    } finally {
      window.hideChartLoading();
    }
  };

  const updateOutputChartType = async (newOutputType) => {
    try {
      const signalParams = loadSignalParamsFromLocalStorage();
      const frequencyLimit = parseInt(signalParams.freqrange);

      const { outputSymbolName: newOutputName } = formatLegend(
        signalParams,
        newOutputType,
      );
      outputSymbolNameRef.current = newOutputName;

      const { outputSignalSliced } = await getDataFromIndexedDB(
        frequencyLimit,
        newOutputType,
      );

      if (outputAreaSeriesRef.current) {
        outputAreaSeriesRef.current.setData(outputSignalSliced);
        requestAnimationFrame(() => {
          if (outputChartRef.current) {
            outputChartRef.current.timeScale().fitContent();
          }
          outputUpdateLegend(undefined);
        });
      }
    } catch (error) {
      console.error('Error updating output chart type:', error);
    }
  };


  const handleTabChange = (value) => {
    if (value !== outputDataType) {
      setOutputDataType(value);
      updateOutputChartType(value);
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag for cleanup

    window.updateChartData = updateChartData;

    // Ensure containers exist before proceeding
    if (!container1Ref.current || !container2Ref.current) {
        console.error("Chart container refs not ready on mount.");
        window.hideChartLoading();
        return;
    }

    const initializeCharts = async () => {
      try {
        dbRef.current = await createDB();
        
        const signalParams = loadSignalParamsFromLocalStorage();
        
        const { inputSymbolName: initialInput, outputSymbolName: initialOutput } = formatLegend(signalParams);
        inputSymbolNameRef.current = initialInput;
        outputSymbolNameRef.current = initialOutput;

        const chartOptions = {
          layout: {
            textColor: 'white',
            background: { type: 'solid', color: '#171717' },
            attributionLogo: false,
          },
          localization: {
            timeFormatter: time => time.toString(),
          },
          rightPriceScale: {
            scaleMargins: { top: 0.4, bottom: 0.15 },
          },
          crosshair: {
            horzLine: { 
                visible: false, 
                labelVisible: false 
            },
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          timeScale: {
            minBarSpacing: 0.1,
            fixLeftEdge: true,
            fixRightEdge: true,
            timeVisible: true,
            // borderVisible: false, // Example
            tickMarkFormatter: (time) => {
                return time.toString();
            }
          },
          handleScroll: true,
          handleScale: true,
        };

        if (container1Ref.current && isMounted) {
          const inputChart = createChart(container1Ref.current, chartOptions);
          const inputAreaSeries = inputChart.addSeries(AreaSeries, {
            topColor: '#d5b8f9',
            bottomColor: 'rgba(213, 184, 249, 0.5)',
            lineColor: '#d5b8f9',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001,
            },
          });
          
          inputChartRef.current = inputChart;
          inputAreaSeriesRef.current = inputAreaSeries;
                    
          inputChart.subscribeCrosshairMove(inputUpdateLegend);
        }
        
        if (container2Ref.current && isMounted) {
          const outputChart = createChart(container2Ref.current, chartOptions);
          const outputAreaSeries = outputChart.addSeries(AreaSeries, {
            topColor: '#d5b8f9',
            bottomColor: 'rgba(143, 67, 234, 0.33)',
            lineColor: '#d5b8f9',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001,
            },
          });
          
          outputChartRef.current = outputChart;
          outputAreaSeriesRef.current = outputAreaSeries;
          
          outputChart.subscribeCrosshairMove(outputUpdateLegend);
        }
        
        const frequencyLimit = parseInt(signalParams.freqrange);
        let { inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit);
        
        while (!isMounted || !inputSignal.length || !outputSignalSliced.length) {
          console.log("No data available yet, waiting 1000ms...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchSignal(signalParams);  
          ({ inputSignal, outputSignalSliced } = await getDataFromIndexedDB(frequencyLimit));
        }
        
        if (!isMounted) return;
        
        if (inputAreaSeriesRef.current) {
          inputAreaSeriesRef.current.setData(inputSignal);
        }
        if (outputAreaSeriesRef.current) {
          outputAreaSeriesRef.current.setData(outputSignalSliced);
        }
        
        setTimeout(() => {
            if (!isMounted) return;

            inputUpdateLegend(undefined);
            outputUpdateLegend(undefined);

            if (inputChartRef.current) inputChartRef.current.timeScale().fitContent();
            if (outputChartRef.current) outputChartRef.current.timeScale().fitContent();

            window.hideChartLoading();
        }, 0);      
    } catch (error) {
        console.error("Error initializing charts:", error);
        if(isMounted) window.hideChartLoading();
    }
    };
    
    initializeCharts();
    
    return () => {
        isMounted = false; // Cleanup flag
        if (inputChartRef.current) inputChartRef.current.remove();
        if (outputChartRef.current) outputChartRef.current.remove();
        window.updateChartData = undefined;
    };
  }, []);

  return (
    <div id="chart-root" className="relative w-full flex flex-col" ref={chartRootRef}>      
      <div 
        id="container1" 
        ref={container1Ref}
        className="my-10 h-[300px] min-w-[800px] md:min-w-0 md:w-full relative"
      >
        <div 
          id="inputLegend" 
          ref={inputLegendRef}
          className="absolute left-0 top-0 z-10 font-sans font-light text-white p-2 rounded pointer-events-none max-w-sm md:max-w-xl break-words"
        ></div>
      </div>
      
        <Tabs
            defaultValue="modulus"
            onValueChange={handleTabChange}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="real">Real</TabsTrigger>
            <TabsTrigger value="imaginary">Imaginary</TabsTrigger>
            <TabsTrigger value="modulus">Modulus</TabsTrigger>
            </TabsList>
        </Tabs>

      <div 
        id="container2" 
        ref={container2Ref}
        className="mb-10 h-[300px] min-w-[800px] md:min-w-0 md:w-full relative"
      >
        <div 
          id="outputLegend" 
          ref={outputLegendRef}
          className="absolute left-0 top-0 z-10 font-sans font-light text-white p-2 rounded pointer-events-none max-w-sm md:max-w-xl break-words"
        ></div>
      </div>
    </div>
  );
};

export default Chart;
