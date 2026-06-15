# Plan de Trabajo — Administración de PH (Nexera)

> **Producto:** SaaS multi-tenant de Administración de Propiedad Horizontal.
> **Dueño:** Nexera. **Objetivo central:** transparencia total con residentes e información en tiempo real.
> **Método:** se construye **módulo por módulo**; cada uno se **prueba y aprueba** antes de pasar al siguiente.
>
> **v1 · 2026-06-15.** Documento vivo: se actualiza al cerrar cada módulo.

---

## 0. Decisiones de arquitectura (heredadas de Modus PM)

Reusamos el patrón ya probado en `C:\dev-modus` — no reinventamos:

- **Stack:** Next.js 16 (App Router, middleware en `src/proxy.ts`, cómputo server-side por defecto) · React 19 · Supabase (PostgreSQL/Auth/Storage/Realtime, vía `@supabase/ssr`) · Tailwind v4 + shadcn · lucide + sonner · Recharts · `@react-pdf/renderer`/exceljs (exportables) · `@zxing` (QR).
- **Multi-tenant sagrado:** `organization_id` en todas las tablas + **RLS** en todas. Helpers SQL `is_org_member(org)` y `has_org_role(org, roles[])`. Admin-gating en 2 capas (servidor = enforcement real, cliente = UX).
- **Branding por tenant:** `brand.ts` (`brandFromOrg`, fallback, `safeLogo`); exportables con la marca del cliente + crédito discreto "by Nexera" (flag `export_credit`).
- **IA BYOK:** `@anthropic-ai/sdk`, `claude-opus-4-8`; datos del usuario en bloque delimitado tratados **como datos, nunca instrucciones**; auth + rate-limit en cada ruta; `ANTHROPIC_API_KEY` solo server.
- **Verificación:** `tsc` y `eslint` en **0**; smoke con Playwright para UI; diff para datos. (Ver `BUILD-PLAYBOOK.md`.)

### Audiencia del core: solo staff administrativo
El **core del app es exclusivamente administrativo (staff).** Roles iniciales: `owner`, `administrador`, `asistente`.
- **Los residentes NO entran al core.** Propietarios y arrendatarios son **datos** en el padrón (admin-only); esa lista **no se comparte entre residentes**, solo la ve el administrador.
- **Portal/app del residente = superficie SEPARADA y posterior** (estilo Munily: entregas/paquetería, anuncios, eventualmente su estado de cuenta). Se diseña como módulo aparte, con su propio acceso acotado; nunca toca el core.
- Por tanto, en el core **no hay RLS a nivel residente**: RLS = aislamiento entre organizaciones + permisos por rol.

### Modelo de tenant (decidido)
El **tenant es la `organization`**, y una org contiene **de 1 a N edificios (PH)**. Una misma estructura cubre los dos casos del negocio:
- **Empresa administradora** → una org con **varios** PH (agrega cuantos administre).
- **PH autogestionado por su Junta Directiva** → una org con **un solo** PH.

La diferencia entre ambos es de onboarding y etiqueta (tipo de org, rol del dueño), **no de esquema**. RLS de staff a nivel `organization`; RLS de residentes a nivel `edificio` + `unidad`. La marca por-tenant vive en la org (la administradora tiene la suya; un PH autogestionado usa la del propio edificio).

> El dominio se diseña fresco para PH (no se copia el de Modus PM); de Modus PM solo reusamos **el método y los patrones de infraestructura** (multi-tenant, RLS, branding, IA BYOK, verificación).

---

## 1. Método de trabajo (el ritmo)

Por cada módulo:
1. **Diseñar** el esquema (tablas + RLS + roles) y la UI mínima. Confirmar bifurcaciones reales con una recomendación.
2. **Construir** al estilo del repo (español, mínimo, enfocado). DDL por `apply_migration`, datos por `execute_sql`.
3. **Verificar:** `tsc`=0, `eslint`=0, smoke Playwright (login → navegar → aserción → captura), `get_advisors` tras cambios de esquema.
4. **Demostrar** con datos de prueba y reportar honestamente (qué quedó, qué falta, qué se asumió).
5. **Aprobación tuya** → recién ahí pasamos al siguiente módulo.
6. **Commit/push solo cuando lo pidas** (push = deploy a producción).

**Prerrequisitos que tú preparas:** repositorio en GitHub + proyecto en Supabase (URL + anon key para `.env.local`; y `ANTHROPIC_API_KEY` cuando toque IA).

---

## 2. Roadmap de módulos (orden por valor y dependencias)

### Fase 0 — Fundación *(habilitador, no es "feature")*
**Objetivo:** dejar el esqueleto multi-tenant listo.
- Scaffold Next 16 + Supabase clonando los patrones de Modus PM (`proxy.ts`, `lib/supabase`, `brand.ts`, app shell).
- Tablas base: `organizations`, `organization_members` (enum de roles ampliado: owner/admin/junta_directiva/conserje/guardia/propietario/inquilino), `profiles`, `edificios` (PH), `unidades` (apartamentos), `propiedades` (vínculo propietario↔unidad), `arrendamientos` (inquilino↔unidad).
- RLS + helpers `is_org_member`, `has_org_role`, y nuevo `is_unit_resident(unidad)`.
- Auth (login staff + portal residente), app shell con branding.
- **Listo cuando:** un staff y un residente pueden entrar y cada uno ve solo lo que le toca; RLS verificado con consulta cruzada.

