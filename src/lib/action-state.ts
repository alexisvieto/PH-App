/**
 * Estado compartido de las server actions de formularios.
 * Vive fuera de los archivos "use server" (que solo pueden exportar
 * funciones async).
 */
export type ActionState = { error: string | null; ok: boolean };

export const EMPTY_ACTION_STATE: ActionState = { error: null, ok: false };
