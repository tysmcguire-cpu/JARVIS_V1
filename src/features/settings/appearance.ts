import {z} from 'zod';
export const defaultPalette={primaryColor:'#69d8f3',secondaryColor:'#b1a0ff'};
export const paletteSchema=z.object({primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),secondaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/)}).strict();
export type Palette=z.infer<typeof paletteSchema>;
