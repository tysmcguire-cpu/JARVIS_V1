'use client';
import {createContext,useContext,useState,useMemo,type CSSProperties,type ReactNode} from 'react';
import {defaultPalette,type Palette} from './appearance';
import {visiblePalette} from './contrast';
const AppearanceContext=createContext({palette:defaultPalette,colors:visiblePalette(defaultPalette),apply:(value:Palette)=>{void value}});
export const useAppearance=()=>useContext(AppearanceContext);
export function AppearanceProvider({children,initial=defaultPalette}:{children:ReactNode;initial?:Palette}){
 const [palette,apply]=useState(initial);
 const colors=useMemo(()=>visiblePalette(palette),[palette]);
 return <AppearanceContext.Provider value={{palette,colors,apply}}><div className="appearance-root" data-background={palette.background} style={{'--app-primary':colors.primaryColor,'--app-secondary':colors.secondaryColor,'--app-tertiary':colors.tertiaryColor} as CSSProperties}>{children}</div></AppearanceContext.Provider>;
}
