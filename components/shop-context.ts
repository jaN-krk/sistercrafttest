'use client';
import {createContext,useContext} from 'react';
import type {Product,PublicConfig,Cart} from '@/lib/catalog';
export type ShopState={products:Product[];config:PublicConfig;cart:Cart|null;cartOpen:boolean;setCartOpen:(b:boolean)=>void;waitFor:(p:Product)=>void;setQuantity:(p:Product,n:number)=>Promise<void>;request:(path:string,data?:unknown)=>Promise<any>;refresh:()=>Promise<void>;busy:boolean;};
export const ShopContext=createContext<ShopState|null>(null);
export const useShop=()=>{const c=useContext(ShopContext);if(!c)throw Error('Store context missing');return c;};
