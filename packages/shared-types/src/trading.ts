import { z } from 'zod';

export const OrderSide = z.enum(['BUY', 'SELL']);
export const OrderType = z.enum(['MARKET', 'LIMIT', 'STOP']);

export const PlaceOrderSchema = z.object({
  symbol: z.string().min(3),
  side: OrderSide,
  type: OrderType,
  volume: z.number().positive(),
  price: z.number().positive().optional(), // for LIMIT/STOP
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;