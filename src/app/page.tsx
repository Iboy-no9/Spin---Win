
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Prize } from '@/types';
import { SpinWheel } from '@/components/spin-wheel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import Confetti from 'react-confetti';
import { Meh, Instagram, MessageCircle, User } from 'lucide-react';
import { RupeeCircleIcon } from '@/components/rupee-circle-icon';

const PRIZES_CONFIG: Prize[] = [
  { id: 'better-luck', name: 'Better Luck Next Time', probability: 0.985, color: '#CFD8DC', textColor: '#37474F', icon: Meh, value: 0 },
  { id: '100-rupees', name: '100 Rupees', probability: 0.015, color: '#FFF9C4', textColor: '#F9A825', icon: (props) => <RupeeCircleIcon {...props} amount="100" />, value: 100 },
];

const totalProbability = PRIZES_CONFIG.reduce((sum, prize) => sum + prize.probability, 0);
if (Math.abs(totalProbability - 1.0) > 1e-5) {
  console.warn(`Total prize probability is ${totalProbability}, not 1.0. Please check PRIZES_CONFIG.`);
}

const SERVER_DEFAULT_WHEEL_SIZE = 300;
const MAX_CLAIMABLE_RUPEES = 500; // This constant remains but is not currently used for display
const CLAIMED_AMOUNT_STORAGE_KEY = 'spinWinTotalClaimedAmount';
const CHANNEL_VERIFICATION_KEY = 'perunnalPaisaVerifiedChannels';
const SPIN_LIMIT_KEY = 'perunnalPaisaHasSpun';
const USER_NAME_KEY = 'perunnalPaisaUserName';
const NAME_SUBMITTED_KEY = 'perunnalPaisaNameSubmitted';

