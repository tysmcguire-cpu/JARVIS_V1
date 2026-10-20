'use client';
import {createContext,useContext,useState,type CSSProperties,type ReactNode} from 'react';
import {defaultPalette,type Palette} from './appearance';
const AppearanceContext=createContext({palette:defaultPalette,apply:(value:Palette)=>{void value}});
export const useAppearance=()=>useContext(AppearanceContext);
export function AppearanceProvider({children,initial=defaultPalette}:{children:ReactNode;initial?:Palette}){
 const [palette,apply]=useState(initial);
 return <AppearanceContext.Provider value={{palette,apply}}><div className="appearance-root" data-background={palette.background} style={{'--app-primary':palette.primaryColor,'--app-secondary':palette.secondaryColor,'--app-tertiary':palette.tertiaryColor} as CSSProperties}>{children}</div></AppearanceContext.Provider>;
}
