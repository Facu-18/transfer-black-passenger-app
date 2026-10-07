import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { colors } from '@/presentation/theme/colors';

interface GlassSurfaceProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

/** Lightweight glass-like surface using the existing palette; intentionally avoids runtime blur. */
export function GlassSurface({ children, className = '', ...props }: GlassSurfaceProps) {
  return (
    <View
      {...props}
      className={`relative overflow-hidden border border-platinum/10 bg-surface/85 ${className}`}
      style={[
        {
          elevation: 2,
          shadowColor: colors.charcoal,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          borderTopColor: `${colors.platinum}33`,
          borderBottomColor: `${colors.platinum}0D`,
        },
        props.style,
      ]}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute left-4 right-4 top-0 z-10 h-px bg-platinum/20"
      />
      {children}
    </View>
  );
}
