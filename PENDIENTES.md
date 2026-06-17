# Pendientes — Modus PH

> Contexto vivo para retomar. Última actualización: 2026-06-16.
> Ver `CLAUDE.md` (estado de lo construido) y `PLAN-DE-TRABAJO.md` (roadmap).

## 🔴 Operativo (acción del dueño, fuera del código)
- [ ] **Confirmar que la confirmación de correo esté ON** en Supabase → Auth → Providers → Email ("Confirm email"). **La seguridad del Portal del Residente depende de esto** (el auto-vínculo `people.user_id` por email). Si estuviera OFF, alguien podría reclamar el acceso de un propietario con solo conocer su correo.
- [ ] Si el repo está conectado a **Vercel**: cargar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel (cada push a `main` despliega).

## 🟡 Siguiente paso inmediato — UI de Fase 5 (Mantenimiento + Inventario)
El **cimiento de datos ya está** (tablas + RLS + Storage + suppliers + anomaly_photos, auditado). Falta la interfaz:
- [ ] **5a — Equipos:** `suppliers` CRUD; inventario de equipos/herramientas por edificio; cronograma con **alertas** (próximo/vencido, query sobre `next_maintenance`); **historial** (`maintenance_logs`, al insertar recalcula `next_maintenance` por trigger). Nav "Mantenimiento".
- [ ] **5b — Anomalías con foto:** reporte a proveedor; **subida de fotos** cliente→Storage en ruta `{org_id}/anomalias/{anomaly_id}/{archivo}` (bucket `ph-photos`, privado); mostrar con **signed URLs** generadas server-side. Estado abierta/resuelta.
- [ ] Verificar (tsc/lint/E2E) + **lanzar los 3 agentes** (incluido Code Review, que se difirió por no haber UI).

## 🟢 Hallazgos de auditoría diferidos (con criterio, no urgentes)
- [ ] **Fase 2:** migrar `expenses.supplier` (texto) → `supplier_id` (FK a `suppliers`), para unificar el catálogo de proveedores. (No se hizo para no tocar Fase 2 ya desplegada.)
- [ ] **Fase 4 (quejas):** paginación de listas; adjuntos/fotos en mensajes; notificaciones (al staff cuando abren ticket / al residente cuando responden); que `createTicket` devuelva el id para redirigir al detalle.
- [ ] **Fase 5:** frecuencias **múltiples** de mantenimiento por equipo (tabla `maintenance_schedules`, solo si el cliente lo pide); **visibilidad a residentes/JD** de cronogramas/historial (policies SELECT additivas — el doc lo pide; hoy staff-only); expandir `anomaly_status` (p. ej. `notificada`/`en_proceso`); guard del cast `::uuid` en las policies de Storage (fallar limpio ante rutas malformadas); decidir si configurar equipos debe ser **admin-only** (hoy cualquier miembro).
- [ ] **Portal:** flujo de **invitación/claim explícito** del residente (mitiga el typo de email del admin; v2); **selector multi-org** en el portal (hoy toma la primera org); paginación del estado de cuenta.

## 🔵 Deuda de verificación
- [x] Otros embeds de PostgREST por FK compuesta (clase del bug de cobros): revisados — el resto (`units`/`buildings` en unidades, session, statement) van sobre FKs simples, **no ambiguos**. Solo cobros lo era (corregido con hint).
- [ ] **E2E pendientes:** Fase 3 acuse de visto (se omitió; RLS sí verificado por SQL); Fase 5 (cuando exista UI).

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
