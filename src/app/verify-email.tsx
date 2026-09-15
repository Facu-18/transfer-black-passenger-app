import { UpcomingScreen } from '@/presentation/screens/UpcomingScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';

// Provisoria hasta el ticket de verificación de correo.
export default function VerifyEmailRoute() {
  const email = useAuthStore((state) => state.user?.email);

  return (
    <UpcomingScreen
      title="Verifica tu correo"
      description={
        // La misma pantalla recibe a quien acaba de registrarse y a quien inicia sesion sin haber verificado.
        email
          ? `Confirma tu dirección con el enlace que te enviamos a ${email}.`
          : 'Confirma tu dirección con el enlace que te enviamos por correo.'
      }
    />
  );
}
