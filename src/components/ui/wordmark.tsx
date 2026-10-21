import type {Palette} from '@/features/settings/appearance';
import {product} from '@/features/commercial/product';
import styles from './wordmark.module.css';
export function Wordmark({variant,preview=false}:{variant:Palette['wordmarkStyle'];preview?:boolean}){return <strong className={styles.wordmark} data-wordmark-style={variant} style={preview?{fontSize:24}:undefined}>{variant==='dotted'?product.wordmark.split('').join('.'):product.wordmark}</strong>}
