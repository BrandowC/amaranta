import { ApiError } from './api';

/**
 * Backend domain-exception messages are in English by design (see `sales-api-decisions.md`,
 * which quotes the exact strings as verified evidence) — this maps the stable `code` to the
 * Spanish text an end user actually sees, without touching the API's own message.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'INV-ORDER-008': 'La tienda está cerrada en este momento (lunes a sábado, 8:00 a.m.–12:00 p.m. y 2:00 p.m.–6:00 p.m.).',
  'INV-ORDER-004': 'El pedido debe tener al menos un producto.',
  'INV-ORDER-003': 'No puedes agregar el mismo producto dos veces en el pedido.',
  'INV-ORDER-006': 'El nombre y el teléfono de contacto son obligatorios.',
  'INV-ORDER-007': 'La dirección de entrega es obligatoria para pedidos a domicilio.',
  'INV-ORDER-005': 'Ese pedido ya no está pendiente, no se puede modificar.',
  'INV-ORDER-ITEM-001': 'La cantidad debe estar entre 1 y 50 unidades.',
  PRODUCT_NOT_FOUND: 'Uno de los productos ya no está disponible.',
  'INV-PRODUCT-002': 'No hay suficiente stock disponible para uno de los productos.',
  'INV-PRODUCT-003': 'La cantidad a descontar debe ser mayor que cero.',
  'INV-PRODUCT-004': 'El SKU debe tener entre 2 y 50 caracteres.',
  'INV-PRODUCT-005': 'El nombre debe tener entre 1 y 120 caracteres.',
  'INV-PRODUCT-006': 'El stock debe ser un número entero mayor o igual a cero.',
  SKU_ALREADY_EXISTS: 'Ya existe un producto con ese SKU.',
  APPOINTMENT_NOT_FOUND: 'Esa cita no existe.',
  'INV-MEDREC-003': 'La cita debe estar completada antes de agregar un historial médico.',
  'INV-MEDREC-002': 'El diagnóstico y el tratamiento son obligatorios (máximo 1000 caracteres).',
  'INV-MEDREC-004': 'Los síntomas son obligatorios (máximo 1000 caracteres).',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  PET_NOT_FOUND: 'Esa mascota no existe.',
  'INV-PET-002': 'El nombre de la mascota debe tener entre 1 y 50 caracteres.',
  'INV-PET-001': 'El peso debe ser mayor que 0 si se indica.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  'INV-USER-004': 'La contraseña debe tener al menos 8 caracteres.',
  'INV-USER-003': 'El nombre completo debe tener entre 2 y 100 caracteres.',
  EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta registrada con ese correo.',
  PROFESSIONAL_NOT_FOUND: 'El profesional seleccionado no existe.',
  'INV-APPT-003': 'La fecha de la cita debe ser en el futuro.',
  'INV-APPT-001': 'La cita debe estar entre las 7:00 a.m. y las 10:00 p.m., de lunes a sábado.',
  'INV-APPT-002': 'El profesional ya tiene otra cita agendada en ese horario.',
  'INV-APPT-005': 'Las notas no pueden superar los 300 caracteres.',
  'INV-APPT-006': 'Esa cita ya no se puede cancelar en su estado actual.',
  'INV-APPT-007': 'Solo una cita pendiente o confirmada se puede completar.',
  'INV-EMAIL-001': 'El correo electrónico no es válido.',
  'INV-MONEY-001': 'El monto debe ser un número entero positivo.',
};

const GENERIC_FALLBACK = 'Ocurrió un problema al procesar tu solicitud. Intenta de nuevo.';

/** Maps an ApiError to the Spanish text an end user should see — never the raw backend message. */
export function translateApiError(err: ApiError): string {
  if (err.code && ERROR_MESSAGES[err.code]) return ERROR_MESSAGES[err.code];
  if (err.statusCode === 401) return 'Tu sesión expiró — inicia sesión de nuevo.';
  if (err.statusCode === 403) return 'No tienes permiso para realizar esta acción.';
  if (err.statusCode === 404) return 'No encontramos lo que buscabas.';
  return GENERIC_FALLBACK;
}
