
"use client";

import type { Prize } from '@/types';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

interface SpinWheelProps {
  prizes: Prize[];
  targetPrize: Prize | null;
  isSpinning: boolean;
  onSpinComplete: (prize: Prize) => void;
  wheelSize?: number;
}

// Helper function to determine contrasting text color
const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor.startsWith('#')) return '#000000';
  try {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  } catch (e) {
    return '#000000'; // Fallback for invalid hex
  }
};

// Helper function for rounding numbers to a specific precision
const roundToPrecision = (num: number, precision: number = 3): number => {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
};


export function SpinWheel({ prizes, targetPrize, isSpinning, onSpinComplete, wheelSize: rawWheelSize = 360 }: SpinWheelProps) {
  const wheelSize = Math.round(rawWheelSize); // Ensure wheelSize is an integer
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const wheelRef = useRef<SVGGElement>(null);

  const numPrizes = prizes.length;
  const segmentAngleDegrees = 360 / numPrizes;
  const radius = wheelSize / 2; // This will be an integer or X.5
  
  useEffect(() => {
    if (isSpinning && !isAnimating && targetPrize) {
      setIsAnimating(true);

      const prizeIndex = prizes.findIndex(p => p.id === targetPrize.id);
      // Ensure prizeMiddleAngle calculation is stable
      const prizeMiddleAngle = (prizeIndex * segmentAngleDegrees) + (segmentAngleDegrees / 2);
      
      const randomJitterDegrees = (Math.random() - 0.5) * segmentAngleDegrees * 0.6;
      const effectivePrizeAngle = prizeMiddleAngle + randomJitterDegrees;

      const minBaseSpins = 5; 
      const extraSpins = Math.floor(Math.random() * 3); 
      
      // Ensure currentRotation is treated as starting from a normalized base if needed,
      // though CSS handles large rotation values well.
      const K = Math.floor(currentRotation / 360) + minBaseSpins + extraSpins;
      const newRotationTarget = K * 360 - effectivePrizeAngle;
      
      setCurrentRotation(newRotationTarget);
    }
  }, [isSpinning, targetPrize, prizes, currentRotation, isAnimating, segmentAngleDegrees, numPrizes]); // Added numPrizes to dependencies

  const handleTransitionEnd = () => {
    if (isSpinning && targetPrize) {
      onSpinComplete(targetPrize);
      setIsAnimating(false);
      // Normalize rotation to prevent excessively large numbers for the next spin's calculation base if desired
      // setCurrentRotation(prev => prev % 360); // Optional: if very large rotation values cause issues later
    }
  };

  const getArcPath = (startAngleDeg: number, endAngleDeg: number) => {
    const currentRadius = wheelSize / 2; // Consistent with radius in component scope
    const currentInnerRadius = roundToPrecision(currentRadius * 0.1, 3);

    const startAngleRad = (startAngleDeg - 90) * Math.PI / 180;
    const endAngleRad = (endAngleDeg - 90) * Math.PI / 180;

    const x1 = roundToPrecision(currentRadius + currentRadius * Math.cos(startAngleRad), 3);
    const y1 = roundToPrecision(currentRadius + currentRadius * Math.sin(startAngleRad), 3);
    const x2 = roundToPrecision(currentRadius + currentRadius * Math.cos(endAngleRad), 3);
    const y2 = roundToPrecision(currentRadius + currentRadius * Math.sin(endAngleRad), 3);

    const largeArcFlag = (endAngleDeg - startAngleDeg) <= 180 ? "0" : "1";

    const ix1 = roundToPrecision(currentRadius + currentInnerRadius * Math.cos(startAngleRad), 3);
    const iy1 = roundToPrecision(currentRadius + currentInnerRadius * Math.sin(startAngleRad), 3);
    const ix2 = roundToPrecision(currentRadius + currentInnerRadius * Math.cos(endAngleRad), 3);
    const iy2 = roundToPrecision(currentRadius + currentInnerRadius * Math.sin(endAngleRad), 3);
    
    // Arc radii (currentRadius, currentInnerRadius) are N or N.5, or rounded, their string form is stable
    return `M ${x1},${y1} A ${currentRadius},${currentRadius} 0 ${largeArcFlag} 1 ${x2},${y2} L ${ix2},${iy2} A ${currentInnerRadius},${currentInnerRadius} 0 ${largeArcFlag} 0 ${ix1},${iy1} Z`;
  };

  const primaryBorderRadius = roundToPrecision(radius * 0.98, 3);
  const outerBorderStrokeWidth = roundToPrecision(wheelSize * 0.06, 2);
  const centerCircleOuterRadius = roundToPrecision(radius * 0.1, 3);
  const centerCircleInnerRadius = roundToPrecision(radius * 0.07, 3);

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: wheelSize, height: wheelSize }}>
      <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 z-10" style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))' }}>
        <svg width="30" height="45" viewBox="0 0 30 45" className="drop-shadow-lg">
          <polygon points="15,0 30,25 15,45 0,25" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5"/>
        </svg>
      </div>
      <svg
        width={wheelSize}
        height={wheelSize}
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        className="rounded-full shadow-2xl overflow-visible"
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: isAnimating ? `transform 7s cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <defs>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge> 
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/> 
                </feMerge>
            </filter>
        </defs>
        <circle cx={radius} cy={radius} r={radius} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx={radius} cy={radius} r={primaryBorderRadius} fill="transparent" stroke="hsl(var(--primary))" strokeWidth={outerBorderStrokeWidth}  filter="url(#dropShadow)" />

        <g ref={wheelRef}>
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngleDegrees;
            const endAngle = (index + 1) * segmentAngleDegrees;
            // midAngleDeg is N or N.5, its string form is stable for transform.
            const midAngleDeg = startAngle + segmentAngleDegrees / 2;
            const midAngleRad = (midAngleDeg - 90) * Math.PI / 180; 

            const textColor = prize.textColor || getContrastingTextColor(prize.color);
            
            const textDistance = radius * 0.65;
            const textX = roundToPrecision(radius + textDistance * Math.cos(midAngleRad), 3);
            const textY = roundToPrecision(radius + textDistance * Math.sin(midAngleRad), 3);

            const iconDistance = radius * 0.35;
            const iconX = roundToPrecision(radius + iconDistance * Math.cos(midAngleRad), 3);
            const iconY = roundToPrecision(radius + iconDistance * Math.sin(midAngleRad), 3);
            
            const iconSize = roundToPrecision(wheelSize * 0.1, 3);
            const textFontSize = roundToPrecision(Math.max(8, wheelSize / 35), 1);
            const tspanLineHeight = roundToPrecision(wheelSize / 33, 1);

            return (
              <g key={prize.id}>
                <path d={getArcPath(startAngle, endAngle)} fill={prize.color} stroke="hsl(var(--card))" strokeWidth="2" />
                 {prize.icon && (
                  <svg 
                    x={roundToPrecision(iconX - iconSize / 2, 3)} 
                    y={roundToPrecision(iconY - iconSize / 2, 3)} 
                    width={iconSize} 
                    height={iconSize} 
                    viewBox="0 0 24 24" 
                    fill={textColor}
                    // midAngleDeg is stable (N or N.5), iconX and iconY are rounded.
                    transform={`rotate(${midAngleDeg}, ${iconX}, ${iconY})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    <prize.icon strokeWidth={1.5} />
                  </svg>
                )}
                <text
                  x={textX}
                  y={textY}
                  dy=".3em" 
                  textAnchor="middle"
                  // midAngleDeg is stable, textX and textY are rounded.
                  transform={`rotate(${midAngleDeg}, ${textX}, ${textY})`}
                  style={{ fontSize: `${textFontSize}px`, fontWeight: '600', fill: textColor, pointerEvents: 'none', letterSpacing: '0.025em' }}
                >
                  {prize.name.split(' ').map((word, i, arr) => (
                    <tspan key={i} x={textX} dy={i > 0 && arr.length > 1 ? `${tspanLineHeight}px` : '0'}>{word}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
         <circle cx={radius} cy={radius} r={centerCircleOuterRadius} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
         <circle cx={radius} cy={radius} r={centerCircleInnerRadius} fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
}
