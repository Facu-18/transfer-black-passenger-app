import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, lineLimit, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { TripTrackingProps } from '@/presentation/utils/trip-tracking-content';

/**
 * Live Activity del viaje (pantalla bloqueada + Dynamic Island), solo iOS.
 *
 * La funcion lleva la directiva `'widget'`: se compila aparte y corre en la
 * extension del widget, sin acceso al resto de la app. Por eso no puede usar
 * nada declarado fuera de su cuerpo: los colores se repiten aca a proposito
 * (son los tokens de `presentation/theme/colors.js`; mantenerlos iguales) y
 * todo lo demas llega por props, las mismas que manda el backend.
 */
const TripTrackingActivity = (props: TripTrackingProps, environment: LiveActivityEnvironment) => {
  'widget';
  const gold = environment.isLuminanceReduced ? '#E4E4E5' : '#D4AF37';
  const platinum = '#E4E4E5';
  const ash = '#8E8E93';
  const eta = props.etaEndsAt !== null && props.etaEndsAt > Date.now() ? new Date(props.etaEndsAt) : null;
  const vehicleLine = [props.vehicle, props.plate].filter(Boolean).join(' · ');

  const trailing = eta ? (
    <Text date={eta} dateStyle="timer" modifiers={[font({ weight: 'semibold', design: 'rounded' }), foregroundStyle(gold)]} />
  ) : (
    <Text modifiers={[font({ weight: 'semibold' }), foregroundStyle(gold)]}>{props.plate ?? props.shortText}</Text>
  );

  return {
    banner: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 16 })]}>
        <HStack spacing={10}>
          <Image systemName="car.fill" color={gold} size={22} />
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(platinum), lineLimit(1)]}>
              {props.title}
            </Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(ash), lineLimit(1)]}>{props.subtitle}</Text>
          </VStack>
          <Spacer />
          {trailing}
        </HStack>
        {vehicleLine ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(ash), lineLimit(1)]}>{vehicleLine}</Text>
        ) : null}
        <ProgressView value={props.progress / 100} modifiers={[tint(gold)]} />
      </VStack>
    ),
    compactLeading: <Image systemName="car.fill" color={gold} />,
    compactTrailing: eta ? (
      <Text date={eta} dateStyle="timer" modifiers={[foregroundStyle(gold)]} />
    ) : (
      <Text modifiers={[foregroundStyle(gold)]}>{props.shortText}</Text>
    ),
    minimal: <Image systemName="car.fill" color={gold} />,
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 8 })]}>
        <Image systemName="car.fill" color={gold} size={20} />
        <Text modifiers={[font({ size: 12 }), foregroundStyle(ash)]}>{props.publicCode}</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack alignment="trailing" spacing={2} modifiers={[padding({ trailing: 8 })]}>
        {trailing}
      </VStack>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 8, bottom: 8 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(platinum), lineLimit(1)]}>
          {props.title}
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(ash), lineLimit(1)]}>
          {vehicleLine || props.subtitle}
        </Text>
        <ProgressView value={props.progress / 100} modifiers={[tint(gold)]} />
      </VStack>
    ),
  };
};

/** El nombre tiene que coincidir con `TRIP_TRACKING_ACTIVITY_NAME` (lo que manda el backend). */
export default createLiveActivity<TripTrackingProps>('TripTracking', TripTrackingActivity);
