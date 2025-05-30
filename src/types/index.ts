
import type { LucideIcon } from 'lucide-react';

export interface Prize {
  id: string;
  name: string;
  probability: number; // Sum of all prize probabilities should be 1
  color: string; // Hex color string for the segment background
  textColor?: string; // Optional: Hex color string for text, defaults to contrasting color
  icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  value?: number; // Monetary value of the prize, if applicable
}
