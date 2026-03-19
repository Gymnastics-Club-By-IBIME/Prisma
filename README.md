# Gymnastics Club by IBIME — Guía Técnica

## Estructura del repositorio

```
/
├── gymnastics_admin_clases.html    Portal de administración (publicar clases, gestionar catálogo)
├── gymnastics_alumno.html          Portal del alumno (reservar, pagar, ver estado en tiempo real)
├── gymnastics_profesores.html      Portal del profesor (ver inscritos, pasar lista, asistencia)
├── gymnastics_recepcion.html       Portal de recepción (cobros, inscripciones, reservas)
└── assets/
    └── js/
        ├── firebase-init.js        Inicialización centralizada de Firebase (cargado por todos los HTML)
        └── schema.js               Constantes de colecciones y campos de Firestore
```

## Cómo configurar Firebase

1. Abre [Firebase Console](https://console.firebase.google.com/) y crea o selecciona tu proyecto.
2. En **Configuración del proyecto → Aplicaciones web**, copia la configuración.
3. Abre `assets/js/firebase-init.js` y reemplaza los valores de `FIREBASE_CONFIG`:

```javascript
var FIREBASE_CONFIG = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  databaseURL:       "https://TU_PROJECT-default-rtdb.firebaseio.com/",
  projectId:         "TU_PROJECT",
  appId:             "TU_APP_ID"
};
```

> No es necesario cambiar ningún otro archivo; todos los HTML cargan `assets/js/firebase-init.js` antes de su script de página.

## Colecciones y campos de Firestore

### `catalogo` — Catálogo de clases y productos

| Campo           | Tipo      | Descripción                                             |
|-----------------|-----------|---------------------------------------------------------|
| nombre          | string    | Nombre de la clase/producto                             |
| tipo            | string    | `"clase"` o `"producto"`                                |
| area            | string    | `"fitness"` o `"gimnasia"`                              |
| inicio          | string    | Hora de inicio (HH:MM)                                  |
| fin             | string    | Hora de fin (HH:MM)                                     |
| dia             | string    | Día de la semana en español ("Lunes", "Martes", etc.)   |
| diasSemana      | array     | Arreglo con el/los días                                 |
| cupo            | number    | Cupo total de alumnos                                   |
| cupoDisponible  | number    | Lugares restantes (se decrementa al reservar)           |
| precio          | number    | Precio regular                                          |
| precioPronto    | number    | Precio pronto pago                                      |
| icon            | string    | Emoji/ícono representativo                              |
| profesor        | string    | Nombre del profesor asignado                            |
| activa          | boolean   | Si la clase está activa/publicada                       |
| timestamp       | timestamp | Fecha de creación/actualización                         |

---

### `alumnos` — Registro de alumnos

| Campo             | Tipo    | Descripción                                    |
|-------------------|---------|------------------------------------------------|
| nombre            | string  | Nombre completo                                |
| curp              | string  | CURP (18 caracteres)                           |
| nivel             | string  | Nivel/categoría                                |
| pago              | number  | Monto de inscripción                           |
| pin               | string  | PIN de acceso                                  |
| condicion         | string  | `ALUMNO_INTERNO` o `ALUMNO_EXTERNO`            |
| matricula         | string  | Matrícula                                      |
| correo            | string  | Correo electrónico                             |
| celular           | string  | Número de celular                              |
| fechaRegistro     | string  | Fecha de registro (formato es-MX)              |
| vencimiento       | string  | Fecha de vencimiento membresía (YYYY-MM-DD)    |
| estatus           | string  | `INACTIVO` o `ACTIVO`                          |
| inscripcionPagada | boolean | Si la inscripción fue pagada                   |
| primerAcceso      | boolean | Flag de primer acceso al sistema               |
| password          | string  | Contraseña de acceso                           |
| ultimoPago        | string  | Fecha del último pago                          |

---

### `reservas` — Reservas/apartados de clases

| Campo            | Tipo      | Descripción                                                         |
|------------------|-----------|---------------------------------------------------------------------|
| alumnoId         | string    | ID del alumno (referencia a `alumnos`)                              |
| alumnoNombre     | string    | Nombre del alumno (desnormalizado)                                  |
| claseId          | string    | ID de la clase (referencia a `catalogo`)                            |
| claseNombre      | string    | Nombre de la clase (desnormalizado)                                 |
| area             | string    | `"fitness"` o `"gimnasia"`                                          |
| folio            | string    | Folio único del pedido (IBY-PAG-##########)                         |
| estado           | string    | `"pre-reserva"` / `"pendiente_pago"` / `"confirmada"` / `"cancelada"` |
| alertaMostrada   | boolean   | Si se mostró la alerta de confirmación al alumno                    |
| fechaConfirmacion| string    | Fecha de confirmación de pago (es-MX)                               |
| frecuenciaSem    | number    | Clases por semana seleccionadas                                     |
| timestamp        | number    | Timestamp en ms de creación                                         |
| dia              | string    | Día de la semana de la clase ("Lunes", "Martes", etc.)             |
| hora             | string    | Hora de inicio (HH:MM)                                              |
| horaFin          | string    | Hora de fin (HH:MM)                                                 |
| profesor         | string    | Nombre del profesor                                                 |
| pasesTotal       | number    | Total de pases/sesiones compradas                                   |
| pasesRestantes   | number    | Pases restantes (se decrementa al pasar lista)                      |
| asistencia       | boolean   | `true` si el profesor marcó asistencia                              |
| falta            | boolean   | `true` si el profesor marcó inasistencia                            |
| **Campos Etapa 2 (plan semanal)** | | |
| planSemanal      | boolean   | `true` para reservas creadas con el nuevo flujo de plan semanal     |
| slotKey          | string    | Clave que agrupa las 3 semanas de un mismo slot: `alumnoId_claseId_dia_hora` |
| weekStart        | string    | Lunes de la semana (YYYY-MM-DD)                                     |
| semanaIndex      | number    | `0` = semana actual, `1` = semana+1, `2` = semana+2                |
| fechaClase       | string    | Fecha real de la sesión (YYYY-MM-DD)                               |
| startAt          | Timestamp | Inicio exacto de la sesión en zona horaria `America/Mexico_City`    |
| endAt            | Timestamp | Fin de la sesión (opcional, null si no aplica)                      |
| modifiedAt       | Timestamp | Última modificación (serverTimestamp)                               |
| modifiedBy       | string    | Quién modificó: `"alumno"` o `"recepcion"`                          |

> **ID determinístico (plan semanal):** `{alumnoId}_W{weekStart}_{claseId}_{dia}_{hora}` (caracteres no alfanuméricos reemplazados por `_`). Esto garantiza que un mismo slot de una semana no genere duplicados al re-confirmar.

---

### `pagos` — Registro de pagos

| Campo      | Tipo      | Descripción                                        |
|------------|-----------|----------------------------------------------------|
| alumnoId   | string    | ID del alumno                                      |
| nombre     | string    | Nombre del alumno                                  |
| monto      | number    | Monto pagado                                       |
| detalle    | string    | Descripción del pago                               |
| folio      | string    | Folio del pedido                                   |
| fecha      | timestamp | Fecha/hora del pago                                |
| fechaString| string    | Fecha en formato es-MX                             |
| metodo     | string    | `EFECTIVO`, `TRANSFERENCIA`, o `APP_PENDIENTE`     |
| referencia | string    | Referencia de transferencia (opcional)             |

---

### `asistencias` — Registro de asistencia por sesión

| Campo          | Tipo      | Descripción                                     |
|----------------|-----------|-------------------------------------------------|
| alumnoId       | string    | ID del alumno                                   |
| alumnoNombre   | string    | Nombre del alumno                               |
| claseId        | string    | ID de la clase                                  |
| claseNombre    | string    | Nombre de la clase                              |
| profesorId     | string    | ID del profesor                                 |
| profesorNombre | string    | Nombre del profesor                             |
| fecha          | string    | Fecha en formato YYYY-MM-DD                     |
| hora           | string    | Hora del registro                               |
| tipo           | string    | `presente`, `ausente`, `tarde`, `justificado`   |
| timestamp      | timestamp | Timestamp del servidor                          |

---

### `profesores` — Catálogo de profesores

| Campo     | Tipo      | Descripción          |
|-----------|-----------|----------------------|
| nombre    | string    | Nombre del profesor  |
| createdAt | timestamp | Fecha de registro    |

---

### `config` — Configuración del sistema

| Documento           | Campos              | Descripción                        |
|---------------------|---------------------|------------------------------------|
| `contador_alumnos`  | `ultimo_numero`     | Contador para generar IDs de alumnos|
| `contador_pagos`    | `ultimo_numero`     | Contador para generar folios       |
| `costos_fitness`    | estructura de costos| Precios de paquetes fitness        |
| `costos_gimnasia`   | estructura de costos| Precios de paquetes gimnasia       |

---

## Flujo completo de datos

### Etapa 1 (flujo carrito)

```
Admin publica clase
  → catalogo/{id} {activa:true, dia, inicio, fin, profesor, cupo, ...}
  
Alumno selecciona clase y horario
  → Al hacer checkout: reservas/{id} {estado:'pre-reserva', dia, hora, pasesTotal, ...}
  → rtdb/estatus_acceso/{alumnoId} {folio, monto, ...}

Recepción ve pre-reserva en tiempo real (onSnapshot)
  → Al cobrar: pagos/{id} {monto, metodo, ...}
  → reservas/{id} {estado:'confirmada', fechaConfirmacion}
  → alumnos/{id} {estatus:'ACTIVO', ultimoPago}

Alumno ve clase confirmada (onSnapshot en reservas)
  → Banner de estado por tiempo: 30 min antes / comenzó / terminada
  → checkClaseActual() corre cada 60s con setInterval

Profesor ve inscritos en tiempo real (onSnapshot en reservas)
  → Al pasar lista: asistencias/{id} {tipo, fecha, ...}
  → reservas/{id} {pasesRestantes:-1, asistencia/falta}

Alumno ve actualización de pases en tiempo real (onSnapshot en reservas)
```

### Etapa 2 (plan semanal — 3 semanas)

```
Alumno elige plan:
  Paso 1 → Área (Fitness / Gimnasia)
  Paso 2 → Frecuencia Y (1–5 clases/semana)
  Paso 3 → Selecciona Y horarios individuales (mezcla de disciplinas libre)
            Contador "Te faltan X de Y"
  Paso 4 → Resumen editable (botón "Modificar selección" regresa al Paso 3)

Alumno confirma:
  → Se generan Y × 3 documentos en reservas (una sesión por semana × 3):
      Semana 0: reservas/{alumnoId}_W{weekStart0}_{claseId}_{dia}_{hora}
      Semana 1: reservas/{alumnoId}_W{weekStart1}_{claseId}_{dia}_{hora}
      Semana 2: reservas/{alumnoId}_W{weekStart2}_{claseId}_{dia}_{hora}
  → Cada doc tiene estado:'pendiente_pago', startAt (Timestamp MX), fechaClase, slotKey, etc.
  → rtdb/estatus_acceso/{alumnoId} = orden de pago

Recepción confirma pago:
  → reservas/{id} {estado:'confirmada'} para los docs de ese folio

Alumno ve "Mis Clases" con slots agrupados:
  → Cada slot muestra las 3 semanas con su estado individual
  → Botón "Modificar" si alguna sesión tiene > 12h de anticipación

Alumno modifica un slot:
  → Para cada semana del slot: if (now < startAt - 12h) → actualizar doc
  → Se cambia claseId, dia, hora, startAt, fechaClase, slotKey
  → Semanas bloqueadas se omiten y se informa al alumno

Profesor ve cambio en tiempo real:
  → loadAlumnos() usa onSnapshot → al actualizarse la reserva, el alumno
     aparece en la nueva clase/horario y desaparece del anterior automáticamente
  → Filtro: reservas donde estado=='confirmada' AND (fechaClase==hoy OR !fechaClase)
```

---

## Regla de cutoff 12 horas

Cada sesión de plan semanal tiene un campo `startAt` (Firestore Timestamp) que representa
el inicio exacto en zona horaria `America/Mexico_City`.

**Regla:** Una sesión puede modificarse solo si `now < startAt - 12 horas`.

- Si falta **más de 12h**: botón "Modificar" habilitado en "Mis Clases".
- Si falta **12h o menos**: la sesión muestra estado "🔒 Bloqueado".

Al aplicar una modificación de slot:
1. Se calcula el cutoff de cada una de las 3 semanas individualmente.
2. Solo se actualizan las semanas que cumplan la regla.
3. El usuario recibe mensaje: "Actualizado en N semanas (M bloqueadas por ≤12h)".

---

## Replicación semana 0 / 1 / 2

Cuando el alumno modifica un "slot" (ej. cambia su clase de Miércoles 18:00):
- El cambio se aplica a **semana 0, semana 1 y semana 2**.
- En cada semana se verifica el cutoff de 12h de forma independiente.
- Las semanas bloqueadas **no se modifican** (se preserva la reserva original).
- Si el docId cambia (diferente clase/dia/hora), se **elimina el doc anterior** y
  se **crea uno nuevo** con el docId determinístico correcto.

---

## Reglas de Firestore recomendadas

### Modo prueba (desarrollo)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ **Solo para desarrollo.** Estas reglas permiten acceso público total.

### Modo producción (mínimo recomendado)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Catálogo: lectura pública, escritura solo desde admin
    match /catalogo/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Alumnos: solo lectura/escritura autenticada
    match /alumnos/{alumnoId} {
      allow read, write: if request.auth != null;
    }
    // Reservas, pagos, asistencias: solo autenticados
    match /reservas/{id} {
      allow read, write: if request.auth != null;
    }
    match /pagos/{id} {
      allow read, write: if request.auth != null;
    }
    match /asistencias/{id} {
      allow read, write: if request.auth != null;
    }
    match /profesores/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /config/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> Nota: el sistema actual no usa Firebase Auth, por lo que en producción real se recomienda implementar autenticación (con PIN/email) para aplicar reglas por rol.

## Cómo probar el flujo end-to-end

### Etapa 1 (flujo carrito legacy)

1. **Admin publica una clase:**
   - Abre `gymnastics_admin_clases.html`
   - Agrega o edita una clase con nombre, día, hora inicio/fin, profesor y cupo
   - Haz clic en "Publicar" → debe aparecer en Firestore bajo `catalogo`

2. **Alumno reserva:**
   - Abre `gymnastics_alumno.html`
   - Inicia sesión con un ID de alumno (ej. `IBI-GYM000001`) y su PIN
   - Selecciona área → frecuencia → horarios → resumen → confirmar
   - Se crean reservas con `estado:'pendiente_pago'` y aparece el QR de pago

3. **Recepción confirma pago:**
   - Abre `gymnastics_recepcion.html`
   - En el panel "Pre-reservas" aparece el alumno (en tiempo real)
   - Registra el cobro → las reservas cambian a `estado:'confirmada'`

4. **Alumno ve clase activa:**
   - En `gymnastics_alumno.html`, en "Mis Clases" aparece la clase con horario
   - 30 min antes: banner "Tu clase inicia en X min"
   - Durante: banner "Tu clase comenzó"
   - Después sin asistencia: banner "Clase terminada — pase descontado"

5. **Profesor ve y pasa lista:**
   - Abre `gymnastics_profesores.html`
   - Selecciona su nombre e ingresa contraseña (`gymnastics2026`)
   - Sus clases aparecen en tiempo real (actualizadas al confirmarse pagos)
   - Al seleccionar una clase, ve la lista de alumnos inscritos
   - Marca presente/ausente/tarde/justificado y guarda

### Etapa 2 (plan semanal — prueba E2E)

1. **Alumno crea plan semanal:**
   - Abre `gymnastics_alumno.html` e inicia sesión
   - Ve a **Clases** → elige área (Fitness o Gimnasia)
   - Elige plan: ej. **3 clases/semana** → el precio se actualiza
   - Haz clic en **"Elegir mis horarios"**
   - Aparece el contador: "Selecciona **0** de **3**"
   - Selecciona 3 horarios (puedes mezclar disciplinas)
   - El contador llega a "3 de 3" y aparece el botón **"Ver resumen y confirmar"**
   - En el resumen verifica los 3 slots y el precio
   - Haz clic en **"Modificar selección"** para volver al selector (estado preservado)
   - Confirma → se crean **9 documentos** en Firestore (3 slots × 3 semanas) con estado `pendiente_pago`

2. **Verificar reservas en Firestore:**
   - Abre la consola de Firebase → Firestore → colección `reservas`
   - Busca docs con `alumnoId == TU_ALUMNO_ID` y `planSemanal == true`
   - Verifica que cada doc tenga:
     - `weekStart`, `semanaIndex` (0/1/2), `fechaClase`, `startAt` (Timestamp)
     - `slotKey` con formato `alumnoId_claseId_dia_hora`
     - `estado: 'pendiente_pago'`

3. **Recepción confirma pago:**
   - Confirma el pago en `gymnastics_recepcion.html`
   - Los 9 docs pasan a `estado:'confirmada'`

4. **Alumno ve slots en "Mis Clases":**
   - Sección "📅 Plan Semanal" muestra los slots agrupados
   - Cada slot lista las 3 semanas con su estado individual (Sem 1, Sem 2, Sem 3)
   - Si falta > 12h para la sesión más próxima: botón **"Modificar"** visible
   - Si todas las sesiones están a ≤ 12h: estado **"🔒 Bloqueado"**

5. **Alumno modifica un slot (cutoff 12h):**
   - Haz clic en **"Modificar"** en un slot
   - Aparece el modal con todos los horarios disponibles
   - Si alguna semana está bloqueada se muestra aviso (⚠️)
   - Selecciona el nuevo horario → "Aplicar cambio"
   - Verificar en Firestore:
     - Semanas con > 12h: el doc se actualiza (nuevo claseId, dia, hora, startAt, fechaClase, slotKey)
     - Semanas con ≤ 12h: el doc **no cambia**
   - El mensaje muestra: "✅ Horario actualizado en N semanas (M bloqueadas por ≤12h)"

6. **Profesor ve cambio en tiempo real:**
   - Abre `gymnastics_profesores.html` con el profesor de la clase **original**
   - Selecciona esa clase → el alumno **desaparece** de la lista (ya que cambió su reserva)
   - Abre el portal del profesor de la clase **nueva**
   - El alumno **aparece** sin refrescar (gracias a `onSnapshot`)
   - Las clases del día de hoy se destacan con la etiqueta **"HOY"** en el dashboard

> **Nota de seguridad:** La contraseña por defecto del portal de profesores (`gymnastics2026`) es compartida y debe cambiarse por una más segura en producción. Para hacerlo, actualiza el campo `password` en la colección `profesores` y ajusta la validación en el portal.

## Despliegue en GitHub Pages

No se requiere build ni Node.js. Solo sube los archivos y activa GitHub Pages desde la rama `main` (o el branch que uses):

1. Ve a Settings → Pages → Source: `main` branch, root `/`
2. Asegúrate de que los 4 HTML y la carpeta `assets/` estén en la raíz del repositorio
3. Las rutas relativas `assets/js/firebase-init.js` y `assets/js/schema.js` funcionan automáticamente

## Notas de migración

### Etapa 1
- Los campos `dia`, `hora`, `horaFin`, `profesor`, `pasesTotal`, `pasesRestantes` son **nuevos** en `reservas`. Las reservas existentes no los tendrán; la UI los trata como opcionales.
- Los campos `asistencia` y `falta` son **nuevos** en `reservas`. Se establecen al guardar la lista del profesor.
- La colección `catalogo` NO ha cambiado; los documentos existentes siguen siendo compatibles.

### Etapa 2
- Los nuevos campos del plan semanal (`planSemanal`, `slotKey`, `weekStart`, `semanaIndex`, `fechaClase`, `startAt`, `endAt`) **solo existen en reservas creadas con el nuevo flujo**.
- Las reservas legacy (sin `planSemanal: true`) siguen funcionando en "Mis Clases" (sección separada "Otras reservas").
- El portal de profesores muestra alumnos de hoy filtrando por `fechaClase == hoy` si el campo existe, o todos los inscritos si no (backwards compatible).
- Los nuevos estados `pendiente_pago` y `cancelada` son equivalentes semánticos de `pre-reserva` y se tratan igual en las UI que verifican `estado`.
