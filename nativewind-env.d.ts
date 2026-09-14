/// <reference types="nativewind/types" />

// TypeScript 6 verifica los imports de efecto (`import './global.css'`) y NativeWind no declara los .css.
declare module '*.css';
