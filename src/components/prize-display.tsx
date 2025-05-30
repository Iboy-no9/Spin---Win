"use client";

import type { Prize } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PrizeDisplayProps {
  winningPrize: Prize | null;
}

export function PrizeDisplay({ winningPrize }: PrizeDisplayProps) {
  return (
    <Card className="w-full max-w-md text-center shadow-lg border-primary rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-semibold text-primary">
          {winningPrize ? '🎉 Congratulations! 🎉' : 'Spin Results'}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[120px] flex flex-col items-center justify-center p-6">
        {winningPrize ? (
          <>
            <CardDescription className="text-lg mb-2 text-muted-foreground">You've won:</CardDescription>
            <div className="flex items-center justify-center gap-3 text-foreground text-3xl font-bold mt-1">
              {winningPrize.icon && (
                <winningPrize.icon className="h-10 w-10 text-primary" strokeWidth={2} />
              )}
              <span>{winningPrize.name}</span>
            </div>
          </>
        ) : (
          <p className="text-xl text-muted-foreground">Click the SPIN button to test your luck!</p>
        )}
      </CardContent>
    </Card>
  );
}
