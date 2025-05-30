
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Prize } from '@/types';
import { SpinWheel } from '@/components/spin-wheel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import Confetti from 'react-confetti';
import { Meh, Gift } from 'lucide-react';
import { RupeeCircleIcon } from '@/components/rupee-circle-icon';

const PRIZES_CONFIG: Prize[] = [
  { id: 'better-luck', name: 'Better Luck Next Time', probability: 0.40, color: '#CFD8DC', textColor: '#37474F', icon: Meh },
  { id: 'sweets', name: 'Sweets', probability: 0.38, color: '#F8BBD0', textColor: '#880E4F', icon: Gift },
  { id: '10-rupees', name: '10 Rupees', probability: 0.10, color: '#BBDEFB', textColor: '#1565C0', icon: (props) => <RupeeCircleIcon {...props} amount="10" /> },
  { id: '20-rupees', name: '20 Rupees', probability: 0.05, color: '#B2EBF2', textColor: '#00838F', icon: (props) => <RupeeCircleIcon {...props} amount="20" /> },
  { id: '50-rupees', name: '50 Rupees', probability: 0.05, color: '#C8E6C9', textColor: '#2E7D32', icon: (props) => <RupeeCircleIcon {...props} amount="50" /> },
  { id: '100-rupees', name: '100 Rupees', probability: 0.02, color: '#FFF9C4', textColor: '#F9A825', icon: (props) => <RupeeCircleIcon {...props} amount="100" /> },
];

// Validate probabilities sum to 1
const totalProbability = PRIZES_CONFIG.reduce((sum, prize) => sum + prize.probability, 0);
if (Math.abs(totalProbability - 1.0) > 1e-5) {
  console.warn(`Total prize probability is ${totalProbability}, not 1.0. Please check PRIZES_CONFIG.`);
}

const SERVER_DEFAULT_WHEEL_SIZE = 300;

export default function HomePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPrize, setTargetPrize] = useState<Prize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState<{width: number, height: number} | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [dynamicWheelSize, setDynamicWheelSize] = useState<number>(SERVER_DEFAULT_WHEEL_SIZE);

  const determinePrize = useCallback((): Prize => {
    let random = Math.random();
    let cumulativeProbability = 0;
    for (const prize of PRIZES_CONFIG) {
      cumulativeProbability += prize.probability;
      if (random < cumulativeProbability) {
        return prize;
      }
    }
    return PRIZES_CONFIG[PRIZES_CONFIG.length - 1];
  }, []);

  useEffect(() => {
    setIsClient(true);

    const updateSizes = () => {
      setWindowSize({width: window.innerWidth, height: window.innerHeight});
      // Ensure dynamicWheelSize is only calculated on the client after mount and is an integer
      setDynamicWheelSize(Math.round(Math.min(420, window.innerWidth * 0.85)));
    };

    // Set initial size on client mount
    if (typeof window !== 'undefined') {
      updateSizes();
    }

    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);


  const handleSpin = () => {
    if (!isClient || isSpinning) return;

    setIsSpinning(true);
    const determinedPrize = determinePrize();
    setTargetPrize(determinedPrize);
  };

  const handleSpinComplete = useCallback((prize: Prize) => {
    setIsSpinning(false);
    setTargetPrize(null); // Clear target prize for next spin

    if (prize.id !== 'better-luck') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }

    toast({
      title: "Spin Complete!",
      description: `You won: ${prize.name}`,
      variant: prize.id === 'better-luck' ? 'default' : 'default', // 'default' can be 'destructive' or other variants
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-background">
      {showConfetti && windowSize && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.1}
        />
      )}
      <header className="text-center mt-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-foreground">പെരുന്നാൾ</span><span className="text-accent">പൈസ</span>
        </h1>
        <p className="text-muted-foreground text-base mt-2">Spin the wheel and try your luck to win exciting prizes this Perunnal!</p>
      </header>

      <main className="flex flex-col items-center space-y-8 w-full max-w-md">
        <Card className="w-full shadow-xl border-none rounded-xl">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-semibold text-foreground">Spin The Wheel!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            <SpinWheel
              prizes={PRIZES_CONFIG}
              targetPrize={targetPrize}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              wheelSize={isClient ? dynamicWheelSize : SERVER_DEFAULT_WHEEL_SIZE}
            />
            <Button
              onClick={handleSpin}
              disabled={isSpinning || !isClient}
              size="lg"
              className="px-16 py-8 text-xl font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              aria-label="Spin the wheel"
            >
              {isSpinning ? 'Spinning...' : 'SPIN!'}
            </Button>
          </CardContent>
        </Card>

      </main>

      <footer className="mt-auto pt-8 pb-6 text-center text-muted-foreground text-sm">
        <p>&copy; 2025 Perunnal Spinner. Celebrate responsibly!</p>
      </footer>
    </div>
  );
}
