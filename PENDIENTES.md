# Pendientes — Modus PH

> Contexto vivo para retomar. Última actualización: 2026-06-17.
> Ver `CLAUDE.md` (estado de lo construido) y `PLAN-DE-TRABAJO.md` (roadmap).

## 🔴 Operativo (acción del dueño, fuera del código)
- [x] **Confirmación de correo ON** en Supabase Auth (confirmado por el dueño 2026-06-17). Es de lo que depende la seguridad del portal (auto-vínculo `people.user_id` solo tras confirmar).
- [ ] **SMTP propio** (Resend/SendGrid/SES) en Supabase → Authentication → Emails → SMTP. El correo por defecto es solo para pruebas (rate-limited). **Necesario antes del piloto con residentes reales.** (Diferido: lo hacemos luego.)
- [ ] **URL Configuration** en Supabase Auth: Site URL + Redirect URLs (`http://localhost:3200/**` y la de Vercel) para que los enlaces de confirmación funcionen.
- [ ] Si el repo está conectado a **Vercel**: cargar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel (cada push a `main` despliega).

## 🟡 Siguiente paso inmediato — Fase 6 (Operaciones y RRHH)
Fases **3, 4 y 5 cerradas y auditadas** (3-agentes, hallazgos aplicados). Verificadas: tsc/lint 0, build OK, smoke tests. **Falta commit/push de Fase 3+4.**
- **Fase 6 requiere ley laboral de Panamá:** liquidaciones, incapacidades y faltas con **cálculo automático** según la ley. Antes de construir: investigar/confirmar las fórmulas (preaviso, indemnización por años de servicio, prima de antigüedad, vacaciones proporcionales, décimo tercer mes) y las causales/plazos de despido. Definir si las constantes legales van en config editable (por si cambia la ley) o hardcoded con versión.
- Pendiente de Fase 6 (del plan): QR de conserjes (limpieza + asistencia), fichas de trabajadores visibles a residentes, anuncios de contrataciones/despidos.

## 🟢 Hallazgos de auditoría diferidos (con criterio, no urgentes)
- [ ] **Fase 2:** migrar `expenses.supplier` (texto) → `supplier_id` (FK a `suppliers`), para unificar el catálogo de proveedores. (No se hizo para no tocar Fase 2 ya desplegada.)
- [ ] **Fase 4 (quejas):** paginación de listas; adjuntos/fotos en mensajes; notificaciones (al staff cuando abren ticket / al residente cuando responden); que `createTicket` devuelva el id para redirigir al detalle.
- [ ] **Fase 5:** frecuencias **múltiples** de mantenimiento por equipo (tabla `maintenance_schedules`, solo si el cliente lo pide); **visibilidad a residentes/JD** de cronogramas/historial (policies SELECT additivas — el doc lo pide; hoy staff-only); expandir `anomaly_status` (p. ej. `notificada`/`en_proceso`); guard del cast `::uuid` en las policies de Storage (fallar limpio ante rutas malformadas); decidir si configurar equipos debe ser **admin-only** (hoy cualquier miembro, intencional).
- [ ] **Fase 5 (de la auditoría UI, 2026-06-17):** job de **limpieza de objetos huérfanos** en Storage (fotos subidas si `recordAnomalyPhotos` falla o el usuario cierra; siguen protegidas por RLS, son basura no rastreable); `setAnomalyStatus` es **cualquier-miembro** a propósito (operación, no dinero) — revisar si la JD pide gating; alerta de mantenimiento (`maintenanceAlert`) usa hora del servidor (UTC), desfase ≤5h vs hora local PA en el badge — aceptable, revisar si se quiere zona del tenant.
- [ ] **Portal:** flujo de **invitación/claim explícito** del residente (mitiga el typo de email del admin; v2); **selector multi-org** en el portal (hoy toma la primera org); paginación del estado de cuenta.
- [ ] **Fase 3/4 (de la auditoría 2026-06-17):** índice compuesto `(organization_id, infraction_date DESC)` en `infractions` y `(organization_id, published_at DESC)` donde aplique (deuda v2, volúmenes bajos hoy); **vista móvil** (tabla `hidden md:block` + tarjetas) en los listados — deuda de TODO el repo, ningún listado la tiene aún; reporte JD podría reemplazar interpolación en `.or()` por filtro estructurado (defensa en profundidad; hoy `building` se valida UUID antes, sin riesgo); reportes/sanciones aún sin **paginación** (límites 300/500 por ahora).

## 🔵 Deuda de verificación
- [x] Otros embeds de PostgREST por FK compuesta (clase del bug de cobros): revisados — el resto (`units`/`buildings` en unidades, session, statement) van sobre FKs simples, **no ambiguos**. Solo cobros lo era (corregido con hint).
- [ ] **E2E pendientes:** Fase 3 acuse de visto (se omitió; RLS sí verificado por SQL); **Fase 5 — subida real de foto** (cliente con JWT → bucket privado): no ejercida end-to-end (requiere sesión de navegador con Playwright); políticas de Storage y data-layer sí verificados por SQL.

## ⚪ Roadmap restante (no construido) — ver PLAN-DE-TRABAJO.md
- **Fase 3 (resto):** novedades administrativas, reportes a la JD, formatos para áreas sociales.
- **Fase 6 — Operaciones/RRHH:** QR de limpieza por conserje, asistencia, fichas de trabajadores, **liquidaciones** (ley laboral PA), incapacidades con alertas.
- **Mejoras de mercado:** reservas de áreas comunes; votaciones/asambleas digitales; **accesos/seguridad estilo Munily** (visitantes con QR/pre-autorización, citófono, bitácora, paquetería) — gran diferenciador en Panamá, módulo grande; **pagos en línea** (pasarela local).
- **IA transversal (Nexera-native):** resúmenes ejecutivos para la JD (financiero + incidentes/quejas), asistente al residente, lectura/clasificación de facturas. Requiere `ANTHROPIC_API_KEY` (BYOK por tenant, admin-only) — el patrón ya está descrito en el BUILD-PLAYBOOK.

## Convenciones a recordar (detalle en CLAUDE.md)
- `"use server"` solo exporta funciones async (consts en `lib/action-state.ts`).
- Sin `setState` en efectos (`use-form-panel.ts`).
- FKs compuestas → embeds de PostgREST ambiguos → hint `tabla!fk_name(...)` o mapear aparte.
- DDL por `apply_migration`; datos por `execute_sql`; `get_advisors` tras cambios de esquema (los WARN de SECURITY DEFINER ejecutable por authenticated están aceptados).
