// URLs de las paginas legales (panel), overrideables por variable de entorno
// para apuntar a otro ambiente sin tocar el codigo.

export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://transfer-black-admin.vercel.app/terminos';

export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://transfer-black-admin.vercel.app/privacidad';
