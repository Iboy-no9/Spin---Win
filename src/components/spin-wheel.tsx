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
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};


export function SpinWheel({ prizes, targetPrize, isSpinning, onSpinComplete, wheelSize = 360 }: SpinWheelProps) {
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const wheelRef = useRef<SVGGElement>(null);

  const numPrizes = prizes.length;
  const segmentAngleDegrees = 360 / numPrizes;
  const radius = wheelSize / 2;
  const innerRadiusFactor = 0.3; // Factor for how large the inner circle is (empty space or icon space)
  
  useEffect(() => {
    if (isSpinning && !isAnimating && targetPrize) {
      setIsAnimating(true);

      const prizeIndex = prizes.findIndex(p => p.id === targetPrize.id);
      const prizeMiddleAngle = (prizeIndex * segmentAngleDegrees) + (segmentAngleDegrees / 2);
      
      const randomJitterDegrees = (Math.random() - 0.5) * segmentAngleDegrees * 0.4; // Land within +/- 20% of segment center line
      const effectivePrizeAngle = prizeMiddleAngle + randomJitterDegrees;

      const minBaseSpins = 5; 
      const extraSpins = Math.floor(Math.random() * 3); // 0, 1, or 2 extra full spins
      
      // Target K determines how many full rotations. It ensures the wheel spins forward.
      // currentRotation is the current CSS rotation. EffectivePrizeAngle is where we want to land (relative to 0 at top).
      // We want the wheel's `effectivePrizeAngle` to align with the 0-degree pointer (top).
      // The wheel's own 0-degree mark will rotate to `-effectivePrizeAngle` (relative to a single spin).
      const K = Math.floor(currentRotation / 360) + minBaseSpins + extraSpins;
      const newRotationTarget = K * 360 - effectivePrizeAngle;
      
      setCurrentRotation(newRotationTarget);
    }
  }, [isSpinning, targetPrize, prizes, currentRotation, isAnimating, segmentAngleDegrees]);

  const handleTransitionEnd = () => {
    if (isSpinning && targetPrize) {
      onSpinComplete(targetPrize);
      setIsAnimating(false);
      // Opting not to normalize currentRotation (e.g., currentRotation % 360) to avoid visual jumps if calculation relies on it.
      // CSS handles large rotation values fine.
    }
  };

  const getArcPath = (startAngleDeg: number, endAngleDeg: number) => {
    const startAngleRad = (startAngleDeg - 90) * Math.PI / 180; // Adjust by -90 to start from 12 o'clock
    const endAngleRad = (endAngleDeg - 90) * Math.PI / 180;

    const x1 = radius + radius * Math.cos(startAngleRad);
    const y1 = radius + radius * Math.sin(startAngleRad);
    const x2 = radius + radius * Math.cos(endAngleRad);
    const y2 = radius + radius * Math.sin(endAngleRad);

    const largeArcFlag = (endAngleDeg - startAngleDeg) <= 180 ? "0" : "1";

    return `M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: wheelSize, height: wheelSize }}>
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>
        <svg width="30" height="40" viewBox="0 0 30 40">
          <polygon points="15,0 30,20 15,40 0,20" fill="hsl(var(--accent))" stroke="hsl(var(--accent-foreground))" strokeWidth="2"/>
        </svg>
      </div>
      <svg
        width={wheelSize}
        height={wheelSize}
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        className="rounded-full shadow-2xl"
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: isAnimating ? `transform 5s cubic-bezier(0.25, 0.1, 0.2, 1)` : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <g ref={wheelRef}>
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngleDegrees;
            const endAngle = (index + 1) * segmentAngleDegrees;
            const midAngleDeg = startAngle + segmentAngleDegrees / 2;
            const midAngleRad = (midAngleDeg - 90) * Math.PI / 180; // For text positioning

            const textColor = prize.textColor || getContrastingTextColor(prize.color);
            
            // Text position
            const textDistance = radius * ( 0.6 + (prize.icon ? 0.15 : 0)); // Push text further if there's an icon
            const textX = radius + textDistance * Math.cos(midAngleRad);
            const textY = radius + textDistance * Math.sin(midAngleRad);

            // Icon position
            const iconDistance = radius * 0.4;
            const iconX = radius + iconDistance * Math.cos(midAngleRad);
            const iconY = radius + iconDistance * Math.sin(midAngleRad);
            const iconSize = wheelSize * 0.08;


            return (
              <g key={prize.id}>
                <path d={getArcPath(startAngle, endAngle)} fill={prize.color} stroke="#FFFFFF" strokeWidth="1" />
                <text
                  x={textX}
                  y={textY}
                  dy=".3em" // vertical alignment
                  textAnchor="middle"
                  transform={`rotate(${midAngleDeg}, ${textX}, ${textY})`}
                  style={{ fontSize: `${Math.max(10, wheelSize / 25)}px`, fontWeight: 'bold', fill: textColor, pointerEvents: 'none' }}
                >
                  {prize.name}
                </text>
                {prize.icon && (
                  <svg 
                    x={iconX - iconSize / 2} 
                    y={iconY - iconSize / 2} 
                    width={iconSize} 
                    height={iconSize} 
                    viewBox="0 0 24 24" 
                    fill={textColor}
                    transform={`rotate(${midAngleDeg}, ${iconX}, ${iconY})`} // Rotate icon with segment
                  >
                    <prize.icon strokeWidth={2} />
                  </svg>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
