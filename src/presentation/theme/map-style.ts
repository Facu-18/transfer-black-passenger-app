import type { MapStyleElement } from 'react-native-maps';

import { colors } from './colors';

/**
 * Estilo oscuro de Google Maps (Android): paleta de la marca y sin puntos de
 * interes, transporte ni etiquetas de negocios. Los nombres de las calles se
 * ven (con el mismo tono que el resto de las etiquetas) para que el pasajero
 * se ubique. En iOS el mapa es Apple Maps y
 * el modo oscuro sale de `userInterfaceStyle`.
 *
 * Los tonos intermedios no son tokens de la app: solo existen dentro del mapa
 * para separar agua, calles y manzanas.
 */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: colors.obsidian }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colors.ash }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.obsidian }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: colors.charcoal }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#101012' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.field }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: colors.obsidian }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: colors.charcoal }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050507' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: colors.charcoal }] },
];
