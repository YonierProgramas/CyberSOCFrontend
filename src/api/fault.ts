const messages = {
  VALIDATION_FAILED: 'Revisa los datos del formulario.',
  INVALID_CURSOR: 'La lista caducó. Reiníciala para continuar.',
  AUTH_REQUIRED: 'Hay que entrar de nuevo.',
  TOKEN_INVALID: 'Hay que entrar de nuevo.',
  TOKEN_EXPIRED: 'La sesión venció. Hay que entrar de nuevo.',
  FORBIDDEN: 'No tienes permiso para esa operación.',
  NOT_FOUND: 'No se encontró esa información.',
  METHOD_NOT_ALLOWED: 'La operación no está disponible.',
  PAYLOAD_TOO_LARGE: 'Los datos enviados son demasiado grandes.',
  UNSUPPORTED_MEDIA_TYPE: 'El formato de los datos no está permitido.',
  PROFILE_NOT_FOUND: 'Crea tu perfil para continuar.',
  CONFLICT: 'La información cambió. Consulta su estado antes de guardar.',
  POLICY_VERSION_OUTDATED: 'La política cambió. Lee la versión vigente antes de conceder.',
  RATE_LIMITED: 'Demasiados intentos. Espera antes de volver a intentarlo.',
  RELEASE_UNAVAILABLE: 'Instalador pendiente.',
  UPSTREAM_UNAVAILABLE: 'El servicio no está disponible. Inténtalo más tarde.',
  UPSTREAM_TIMEOUT: 'El servicio tardó demasiado en responder.',
  INTERNAL: 'No se pudo completar la operación.',
  BAD_RESPONSE: 'El servidor devolvió una respuesta no válida.',
  NETWORK: 'Sin conexión con el servidor.',
  TIMEOUT: 'El servidor tardó demasiado en responder.',
  UNKNOWN_OUTCOME:
    'No se pudo confirmar el resultado. No se repitió la acción. Consulta su estado.',
  SESSION_ENDED: 'La sesión terminó. Entra de nuevo.',
  LOGIN_FAILED: 'Correo o contraseña incorrectos.',
  LINK_INVALID: 'El enlace venció o ya se usó. Pide uno nuevo.',
  RECOVERY_REQUIRED: 'Pide un enlace de recuperación nuevo.',
  SIGNUP_CLOSED: 'Registro cerrado. La demo no acepta cuentas nuevas.',
  SIGNUP_FAILED: 'No se pudo crear la cuenta. Revisa los datos o entra si ya tienes una cuenta.',
  SIGNUP_CONFIRMATION_REQUIRED:
    'El servicio aún exige confirmar el correo. La cuenta no tiene una sesión activa; contacta al equipo para habilitarla.',
} as const;
export type FaultCode = keyof typeof messages;
export class PortalError extends Error {
  constructor(
    readonly code: FaultCode,
    readonly status = 0,
    readonly retryAfterMs = 0,
  ) {
    // Diccionario: un texto fijo por código, búsqueda O(1) promedio.
    // Nunca conserva cuerpos, mensajes upstream, contraseñas o tokens.
    super(messages[code]);
    this.name = 'PortalError';
  }
}
export function asPortalError(error: unknown): PortalError {
  return error instanceof PortalError ? error : new PortalError('INTERNAL');
}
export function knownCode(value: unknown): FaultCode | null {
  return typeof value === 'string' && Object.hasOwn(messages, value) ? (value as FaultCode) : null;
}
