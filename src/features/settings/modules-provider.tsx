'use client';
import {createContext,useContext,type ReactNode} from 'react';
import {optionalModules} from './profile-contract';
const Modules=createContext<readonly string[]>(optionalModules);
export function ModulesProvider({children,enabled}:{children:ReactNode;enabled:readonly string[]}){return <Modules.Provider value={enabled}>{children}</Modules.Provider>}
export function useEnabledModules(){const selected=useContext(Modules);return (slug:string)=>!optionalModules.includes(slug as typeof optionalModules[number])||selected.includes(slug)}
