import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { loadSignalParamsFromLocalStorage } from '@/scripts/signal-handler.js';
import { useSignalData } from '@/hooks/useSignalData';
import { useLightweightChart } from '@/hooks/useLightweightChart';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formatLegend = (signalParams = {}, outputType = 'modulus') => {
  const { b, signalShape, amplitude, phase } = signalParams;

  let inputFormatters = {
    square: `\\( \\textbf{x}[n] = A \\cdot \\Pi \\left(\\frac{nT-X}{P}\\right) \\)`,
    JSquare: `\\( \\textbf{x}[n] = A \\cdot \\Pi \\left(\\frac{nT-X}{P}\\right) \\)`,
    triangle: `\\( \\textbf{x}[n] = A \\cdot \\Lambda \\left(\\frac{nT-X}{2P}\\right) \\)`,
    sinc: `\\( \\textbf{x}[n] = A \\cdot \\text{sinc}(f_0nT - \\varphi ) = A \\cdot \\frac{\\sin(f_0 \\pi nT - \\varphi )}{f_0 \\pi nT - \\varphi } \\)`,
    sin: `\\( \\textbf{x}[n] = A \\cdot \\sin(2\\pi f_0nT + \\varphi ) \\)`,
    cos: `\\( \\textbf{x}[n] = A \\cdot \\cos(2\\pi f_0nT + \\varphi ) \\)`,
    exp: `\\( \\textbf{x}[n] = ${amplitude}\\cdot e^{nT} \\)`,
    sign: `\\( \\textbf{x}[n] = \\frac{nT}{|nT|} \\forall n \\neq 0 \\)`,
  };

  let outputFormatters = {
    modulus: {
      square: `\\( |\\mathcal{F}| = |A| \\cdot P|\\text{sinc}(Pf)| \\)`,
      JSquare: `\\( |\\mathcal{F}| = |A| \\cdot P|\\text{sinc}(Pf)| \\)`,
      triangle: `\\( |\\mathcal{F}| = |A| \\cdot P\\text{sinc}^2(Pf) \\)`,
      sinc: `\\( |\\mathcal{F}| = |A| \\cdot \\Pi \\left(\\frac{f}{f_0}\\right) \\)`,
      cos: `\\( |\\mathcal{F}| = \\frac{|A|}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`,
      sin: `\\( |\\mathcal{F}| = \\frac{|A|}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`,
      exp: `\\( |\\mathcal{F}| = e^{${b}}\\cdot \\frac{1}{2\\pi |f|+1} \\)`,
      sign: `\\( |\\mathcal{F}| = \\left| \\frac{2}{f} \\right| \\)`,
    },
    real: {
      square: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf)\\cos(2\\pi f X) \\)`,
      JSquare: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf)\\cos(2\\pi f X) \\)`,
      triangle: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}^2(Pf) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}^2(Pf)\\cos(2\\pi f X) \\)`,
      sinc: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right)\\cos(2\\pi f \\varphi) \\)`,
      cos: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`
        : `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)]\\cos(\\varphi) \\)`,
      sin: phase == 0
        ? `\\( \\Re(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)]\\cos(\\varphi) \\)`,
      exp: `\\( \\Re(\\mathcal{F}) \\)`,
      sign: `\\( \\Re(\\mathcal{F}) = 0 \\)`,
    },
    imaginary: {
      square: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot P\\text{sinc}(Pf)\\sin(2\\pi f X) \\)`,
      JSquare: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot P\\text{sinc}(Pf)\\sin(2\\pi f X) \\)`,
      triangle: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot P\\text{sinc}^2(Pf)\\sin(2\\pi f X) \\)`,
      sinc: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right)\\sin(2\\pi f \\varphi) \\)`,
      cos: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)]\\sin(\\varphi) \\)`,
      sin: phase == 0
        ? `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)] \\)`
        : `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)]\\sin(\\varphi) \\)`,
      exp: `\\( \\Im(\\mathcal{F}) \\)`,
      sign: `\\( \\Im(\\mathcal{F}) = -\\frac{2}{f} \\)`,
    },
  };

  return {
    inputSymbolName: inputFormatters[signalShape] || `\\( \\textbf{x}[n] \\)`,
    outputSymbolName:
      outputFormatters[outputType]?.[signalShape] || `\\( \\mathcal{F} \\)`,
  };
};


