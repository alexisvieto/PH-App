/**
 * Estado compartido de las server actions de formularios.
 * Vive fuera de los archivos "use server" (que solo pueden exportar
 * funciones async).
 */
export type ActionState = { error: string | null; ok: boolean };

export const EMPTY_ACTION_STATE: ActionState = { error: null, ok: false };

/** Estado de la generación de cargos (incluye cuántos se crearon). */
export type GenState = { error: string | null; ok: boolean; count: number };

export const GEN_EMPTY: GenState = { error: null, ok: false, count: 0 };