> **✅ CIMIENTO (Fase 0 + Fase 1) COMPLETO Y AUDITADO — 2026-06-15.** Multi-tenant, padrón, RLS, RPCs atómicos, app (auth/onboarding/shell/CRUD), selector de org activa. Commit en rama `cimiento-fase-1` (sin push). Auditoría (arquitectura+código+seguridad) aplicada.

### Fase 1 — Padrón / Censo  ✅
**Objetivo:** la base de datos viva de todo el PH.
- Listado de propietarios (actualizable por venta), unidades, inquilinos.
- Alquileres: ficha "conoce a tu cliente" + tabla de % de apartamentos en alquiler.
- **Listo cuando:** se crea/edita un propietario, se transfiere una unidad (venta) y se ve el % alquilado.
*(Cubre del doc: listado de propietarios, alquileres.)*

### Fase 2 — Administrativo financiero ⭐ *(corazón de la transparencia)*
**Objetivo:** estados de cuenta y reportes que el residente ve solo.
- Cuotas de mantenimiento + extraordinarias; emisión de estados de cuenta y recibos.
- Estado de cuenta generado por la admin, **exportable a PDF con marca**. (La auto-impresión por el propietario desde su sesión pertenece al **portal del residente**, fase separada posterior.)
- Reportes de ingresos y gastos; preparación de informes para asamblea.
- Paz y salvos emitidos desde el app.
- **Listo cuando:** un propietario imprime su estado de cuenta y la JD ve el reporte de ingresos/gastos del PH.
*(Cubre: estados de cuenta, recibos, reportes contables, paz y salvos, informes de asamblea.)*

### Fase 3 — Comunicación
**Objetivo:** información a todos en tiempo real.
- Anuncios varios + novedades administrativas (envío a todos los residentes a cualquier hora).
- Comunicados con **acuse de recibido/visto**. Reportes diarios/semanales de novedades e incidentes a la JD.
- Formato de comunicaciones para colocar en áreas sociales (exportable con marca).
- **Listo cuando:** se publica un comunicado y se ve quién lo recibió/leyó.
*(Cubre: anuncios, novedades, reportes a JD, comunicaciones de áreas sociales.)*

### Fase 4 — Quejas / Tickets + Multas
**Objetivo:** trazabilidad de incidencias y sanciones.
- Quejas de residentes como tickets con estados y seguimiento.
- Formatos de multas y llamados de atención por residente, con **historial**.
- **Listo cuando:** un residente abre una queja, la admin la resuelve, y se emite una multa con su historial.
*(Cubre: quejas, multas y llamados de atención.)*

### Fase 5 — Mantenimiento + Inventario
**Objetivo:** salud de los equipos del PH.
- Alertas de mantenimiento por equipo (elevadores, piscina, gym, planta eléctrica, bombas, tanque reserva, alarmas contra incendio, A/C, computadoras).
- Historial de mantenimiento por equipo; reportes de proveedores; cronogramas con tabla de avance/culminación enviados a JD y residentes.
- Formulario de notificación de anomalías a proveedores **con foto** (a proveedor + JD).
- Inventario de equipos y herramientas + cronograma de mantenimiento con recordatorios.
- **Listo cuando:** se registra un equipo, se programa su mantenimiento con alerta, y se notifica una anomalía con foto a un proveedor.
*(Cubre: mantenimientos, inventario, proveedores.)*

### Fase 6 — Operaciones y RRHH
**Objetivo:** control de personal y verificación de campo.
- **QR de conserjes** para verificación de limpieza de áreas + control de hora de llegada de personal.
- Fichas técnicas de trabajadores visibles a residentes + anuncios de contrataciones/despidos.
- Cálculo de liquidaciones según ley laboral (Panamá); incapacidades y faltas con **alertas de despido según ley**.
- **Listo cuando:** un conserje escanea un QR de área y la admin ve la asistencia + una liquidación calculada.
*(Cubre: QR limpieza, asistencia, fichas trabajadores, liquidaciones, incapacidades/faltas.)*

---

## 3. Mejoras del mercado a incorporar (post-core, priorizadas)

Detectadas en el benchmark (Munily, ComunidadFeliz, Vantaca, Buildium, etc.). Se suman cuando el core esté sólido:

- **Fase 7 — Reservas de áreas comunes** (salón, BBQ, gym, cancha) con calendario, reglas y aprobación.
- **Fase 8 — Votaciones / asambleas digitales** con quórum y registro; incluye el "envío de propuestas a la JD para decidir desde el app" del doc.
- **Fase 9 — Accesos y seguridad** (lo más demandado en Panamá vía Munily): visitantes con QR/pre-autorización, citofonía virtual, control de paquetería, botón de pánico, bitácora de visitas.
- **Fase 10 — Pagos en línea + cobranza** (pasarela local: Yappy/ACH), recordatorios automáticos de morosidad, conciliación bancaria, fondo de reserva.

## 4. IA transversal (Nexera-native, capa sobre los módulos)

Diferenciador alineado al objetivo de transparencia (no es una fase aislada; se añade sobre módulos ya listos):
- **Resúmenes ejecutivos automáticos** para la JD (estado financiero, incidentes de la semana).
- **Asistente para el residente** que responde sobre *solo su* data ("¿por qué subió mi cuota?").
- **Lectura/clasificación de facturas** de proveedores.
- **Redacción asistida** de comunicados.

---

## 5. Lo que NO se hace todavía
Pagos reales, integraciones bancarias y notificaciones push/email salen a fases dedicadas (7-10) para no bloquear el core. Cualquier cambio de prioridad se refleja aquí.
