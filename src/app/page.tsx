
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
  { id: 'better-luck', name: 'Better Luck Next Time', probability: 0.41, color: '#CFD8DC', textColor: '#37474F', icon: Meh },
  { id: 'sweets', name: 'Sweets', probability: 0.39, color: '#F8BBD0', textColor: '#880E4F', icon: Gift },
  { id: '10-rupees', name: '10 Rupees', probability: 0.13, color: '#BBDEFB', textColor: '#1565C0', icon: (props) => <RupeeCircleIcon {...props} amount="10" />, value: 10 },
  { id: '20-rupees', name: '20 Rupees', probability: 0.04, color: '#B2EBF2', textColor: '#00838F', icon: (props) => <RupeeCircleIcon {...props} amount="20" />, value: 20 },
  { id: '50-rupees', name: '50 Rupees', probability: 0.02, color: '#C8E6C9', textColor: '#2E7D32', icon: (props) => <RupeeCircleIcon {...props} amount="50" />, value: 50 },
  { id: '100-rupees', name: '100 Rupees', probability: 0.01, color: '#FFF9C4', textColor: '#F9A825', icon: (props) => <RupeeCircleIcon {...props} amount="100" />, value: 100 },
];

// Validate probabilities sum to 1
const totalProbability = PRIZES_CONFIG.reduce((sum, prize) => sum + prize.probability, 0);
if (Math.abs(totalProbability - 1.0) > 1e-5) {
  console.warn(`Total prize probability is ${totalProbability}, not 1.0. Please check PRIZES_CONFIG.`);
}

const SERVER_DEFAULT_WHEEL_SIZE = 300;
const MAX_CLAIMABLE_RUPEES = 500;
const CLAIMED_AMOUNT_STORAGE_KEY = 'spinWinTotalClaimedAmount';

export default function HomePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPrize, setTargetPrize] = useState<Prize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState<{width: number, height: number} | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [dynamicWheelSize, setDynamicWheelSize] = useState<number>(SERVER_DEFAULT_WHEEL_SIZE);
  const [totalClaimedAmount, setTotalClaimedAmount] = useState<number>(0);


  useEffect(() => {
    setIsClient(true);

    const updateSizes = () => {
      if (typeof window !== 'undefined') {
        setWindowSize({width: window.innerWidth, height: window.innerHeight});
        setDynamicWheelSize(Math.round(Math.min(420, window.innerWidth * 0.85)));
      }
    };
    
    updateSizes(); // Initial call

    const storedAmount = localStorage.getItem(CLAIMED_AMOUNT_STORAGE_KEY);
    if (storedAmount) {
      setTotalClaimedAmount(parseInt(storedAmount, 10) || 0);
    }
    

    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(CLAIMED_AMOUNT_STORAGE_KEY, totalClaimedAmount.toString());
    }
  }, [totalClaimedAmount, isClient]);


  const handleSpin = () => {
    if (!isClient || isSpinning) return;

    let availablePrizes: Prize[];
    const currentTotalClaimed = totalClaimedAmount;

    if (currentTotalClaimed >= MAX_CLAIMABLE_RUPEES) {
      // Only non-cash prizes are available
      availablePrizes = PRIZES_CONFIG.filter(p => !p.value);
    } else {
      // All non-cash prizes + cash prizes that don't exceed the limit
      availablePrizes = PRIZES_CONFIG.filter(p => {
        if (!p.value) return true; // Non-cash prize
        return currentTotalClaimed + p.value <= MAX_CLAIMABLE_RUPEES;
      });
    }

    // If all cash prizes are filtered out and only non-cash prizes remain,
    // availablePrizes will correctly reflect that.
    // If availablePrizes is empty (e.g. if somehow all prizes were cash and over limit), fallback.
    if (availablePrizes.length === 0) {
      const betterLuckPrize = PRIZES_CONFIG.find(p => p.id === 'better-luck');
      if (betterLuckPrize) {
        setTargetPrize(betterLuckPrize);
        setIsSpinning(true);
        return;
      }
      // Should not happen if 'better-luck' is always in PRIZES_CONFIG
      console.error("No available prizes and 'better-luck' not found.");
      return;
    }
    
    // Re-normalize probabilities for the available prizes
    const sumOfAvailableProbabilities = availablePrizes.reduce((sum, prize) => sum + prize.probability, 0);
    
    let random = Math.random() * sumOfAvailableProbabilities;
    let determinedPrize: Prize | null = null;

    for (const prize of availablePrizes) {
      if (random < prize.probability) {
        determinedPrize = prize;
        break;
      }
      random -= prize.probability;
    }

    // Fallback if somehow no prize is chosen (should be rare with correct logic)
    if (!determinedPrize && availablePrizes.length > 0) {
      determinedPrize = availablePrizes[availablePrizes.length - 1];
    } else if (!determinedPrize) {
        // Ultimate fallback to better-luck if something went wrong
        determinedPrize = PRIZES_CONFIG.find(p => p.id === 'better-luck') || PRIZES_CONFIG[0];
    }
    
    setTargetPrize(determinedPrize);
    setIsSpinning(true);
  };

  const handleSpinComplete = useCallback((prize: Prize) => {
    setIsSpinning(false);
    
    if (prize.value && (totalClaimedAmount + prize.value <= MAX_CLAIMABLE_RUPEES)) {
        setTotalClaimedAmount(prev => prev + (prize.value || 0));
    }

    if (prize.id !== 'better-luck') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }

    toast({
      title: "Spin Complete!",
      description: `You won: ${prize.name}`,
      variant: prize.id === 'better-luck' ? 'default' : 'default',
      duration: 5000,
    });
    setTargetPrize(null); // Clear target prize for next spin
  }, [toast, totalClaimedAmount]);

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
        {isClient && <p className="text-sm text-primary mt-1">Total Cash Claimed: ₹{totalClaimedAmount} / ₹{MAX_CLAIMABLE_RUPEES}</p>}
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

