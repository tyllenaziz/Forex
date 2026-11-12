'use client';
import { useEffect, useRef, useState } from 'react';
import { 
  createChart, ColorType, CandlestickSeries, LineSeries, BarSeries, AreaSeries, HistogramSeries,
  CrosshairMode, IChartApi, ISeriesApi
} from 'lightweight-charts';
import { 
  MousePointer2, Minus, Type, TrendingUp, Magnet, Ruler, Smile, ZoomIn, Camera, MoveUpRight, PenTool, Square, Eraser, Plus
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

type ChartType = 'Candles' | 'Line' | 'Bars' | 'Area';

export default function TradingChart({ symbol }: { symbol: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeRef = useRef<ISeriesApi<any> | null>(null);
  const smaRef = useRef<ISeriesApi<any> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('Candles');
  const [timeframe, setTimeframe] = useState('15m');
  const [candlesData, setCandlesData] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState('cursor');
  const [showSMA, setShowSMA] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<any[]>([]);
  const [drawings, setDrawings] = useState<ISeriesApi<any>[]>([]);

  // Fetch Data
  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/market/candles/${encodeURIComponent(symbol)}`)
      .then(data => {
        if (data.candles && data.candles.length > 0) {
          let extendedData = [...data.candles];
          if (timeframe === '1H') extendedData = [...data.candles, ...data.candles.map((c: any) => ({...c, time: c.time + 86400}))];
          else if (timeframe === '4H') extendedData = [...data.candles, ...data.candles.map((c: any) => ({...c, time: c.time + 86400 * 2}))];
          else if (timeframe === '1D') extendedData = [...data.candles, ...data.candles.map((c: any) => ({...c, time: c.time + 86400 * 5}))];
          setCandlesData(extendedData);
        }
      })
      .catch(err => console.error("Failed to load chart", err))
      .finally(() => setLoading(false));
  }, [symbol, timeframe]);

  // Initialize Chart
    useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current; // Create a local variable to avoid TS null checks
    
    const chart = createChart(container, {
      layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc', fontSize: 11 },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      width: container.clientWidth,
      height: container.clientHeight || 600, // <-- Fallback to 600
timeScale: { borderColor: '#2B2B43', timeVisible: true, secondsVisible: false, rightOffset: 5, barSpacing: 6, minBarSpacing: 1 },
      rightPriceScale: { borderColor: '#2B2B43', scaleMargins: { top: 0.1, bottom: 0.25 }, minimumWidth: 120, autoScale: true },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2B2B43' },
        horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2B2B43' },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, []);

  // Render Chart, Volume, and SMA
  useEffect(() => {
    if (!chartRef.current || candlesData.length === 0) return;

    const chart = chartRef.current;
    try {
      if (mainSeriesRef.current) chart.removeSeries(mainSeriesRef.current);
      if (volumeRef.current) chart.removeSeries(volumeRef.current);
      if (smaRef.current) chart.removeSeries(smaRef.current);
    } catch (e) {}

    let newSeries: ISeriesApi<any>;
    const precision = symbol.includes('JPY') ? 3 : 5;
    const priceFormat = { type: 'price' as const, precision: precision, minMove: Math.pow(10, -precision) };

    switch (chartType) {
      case 'Candles':
        newSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350', priceFormat });
        newSeries.setData(candlesData);
        break;
      case 'Line':
        newSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2, priceFormat });
        newSeries.setData(candlesData.map(c => ({ time: c.time, value: c.close })));
        break;
      case 'Bars':
        newSeries = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350', priceFormat });
        newSeries.setData(candlesData);
        break;
      case 'Area':
        newSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: 'rgba(41, 98, 255, 0.4)', bottomColor: 'rgba(41, 98, 255, 0)', priceFormat });
        newSeries.setData(candlesData.map(c => ({ time: c.time, value: c.close })));
        break;
    }

    mainSeriesRef.current = newSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, { color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } }); 
    const volumeData = candlesData.map((c: any) => ({ time: c.time, value: Math.floor(Math.random() * 5000) + 1000, color: c.close > c.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)' }));
    volumeSeries.setData(volumeData);
    volumeRef.current = volumeSeries;

    if (showSMA) {
      const smaData = [];
      const period = 14;
      for (let i = period; i < candlesData.length; i++) {
        const sum = candlesData.slice(i - period, i).reduce((acc, c) => acc + c.close, 0);
        smaData.push({ time: candlesData[i].time, value: sum / period });
      }
      const smaSeries = chart.addSeries(LineSeries, { color: '#FF9800', lineWidth: 1, priceLineVisible: false });
      smaSeries.setData(smaData);
      smaRef.current = smaSeries;
    }

    chart.timeScale().fitContent();
  }, [chartType, candlesData, showSMA]);

  // --- LIVE WEBSOCKET TICKING ---
  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current || candlesData.length === 0) return;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/prices';
const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'PRICE_UPDATE' && message.data[symbol]) {
        const newPrice = message.data[symbol].bid;
        const lastCandle = candlesData[candlesData.length - 1];
        
        if (!lastCandle) return;

        const updatedCandle = {
          ...lastCandle,
          close: newPrice,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice),
        };

        if (chartType === 'Candles' || chartType === 'Bars') {
          mainSeriesRef.current?.update(updatedCandle);
        } else {
          mainSeriesRef.current?.update({ time: lastCandle.time, value: newPrice });
        }
      }
    };

    return () => ws.close();
  }, [candlesData, chartType, symbol]);

  const handleChartClick = (param: any) => {
    if (!chartRef.current || !param.time || !param.point) return;

    if (activeTool === 'horizontal') {
      const price = mainSeriesRef.current?.coordinateToPrice(param.point.y);
      if (price) {
        const lineSeries = chartRef.current.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, lineStyle: 2, priceLineVisible: false, autoscaleInfoProvider: () => null });
        lineSeries.setData([{ time: candlesData[0].time, value: price }, { time: candlesData[candlesData.length - 1].time, value: price }]);
        setDrawings(prev => [...prev, lineSeries]);
      }
    } 
    else if (activeTool === 'vertical') {
      const clickedCandle = candlesData.find((c: any) => c.time === param.time) || candlesData[candlesData.length - 1];
      const lineSeries = chartRef.current.addSeries(LineSeries, { color: '#FF9800', lineWidth: 1, lineStyle: 2, priceLineVisible: false, priceScaleId: '', autoscaleInfoProvider: () => null });
      lineSeries.setData([{ time: param.time, value: clickedCandle.low }, { time: param.time, value: clickedCandle.high }]);
      lineSeries.priceScale().applyOptions({ visible: false });
      setDrawings(prev => [...prev, lineSeries]);
    }
    else if (activeTool === 'trendline') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawPoints([{ time: param.time, price: mainSeriesRef.current?.coordinateToPrice(param.point.y) }]);
      } else {
        const startPoint = drawPoints[0];
        const endPoint = { time: param.time, price: mainSeriesRef.current?.coordinateToPrice(param.point.y) };
        const lineSeries = chartRef.current.addSeries(LineSeries, { color: '#FF9800', lineWidth: 2, priceLineVisible: false, autoscaleInfoProvider: () => null });
        const points = [startPoint, endPoint].sort((a, b) => (a.time as number) - (b.time as number));
        lineSeries.setData([{ time: points[0].time, value: points[0].price! }, { time: points[1].time, value: points[1].price! }]);
        setDrawings(prev => [...prev, lineSeries]);
        setIsDrawing(false);
        setDrawPoints([]);
        setActiveTool('cursor');
      }
    }
  };

  const clearDrawings = () => {
    if (!chartRef.current) return;
    drawings.forEach(series => chartRef.current?.removeSeries(series));
    setDrawings([]);
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (['horizontal', 'vertical', 'trendline'].includes(activeTool)) chart.subscribeClick(handleChartClick);
    else chart.unsubscribeClick(handleChartClick);
    return () => chart.unsubscribeClick(handleChartClick);
  }, [activeTool, isDrawing, drawPoints, candlesData]);

  return (
    <div className="flex flex-col w-full h-full border-b border-gray-800">
      <div className="flex items-center justify-between p-2 bg-[#131722] border-b border-gray-800 h-10 flex-shrink-0">
        <div className="flex gap-2 items-center">
          {(['Candles', 'Line', 'Bars', 'Area'] as ChartType[]).map(type => (
            <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1 text-xs font-semibold rounded ${chartType === type ? 'bg-[#2a2e39] text-white' : 'text-gray-400 hover:text-white'}`}>
              {type}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-700 mx-2"></div>
          <button 
            onClick={() => setShowSMA(!showSMA)}
            className={`px-3 py-1 text-xs font-semibold rounded ${showSMA ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-[#2a2e39]/50'}`}
          >
            SMA
          </button>
        </div>
        <div className="flex gap-4">
          <div className="flex text-xs text-gray-400 font-mono items-center gap-1">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} className={`px-1.5 py-0.5 rounded ${timeframe === tf ? 'bg-[#2a2e39] text-white' : 'hover:text-white'}`}>
                {tf}
              </button>
            ))}
          </div>
          <Camera size={16} className="text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </div>

      <div className="flex flex-1 relative">
        <div className="w-12 bg-[#131722] border-r border-gray-800 flex flex-col items-center py-2 gap-2 z-10 overflow-y-auto">
           {[
            { id: 'cursor', icon: MousePointer2 },
            { id: 'trendline', icon: TrendingUp },
            { id: 'horizontal', icon: Minus },
            { id: 'vertical', icon: Plus },
            { id: 'eraser', icon: Eraser },
            { id: 'arrow', icon: MoveUpRight },
            { id: 'pen', icon: PenTool },
            { id: 'square', icon: Square },
            { id: 'text', icon: Type },
            { id: 'measure', icon: Ruler },
            { id: 'magnet', icon: Magnet },
            { id: 'zoom', icon: ZoomIn },
            { id: 'emoji', icon: Smile },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'eraser') { clearDrawings(); setActiveTool('cursor'); return; }
                setActiveTool(tool.id);
                setIsDrawing(false);
                setDrawPoints([]);
              }}
              className={`p-2 rounded hover:bg-[#2a2e39] transition-colors ${activeTool === tool.id ? 'bg-[#2a2e39] text-red-500' : 'text-gray-400'}`}
            >
              <tool.icon size={18} />
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80 z-10 text-gray-400">Loading...</div>}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}