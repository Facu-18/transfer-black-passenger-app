import { CalendarDays, FileText, MapPin, Phone, UserRound } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import type { DocumentType, Gender } from '@/infrastructure/interfaces/auth';
import { BrandLogo } from '@/presentation/components/BrandLogo';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useCompleteProfileForm } from '@/presentation/hooks/useCompleteProfileForm';

interface Choice<T extends string> {
  label: string;
  value: T;
}

function ChoiceField<T extends string>({
  label,
  value,
  choices,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: T | undefined;
  choices: Choice<T>[];
  error?: string | undefined;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-widest">
        {label}
      </Typography>
      <View className="flex-row gap-2">
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(choice.value)}
              className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-2 ${
                selected ? 'border-gold bg-gold/15' : 'border-charcoal bg-field'
              }`}
            >
              <Typography variant="caption" weight="semibold" tone={selected ? 'accent' : 'secondary'}>
                {choice.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
      {error ? <Typography variant="caption" tone="danger">{error}</Typography> : null}
    </View>
  );
}

const GENDER_CHOICES: Choice<Gender>[] = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Femenino', value: 'FEMENINO' },
  { label: 'Otro', value: 'OTRO' },
];

const DOCUMENT_CHOICES: Choice<DocumentType>[] = [
  { label: 'DNI', value: 'DNI' },
  { label: 'CUIL', value: 'CUIL' },
];

export function CompleteProfileScreen() {
  const { form, submit } = useCompleteProfileForm();
  const { control, formState: { errors, isSubmitting } } = form;

  return (
    <Screen scrollable contentClassName="gap-7">
      <View className="items-center gap-3">
        <BrandLogo size="md" />
        <Typography variant="h2" className="text-center">Completa tu perfil</Typography>
        <Typography tone="secondary" className="text-center">
          Necesitamos estos datos para habilitar la solicitud de viajes. Tu foto de perfil es opcional.
        </Typography>
      </View>

      <View className="gap-4 rounded-3xl border border-charcoal bg-surface/90 p-5">
        <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Nombre" icon={UserRound} value={value} onChangeText={onChange} onBlur={onBlur}
            autoCapitalize="words" autoComplete="given-name" error={errors.firstName?.message} editable={!isSubmitting} />
        )} />

        <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Apellido" icon={UserRound} value={value} onChangeText={onChange} onBlur={onBlur}
            autoCapitalize="words" autoComplete="family-name" error={errors.lastName?.message} editable={!isSubmitting} />
        )} />

        <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Teléfono" icon={Phone} placeholder="+54 9 351 555 0199" value={value}
            onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" autoComplete="tel"
            error={errors.phone?.message} editable={!isSubmitting} />
        )} />

        <Controller control={control} name="birthDate" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Fecha de nacimiento" icon={CalendarDays} placeholder="AAAA-MM-DD" value={value}
            onChangeText={onChange} onBlur={onBlur} keyboardType="numbers-and-punctuation"
            error={errors.birthDate?.message} editable={!isSubmitting} />
        )} />

        <Controller control={control} name="gender" render={({ field: { onChange, value } }) => (
          <ChoiceField label="Género" value={value} choices={GENDER_CHOICES} error={errors.gender?.message}
            disabled={isSubmitting} onChange={onChange} />
        )} />

        <Controller control={control} name="documentType" render={({ field: { onChange, value } }) => (
          <ChoiceField label="Tipo de documento" value={value} choices={DOCUMENT_CHOICES}
            error={errors.documentType?.message} disabled={isSubmitting} onChange={onChange} />
        )} />

        <Controller control={control} name="documentNumber" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Número de documento" icon={FileText} value={value} onChangeText={onChange}
            onBlur={onBlur} keyboardType="number-pad" error={errors.documentNumber?.message} editable={!isSubmitting} />
        )} />

        <Controller control={control} name="address" render={({ field: { onChange, onBlur, value } }) => (
          <VIPTextInput label="Dirección" icon={MapPin} placeholder="Calle, número, ciudad" value={value}
            onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" autoComplete="street-address"
            error={errors.address?.message} editable={!isSubmitting} />
        )} />

        {errors.root?.server?.message ? (
          <Typography tone="danger" className="text-center" accessibilityLiveRegion="polite">
            {errors.root.server.message}
          </Typography>
        ) : null}

        <VIPButton title="Guardar y continuar" loading={isSubmitting} onPress={() => void submit()} />
      </View>
    </Screen>
  );
}
