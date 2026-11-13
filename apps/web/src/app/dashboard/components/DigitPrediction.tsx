'use client';
import { useState, useEffect } from 'react';

export default function DigitPrediction({ onSelectDigit }: { onSelectDigit: (digit: number) => void }) {
  const [digits, setDigits] = useState<number[]>(Array(10).fill(0));

  useEffect(() => {
    setDigits(Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)));

    const interval = setInterval(() => {
      const newDigit = Math.floor(Math.random() * 10);
      setDigits(prev => [newDigit, ...prev.slice(0, 9)]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const counts = Array(10).fill(0);
  digits.forEach(d => counts[d]++);
  const percentages = counts.map(c => Math.round((c / 10) * 100));

  const handlePredict = (num: number) => {
    onSelectDigit(num);
  };

  return (
    <div className="bg-[#0b0e14] border border-gray-800 rounded-lg p-2 md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <div>
          <h2 className="text-[9px] md:text-[10px] font-bold text-[#f0b90b] tracking-wider">DIGIT PREDICTION</h2>
          <p className="hidden md:block text-[10px] text-gray-500">Last digit prediction for Volatility 10 (1s)</p>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <span className="text-[9px] md:text-[10px] text-gray-400">
            Last <span className="text-white font-bold bg-[#f0b90b] text-black px-1 rounded ml-1">{digits[0]}</span>
          </span>
          <span className="hidden md:inline text-[10px] text-green-500 font-bold border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">
            Match 14.6%
          </span>
        </div>
      </div>

      {/* Rings Row */}
      <div className="flex justify-between gap-0.5 md:gap-1">
        {Array.from({ length: 10 }).map((_, i) => {
          const isLast = i === 0;
          const percent = percentages[i];
          
          const isGreen = i > 4;
          const isRed = i <= 4;
          
          const ringColor = isGreen ? '#26a69a' : '#ef5350';
          const percentColor = isGreen ? 'text-[#26a69a]' : 'text-[#ef5350]';
          
          // SVG circle math
          const radius = 20;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div key={i} className="flex flex-col items-center gap-0.5 md:gap-2 cursor-pointer group" onClick={() => handlePredict(i)}>
              <div className="relative w-6 h-6 md:w-12 md:h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                {/* Background Ring */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r={radius} stroke="#1e222d" strokeWidth="3" fill="none" />
                </svg>
                
                {/* Colored Progress Ring */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                  <circle 
                    cx="24" cy="24" r={radius} 
                    stroke={ringColor} 
                    strokeWidth="3" 
                    fill="none" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* The Number */}
                <span className={`relative z-10 text-[10px] md:text-sm font-bold ${isLast ? 'text-white' : 'text-gray-300'}`}>
                  {i}
                </span>
                
                {/* Gold outline for the "Last" digit */}
                {isLast && (
                  <div className="absolute inset-0 border-[2px] border-[#f0b90b] rounded-full"></div>
                )}
              </div>
              
              {/* Percentage Text below ring */}
              <span className={`text-[8px] md:text-[10px] font-bold ${percentColor}`}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}