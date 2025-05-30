"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Prize } from '@/types';
import { SpinWheel } from '@/components/spin-wheel';
import { PrizeDisplay } from '@/components/prize-display';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Candy, SmilePlus, DollarSign, AlertTriangle } from 'lucide-react'; // Using DollarSign as a generic for money

const PRIZES_CONFIG: Prize[] = [
  { id: 'better-luck', name: 'Better Luck!', probability: 0.30, color: '#94A3B8', textColor: '#FFFFFF', icon: SmilePlus }, // Tailwind Slate 400
  { id: 'sweets', name: 'Sweets', probability: 0.25, color: '#EC4899', textColor: '#FFFFFF', icon: Candy }, // Tailwind Pink 500
  { id: '10-rupees', name: '₹10', probability: 0.20, color: '#34D399', textColor: '#000000', icon: DollarSign }, // Tailwind Emerald 400
  { id: '20-rupees', name: '₹20', probability: 0.10, color: '#FACC15', textColor: '#000000', icon: DollarSign }, // Tailwind Yellow 400
  { id: '50-rupees', name: '₹50', probability: 0.10, color: '#FB923C', textColor: '#000000', icon: DollarSign }, // Tailwind Orange 400
  { id: '100-rupees', name: '₹100', probability: 0.05, color: '#A78BFA', textColor: '#FFFFFF', icon: DollarSign }, // Tailwind Violet 400
];

// Validate probabilities sum to 1
const totalProbability = PRIZES_CONFIG.reduce((sum, prize) => sum + prize.probability, 0);
if (Math.abs(totalProbability - 1.0) > 1e-5) {
  console.warn(`Total prize probability is ${totalProbability}, not 1.0. Please check PRIZES_CONFIG.`);
  // Optionally, normalize or throw error. For now, just a warning.
}


export default function HomePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPrize, setTargetPrize] = useState<Prize | null>(null);
  const [finalWinningPrize, setFinalWinningPrize] = useState<Prize | null>(null);
  const { toast } = useToast();

  const determinePrize = useCallback((): Prize => {
    let random = Math.random(); // Ensure this runs client-side
    let cumulativeProbability = 0;
    for (const prize of PRIZES_CONFIG) {
      cumulativeProbability += prize.probability;
      if (random < cumulativeProbability) {
        return prize;
      }
    }
    // Fallback, should ideally not be reached if probabilities sum to 1 and are correct.
    return PRIZES_CONFIG[PRIZES_CONFIG.length - 1];
  }, []);
  
  // Ensure Math.random is only called on client after mount
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleSpin = () => {
    if (!isClient || isSpinning) return;

    setIsSpinning(true);
    setFinalWinningPrize(null); 
    const determinedPrize = determinePrize();
    setTargetPrize(determinedPrize);
  };

  const handleSpinComplete = useCallback((prize: Prize) => {
    setIsSpinning(false);
    setFinalWinningPrize(prize);
    setTargetPrize(null); // Clear target for next spin
    toast({
      title: "Spin Complete!",
      description: `You won: ${prize.name}`,
      variant: prize.id === 'better-luck' ? 'default' : 'default', // Could use 'destructive' for "better luck" if desired
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-background">
      <header className="text-center">
        <h1 className="text-5xl font-bold text-primary tracking-tight" style={{ fontFamily: "'Arial Black', Gadget, sans-serif" }}>
          Spin<span className="text-accent">Win</span>
        </h1>
        <p className="text-muted-foreground text-lg mt-2">Test your luck and win exciting prizes!</p>
      </header>

      <main className="flex flex-col items-center space-y-8 w-full">
        <SpinWheel
          prizes={PRIZES_CONFIG}
          targetPrize={targetPrize}
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
          wheelSize={Math.min(500, typeof window !== 'undefined' ? window.innerWidth * 0.8 : 360)} // Responsive wheel size
        />

        <Button
          onClick={handleSpin}
          disabled={isSpinning || !isClient}
          size="lg"
          className="px-12 py-6 text-xl font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Spin the wheel"
        >
          {isSpinning ? 'Spinning...' : 'SPIN!'}
        </Button>

        <PrizeDisplay winningPrize={finalWinningPrize} />
      </main>
      
      <footer className="mt-auto pt-8 pb-4 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} SpinWin. All rights reserved.</p>
        <p>Enjoy the game responsibly.</p>
      </footer>
    </div>
  );
}
