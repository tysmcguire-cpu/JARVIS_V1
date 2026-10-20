import {z} from 'zod';
export const defaultPalette:Palette={primaryColor:'#69d8f3',secondaryColor:'#b1a0ff',tertiaryColor:'#87a8bc',background:'current' as const};
export const paletteSchema=z.object({primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),secondaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),tertiaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#87a8bc'),background:z.enum(['current','black','white']).default('current')}).strict();
export type Palette=z.infer<typeof paletteSchema>;
