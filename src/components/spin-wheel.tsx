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


export function SpinWheel({ prizes, targetPrize, isSpinning, onSpinComplete, wheelSize = 360 }: SpinWheelProps) {
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const wheelRef = useRef<SVGGElement>(null);

  const numPrizes = prizes.length;
  const segmentAngleDegrees = 360 / numPrizes;
  const radius = wheelSize / 2;
  
  useEffect(() => {
    if (isSpinning && !isAnimating && targetPrize) {
      setIsAnimating(true);

      const prizeIndex = prizes.findIndex(p => p.id === targetPrize.id);
      const prizeMiddleAngle = (prizeIndex * segmentAngleDegrees) + (segmentAngleDegrees / 2);
      
      const randomJitterDegrees = (Math.random() - 0.5) * segmentAngleDegrees * 0.6; // Land within +/- 30% of segment center line
      const effectivePrizeAngle = prizeMiddleAngle + randomJitterDegrees;

      const minBaseSpins = 5; 
      const extraSpins = Math.floor(Math.random() * 3); 
      
      const K = Math.floor(currentRotation / 360) + minBaseSpins + extraSpins;
      const newRotationTarget = K * 360 - effectivePrizeAngle;
      
      setCurrentRotation(newRotationTarget);
    }
  }, [isSpinning, targetPrize, prizes, currentRotation, isAnimating, segmentAngleDegrees]);

  const handleTransitionEnd = () => {
    if (isSpinning && targetPrize) {
      onSpinComplete(targetPrize);
      setIsAnimating(false);
      // Normalize rotation to prevent excessively large numbers, but ensure smooth stop
      const finalRotation = currentRotation % 360;
      // Set a visually similar end state without triggering re-spin due to large number change
      // This helps if a new spin relies on a 'clean' currentRotation
      // For robust behavior, setCurrentRotation(finalRotation) could be done here,
      // but ensure it doesn't interfere with subsequent spin calculations.
      // For now, CSS handles large values, so direct normalization might not be strictly necessary.
    }
  };

  const getArcPath = (startAngleDeg: number, endAngleDeg: number) => {
    const startAngleRad = (startAngleDeg - 90) * Math.PI / 180;
    const endAngleRad = (endAngleDeg - 90) * Math.PI / 180;

    const x1 = radius + radius * Math.cos(startAngleRad);
    const y1 = radius + radius * Math.sin(startAngleRad);
    const x2 = radius + radius * Math.cos(endAngleRad);
    const y2 = radius + radius * Math.sin(endAngleRad);

    const largeArcFlag = (endAngleDeg - startAngleDeg) <= 180 ? "0" : "1";

    // Path for a segment of an annulus (ring)
    const innerRadius = radius * 0.1; // Small inner circle
    const ix1 = radius + innerRadius * Math.cos(startAngleRad);
    const iy1 = radius + innerRadius * Math.sin(startAngleRad);
    const ix2 = radius + innerRadius * Math.cos(endAngleRad);
    const iy2 = radius + innerRadius * Math.sin(endAngleRad);
    
    // M outer_start_x,outer_start_y A outer_radius,outer_radius 0 largeArcFlag 1 outer_end_x,outer_end_y L inner_end_x,inner_end_y A inner_radius,inner_radius 0 largeArcFlag 0 inner_start_x,inner_start_y Z
    return `M ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} L ${ix2},${iy2} A ${innerRadius},${innerRadius} 0 ${largeArcFlag} 0 ${ix1},${iy1} Z`;
  };


  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: wheelSize, height: wheelSize }}>
      <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 z-10" style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))' }}>
        <svg width="30" height="45" viewBox="0 0 30 45" className="drop-shadow-lg">
           {/* Using primary color for pointer to match button, primary-foreground for border */}
          <polygon points="15,0 30,25 15,45 0,25" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5"/>
        </svg>
      </div>
      <svg
        width={wheelSize}
        height={wheelSize}
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        className="rounded-full shadow-2xl overflow-visible" // overflow-visible for potential icon overhang
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: isAnimating ? `transform 7s cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none', // Slower, smoother animation
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
        <circle cx={radius} cy={radius} r={radius * 0.98} fill="transparent" stroke="hsl(var(--primary))" strokeWidth={wheelSize * 0.06}  filter="url(#dropShadow)" />


        <g ref={wheelRef}>
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngleDegrees;
            const endAngle = (index + 1) * segmentAngleDegrees;
            const midAngleDeg = startAngle + segmentAngleDegrees / 2;
            const midAngleRad = (midAngleDeg - 90) * Math.PI / 180; 

            const textColor = prize.textColor || getContrastingTextColor(prize.color);
            
            const textDistance = radius * 0.65;
            const textX = radius + textDistance * Math.cos(midAngleRad);
            const textY = radius + textDistance * Math.sin(midAngleRad);

            const iconDistance = radius * 0.35;
            const iconX = radius + iconDistance * Math.cos(midAngleRad);
            const iconY = radius + iconDistance * Math.sin(midAngleRad);
            const iconSize = wheelSize * 0.1;


            return (
              <g key={prize.id}>
                <path d={getArcPath(startAngle, endAngle)} fill={prize.color} stroke="hsl(var(--card))" strokeWidth="2" />
                 {prize.icon && (
                  <svg 
                    x={iconX - iconSize / 2} 
                    y={iconY - iconSize / 2} 
                    width={iconSize} 
                    height={iconSize} 
                    viewBox="0 0 24 24" 
                    fill={textColor}
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
                  transform={`rotate(${midAngleDeg}, ${textX}, ${textY})`}
                  style={{ fontSize: `${Math.max(10, wheelSize / 30)}px`, fontWeight: '600', fill: textColor, pointerEvents: 'none', letterSpacing: '0.025em' }}
                >
                  {prize.name.split(' ').map((word, i, arr) => (
                    <tspan key={i} x={textX} dy={i > 0 && arr.length > 1 ? `${wheelSize / 28}px` : '0'}>{word}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
         <circle cx={radius} cy={radius} r={radius * 0.1} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
         <circle cx={radius} cy={radius} r={radius * 0.07} fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
}
