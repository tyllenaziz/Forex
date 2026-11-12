import { z } from 'zod';
export const KycSubmitSchema = z.object({
  documents: z.array(z.string().url()).min(1),
});
export type KycSubmitInput = z.infer<typeof KycSubmitSchema>;