export default function HomePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPrize, setTargetPrize] = useState<Prize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState<{width: number, height: number} | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [dynamicWheelSize, setDynamicWheelSize] = useState<number>(SERVER_DEFAULT_WHEEL_SIZE);
  const [totalClaimedAmount, setTotalClaimedAmount] = useState<number>(0); // Still tracked for prize logic
  
  const [hasVerifiedChannels, setHasVerifiedChannels] = useState<boolean>(false);
  const [instagramLinkClicked, setInstagramLinkClicked] = useState<boolean>(false);
  const [whatsappLinkClicked, setWhatsappLinkClicked] = useState<boolean>(false);
  
  const [hasAlreadySpun, setHasAlreadySpun] = useState<boolean>(false);

  const [userName, setUserName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [nameSubmitted, setNameSubmitted] = useState<boolean>(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const storedVerification = localStorage.getItem(CHANNEL_VERIFICATION_KEY);
      if (storedVerification === 'true') {
        setHasVerifiedChannels(true);
      }

      const storedAmount = localStorage.getItem(CLAIMED_AMOUNT_STORAGE_KEY);
      if (storedAmount) {
        setTotalClaimedAmount(parseInt(storedAmount, 10) || 0);
      }

      const storedSpinStatus = localStorage.getItem(SPIN_LIMIT_KEY);
      if (storedSpinStatus === 'true') {
        setHasAlreadySpun(true);
      }

      const storedUserName = localStorage.getItem(USER_NAME_KEY);
      const storedNameSubmitted = localStorage.getItem(NAME_SUBMITTED_KEY);
      if (storedUserName && storedNameSubmitted === 'true') {
        setUserName(storedUserName);
        setNameSubmitted(true);
      }

      const updateSizes = () => {
        if (typeof window !== 'undefined') {
          setWindowSize({width: window.innerWidth, height: window.innerHeight});
          setDynamicWheelSize(Math.round(Math.min(420, window.innerWidth * 0.85)));
        }
      };
      updateSizes();
      window.addEventListener('resize', updateSizes);
      return () => window.removeEventListener('resize', updateSizes);
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(CLAIMED_AMOUNT_STORAGE_KEY, totalClaimedAmount.toString());
    }
  }, [totalClaimedAmount, isClient]);


  const handleSpin = () => {
    if (!isClient || isSpinning || hasAlreadySpun) return;

    let availablePrizes: Prize[];
    const currentTotalClaimed = totalClaimedAmount;

    if (currentTotalClaimed >= MAX_CLAIMABLE_RUPEES) {
      availablePrizes = PRIZES_CONFIG.filter(p => !p.value || p.value === 0);
    } else {
      availablePrizes = PRIZES_CONFIG.filter(p => {
        if (!p.value || p.value === 0) return true;
        return currentTotalClaimed + p.value <= MAX_CLAIMABLE_RUPEES;
      });
    }

    if (availablePrizes.length === 0) {
      const betterLuckPrize = PRIZES_CONFIG.find(p => p.id === 'better-luck');
      if (betterLuckPrize) {
        setTargetPrize(betterLuckPrize);
        setIsSpinning(true);
        if (isClient) localStorage.setItem(SPIN_LIMIT_KEY, 'true');
        setHasAlreadySpun(true);
        return;
      }
      console.error("No available prizes and 'better-luck' not found.");
      return;
    }
    
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

    if (!determinedPrize && availablePrizes.length > 0) {
      determinedPrize = availablePrizes[availablePrizes.length - 1];
    } else if (!determinedPrize) {
        determinedPrize = PRIZES_CONFIG.find(p => p.id === 'better-luck') || PRIZES_CONFIG[0];
    }
    
    setTargetPrize(determinedPrize);
    setIsSpinning(true);
    if (isClient) localStorage.setItem(SPIN_LIMIT_KEY, 'true');
    setHasAlreadySpun(true);
  };

  const handleSpinComplete = useCallback((prize: Prize) => {
    setIsSpinning(false);
    
    if (prize.value && prize.value > 0 && (totalClaimedAmount + prize.value <= MAX_CLAIMABLE_RUPEES)) {
        setTotalClaimedAmount(prev => prev + (prize.value || 0));
    }

    if (prize.id !== 'better-luck') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }

    toast({
      title: "Spin Complete!",
      description: `${userName || 'You'} won: ${prize.name}`,
      variant: prize.id === 'better-luck' ? 'default' : 'default',
      duration: 5000,
    });
    setTargetPrize(null);
  }, [toast, totalClaimedAmount, userName]);

  const handleVerification = () => {
    setHasVerifiedChannels(true);
    if (isClient) {
      localStorage.setItem(CHANNEL_VERIFICATION_KEY, 'true');
    }
  };

  const handleNameSubmit = () => {
    if (nameInput.trim() === '') {
      toast({ title: "Please enter your name.", description: "Name cannot be empty.", variant: "destructive" });
      return;
    }
    const finalName = nameInput.trim();
    setUserName(finalName);
    setNameSubmitted(true);
    if (isClient) {
      localStorage.setItem(USER_NAME_KEY, finalName);
      localStorage.setItem(NAME_SUBMITTED_KEY, 'true');
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        Loading App...
      </div>
    );
  }

  if (!hasVerifiedChannels) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <Card className="w-full max-w-lg shadow-xl rounded-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-primary">Join Us & Unlock the Fun!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground px-2">
              To enjoy spinning the Perunnal Paisa wheel, please take a moment to follow us on Instagram and join our WhatsApp chat. Click the links below.
            </p>
            <div className="space-y-3 px-4">
              <Button asChild className="w-full py-6 text-lg" variant="outline" onClick={() => setInstagramLinkClicked(true)}>
                <a href="https://www.instagram.com/lisanmedia_/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-2 h-5 w-5" />
                  Follow on Instagram
                </a>
              </Button>
              <Button asChild className="w-full py-6 text-lg" variant="outline" onClick={() => setWhatsappLinkClicked(true)}>
                <a href="https://www.whatsapp.com/channel/0029VbAaZUSCHDyfYczksp1t" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join WhatsApp Chat
                </a>
              </Button>
            </div>
            <Button
              onClick={handleVerification}
              disabled={!instagramLinkClicked || !whatsappLinkClicked}
              size="lg"
              className="w-full max-w-xs mx-auto mt-8 py-8 text-xl font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              I've Followed & Joined!
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground text-center pt-6 pb-4">
            <p className="w-full">Note: This step helps support our community. Thank you!</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <Card className="w-full max-w-md shadow-xl rounded-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center justify-center">
              <User className="mr-2 h-7 w-7" />
              Enter Your Name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 py-8">
            <p className="text-muted-foreground text-center">
              Please enter your name to personalize your spin!
            </p>
            <Input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your Name"
              className="text-lg py-6"
              maxLength={50}
            />
            <Button
              onClick={handleNameSubmit}
              size="lg"
              className="w-full py-8 text-xl font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Let's Spin!
            </Button>
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground text-center pt-4 pb-4">
            <p className="w-full">This name will be displayed with your spin result.</p>
          </CardFooter>
        </Card>
      </div>
    );
  }


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
            <CardTitle className="text-2xl font-semibold text-foreground">
              {userName ? `${userName}'s Turn to Spin!` : 'Spin The Wheel!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            <SpinWheel
              prizes={PRIZES_CONFIG}
              targetPrize={targetPrize}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              wheelSize={isClient ? dynamicWheelSize : SERVER_DEFAULT_WHEEL_SIZE}
            />
            {hasAlreadySpun ? (
              <p className="text-center text-lg text-primary font-semibold py-4">
                You've already had your spin for this Perunnal, {userName}! See you next time!
              </p>
            ) : (
              <Button
                onClick={handleSpin}
                disabled={isSpinning || !isClient || hasAlreadySpun}
                size="lg"
                className="px-16 py-8 text-xl font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                aria-label="Spin the wheel"
              >
                {isSpinning ? 'Spinning...' : 'SPIN!'}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto pt-8 pb-6 text-center text-muted-foreground text-sm">
        <p>&copy; 2025 Perunnal Spinner. Celebrate responsibly!</p>
      </footer>
    </div>
  );
}

