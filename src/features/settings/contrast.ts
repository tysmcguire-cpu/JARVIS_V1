import type {Palette} from './appearance';
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hex=(values:number[])=>'#'+values.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
function luminance(color:string){return rgb(color).map(n=>{const s=n/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0)}
export function contrastRatio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
/** Preserve the stored preference; move only its rendered shade toward black/white. */
export function readableColor(color:string,light:boolean){
 const surfaces=light?['#ffffff','#f3f3f3']:['#000000','#131719','#262626','#0b1018','#0d131d','#111b28','#1b2938','#14212e','#223344'];
 const passes=(value:string)=>surfaces.every(surface=>contrastRatio(value,surface)>=4.5);
 if(passes(color))return color;
 const source=rgb(color),target=light?0:255;
 for(let step=1;step<=255;step++){const adjusted=hex(source.map(n=>n+(target-n)*step/255));if(passes(adjusted))return adjusted}
 return light?'#000000':'#ffffff';
}
export function visiblePalette(palette:Palette):Palette{const light=palette.background==='white';return {...palette,primaryColor:readableColor(palette.primaryColor,light),secondaryColor:readableColor(palette.secondaryColor,light),tertiaryColor:readableColor(palette.tertiaryColor,light)}}
