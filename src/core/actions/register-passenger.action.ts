import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { AuthSession, AuthUser } from '@/infrastructure/interfaces/auth';
import type {
  AuthSessionResponse,
  RegisterPassengerRequest,
} from '@/infrastructure/interfaces/auth-api';
import type { UpdateCurrentUserRequest } from '@/infrastructure/interfaces/user-api';
import { AuthMapper } from '@/infrastructure/mappers/auth.mapper';

export interface RegisterPassengerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  /** E.164, por ejemplo `+5493511234567`. */
  phone: string;
}

export interface RegisterPassengerResult {
  user: AuthUser;
  session: AuthSession;
  /** `false` si la cuenta se creo pero no se pudo guardar nombre y telefono. */
  profileSaved: boolean;
}

/**
 * Crea la cuenta del pasajero y guarda sus datos personales.
 *
 * Son dos solicitudes porque `POST /auth/register` solo acepta email y
 * contraseña (rechaza cualquier otro campo): nombre y telefono se completan
 * despues con `PATCH /users/me`, usando la sesion recien emitida.
 *
 * Si falla el registro se lanza `ApiRequestError`. Si falla solo el perfil, la
 * cuenta ya existe y la sesion es valida: no se lanza, se informa con
 * `profileSaved: false` para no dejar al usuario sin poder entrar.
 */
export async function registerPassengerAction(input: RegisterPassengerInput): Promise<RegisterPassengerResult> {
  const body: RegisterPassengerRequest = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };

  const { data } = await transferBlackApi.post<ApiDataResponse<AuthSessionResponse>>('/auth/register', body);

  const session = AuthMapper.toSession(data.data.tokens);
  let user = AuthMapper.toUser(data.data.profile);

  const profile: UpdateCurrentUserRequest = {
    first_name: input.firstName,
    last_name: input.lastName,
    phone_number: input.phone,
  };

  try {
    await transferBlackApi.patch('/users/me', profile, {
      // La sesion todavia no esta en el store: el token va explicito.
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    user = { ...user, firstName: input.firstName, lastName: input.lastName, phone: input.phone };
  } catch {
    return { user, session, profileSaved: false };
  }

  return { user, session, profileSaved: true };
}