const Chart = () => {
  const container1Ref = useRef(null);
  const container2Ref = useRef(null);
  const inputLegendRef = useRef(null);
  const outputLegendRef = useRef(null);

  const inputSymbolNameRef = useRef('');
  const outputSymbolNameRef = useRef('');

  const [outputDataType, setOutputDataType] = useState('modulus');
  const { getData } = useSignalData();

  const commonChartOptions = useMemo(() => {
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const formatTick = (v) => {
      const n = typeof v === 'number' ? v : parseFloat(v);
      if (!Number.isFinite(n)) return String(v);
      return (Math.round(n * 100) / 100).toFixed(2);
    };
    return {
      layout: {
        textColor: 'white',
        background: { type: 'solid', color: '#171717' },
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (time) => formatTick(time),
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
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
        borderVisible: false,
        tickMarkFormatter: (time) => formatTick(time),
      },
      rightPriceScale: {
        visible: !isSmallScreen,
        scaleMargins: { top: 0.4, bottom: 0.15 },
        borderVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    };
  }, []);

  const inputSeriesOptions = useMemo(
    () => ({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(213, 184, 249, 0.5)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    [],
  );

  const outputSeriesOptions = useMemo(
    () => ({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(143, 67, 234, 0.33)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    [],
  );

  const {
    setData: setInputChartData,
    fitContent: fitInputChartContent,
    updateLegend: updateInputLegendManual,
  } = useLightweightChart(
    container1Ref,
    inputLegendRef,
    inputSymbolNameRef,
    commonChartOptions,
    inputSeriesOptions,
  );

  const {
    setData: setOutputChartData,
    fitContent: fitOutputChartContent,
    updateLegend: updateOutputLegendManual,
  } = useLightweightChart(
    container2Ref,
    outputLegendRef,
    outputSymbolNameRef,
    commonChartOptions,
    outputSeriesOptions,
  );

  const updateChartData = useCallback(
    async (signalParams) => {
      if (!signalParams || !getData) return;

      if (window.showChartLoading) window.showChartLoading();

      try {
        setOutputDataType('modulus');

        const { inputSymbolName, outputSymbolName } = formatLegend(
          signalParams,
          'modulus',
        );
        inputSymbolNameRef.current = inputSymbolName;
        outputSymbolNameRef.current = outputSymbolName;

        const frequencyLimit = parseInt(signalParams.freqrange) || 10;
        const { inputSignal, outputSignalSliced } = await getData(
          frequencyLimit,
          'modulus',
        );

        setInputChartData(inputSignal);
        setOutputChartData(outputSignalSliced);

        requestAnimationFrame(() => {
          fitInputChartContent();
          fitOutputChartContent();
          updateInputLegendManual(undefined);
          updateOutputLegendManual(undefined);
        });
      } catch (error) {
        console.error('Error updating chart data:', error);
      } finally {
        if (window.hideChartLoading) window.hideChartLoading();
      }
    },
    [
      getData,
      setInputChartData,
      setOutputChartData,
      fitInputChartContent,
      fitOutputChartContent,
      updateInputLegendManual,
      updateOutputLegendManual,
    ],
  );

  // Update only the output chart type
  const updateOutputChartType = useCallback(
    async (newOutputType) => {
      if (!getData) return;

      try {
        const signalParams = loadSignalParamsFromLocalStorage();
        const frequencyLimit = parseInt(signalParams.freqrange) || 10;

        const { outputSymbolName } = formatLegend(signalParams, newOutputType);
        outputSymbolNameRef.current = outputSymbolName;

        const { outputSignalSliced } = await getData(
          frequencyLimit,
          newOutputType,
        );

        setOutputChartData(outputSignalSliced);

        requestAnimationFrame(() => {
          fitOutputChartContent();
          updateOutputLegendManual(undefined);
        });
      } catch (error) {
        console.error('Error updating output chart type:', error);
      }
    },
    [getData, setOutputChartData, fitOutputChartContent, updateOutputLegendManual], // Add hook functions
  );

  useEffect(() => {
    window.updateChartData = updateChartData;

    const signalParams = loadSignalParamsFromLocalStorage();
    if (signalParams) {
      if (window.showChartLoading) window.showChartLoading();
      updateChartData(signalParams);
    } else {
      console.warn('No signal parameters found in local storage on initial load.');
      if (window.hideChartLoading) window.hideChartLoading();
    }

    // Cleanup global function
    return () => {
      window.updateChartData = undefined;
    };
  }, [updateChartData]);

  const handleTabChange = (value) => {
    if (value !== outputDataType) {
      setOutputDataType(value);
      updateOutputChartType(value);
    }
  };

  return (
    <div id="chart-root" className="relative w-full flex flex-col">
      <div
        id="container1"
        ref={container1Ref}
        className="my-10 h-[300px] md:min-w-0 md:w-full relative"
      >
        <div
          id="inputLegend"
          ref={inputLegendRef}
          className="absolute left-0 top-0 z-10 font-sans font-light text-white p-2 rounded pointer-events-none max-w-sm md:max-w-xl break-words"
        >
        </div>
      </div>

      <Tabs value={outputDataType} onValueChange={handleTabChange} className="w-fit">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="real">Real</TabsTrigger>
          <TabsTrigger value="imaginary">Imaginary</TabsTrigger>
          <TabsTrigger value="modulus">Modulus</TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        id="container2"
        ref={container2Ref}
        className="mb-10 h-[300px] md:min-w-0 md:w-full relative"
      >
        <div
          id="outputLegend"
          ref={outputLegendRef}
          className="absolute left-0 top-0 z-10 font-sans font-light text-white p-2 rounded pointer-events-none max-w-sm md:max-w-xl break-words"
        >
        </div>
      </div>
    </div>
  );
};

export default Chart;
