import {z} from 'zod';
export const wordmarkStyles=['original','dotted','modern','condensed','terminal','wide','bold','italic','serif','slab','rounded','outline'] as const;
export const wordmarkNames:Record<typeof wordmarkStyles[number],string>={original:'Original',dotted:'P.L.U.T.O',modern:'Modern',condensed:'Condensed',terminal:'Terminal',wide:'Wide',bold:'Bold',italic:'Italic',serif:'Classic serif',slab:'Slab',rounded:'Rounded',outline:'Outline'};
export const defaultPalette:Palette={primaryColor:'#69d8f3',secondaryColor:'#b1a0ff',tertiaryColor:'#87a8bc',wordmarkStyle:'original',clockFormat:'24h',background:'current' as const};
export const paletteSchema=z.object({primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),secondaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),tertiaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#87a8bc'),clockFormat:z.enum(['12h','24h']).default('24h'),wordmarkStyle:z.enum(wordmarkStyles).default('original'),background:z.enum(['current','black','white']).default('current')}).strict();
export type Palette=z.infer<typeof paletteSchema>;
