'use client';
import Link,{useLinkStatus} from 'next/link';
import {useRouter} from 'next/navigation';
import {useRef,type ComponentProps} from 'react';
function Pending(){const {pending}=useLinkStatus();return <span className="navigation-pending" data-pending={pending} aria-hidden="true"/>}
export function NavigationLink({children,onMouseEnter,onFocus,...props}:ComponentProps<typeof Link>){
 const router=useRouter(),warmed=useRef(0);
 const warm=()=>{if(Date.now()-warmed.current<30000||typeof props.href!=='string')return;warmed.current=Date.now();router.prefetch(props.href)};
 return <Link {...props} prefetch={false} onMouseEnter={event=>{warm();onMouseEnter?.(event)}} onFocus={event=>{warm();onFocus?.(event)}}>{children}<Pending/></Link>;
}
