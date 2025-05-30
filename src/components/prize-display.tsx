"use client";

import type { Prize } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Smile } from 'lucide-react'; // Default icons

interface PrizeDisplayProps {
  winningPrize: Prize | null;
}

export function PrizeDisplay({ winningPrize }: PrizeDisplayProps) {
  return (
    <Card className="w-full max-w-md text-center shadow-lg border-accent">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {winningPrize ? '🎉 Congratulations! 🎉' : 'Spin to Win!'}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[100px] flex flex-col items-center justify-center">
        {winningPrize ? (
          <>
            <p className="text-lg mb-2">You won:</p>
            <div className="flex items-center justify-center gap-2 text-accent text-3xl font-bold">
              {winningPrize.icon && (
                <winningPrize.icon className="h-10 w-10" />
              )}
              <span>{winningPrize.name}</span>
            </div>
          </>
        ) : (
          <p className="text-xl text-muted-foreground">Click the button below to try your luck!</p>
        )}
      </CardContent>
    </Card>
  );
}
