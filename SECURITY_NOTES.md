# 🔐 Notas de Seguridad — IBIME Gymnastics Club

## ¿Por qué la API Key de Firebase es pública y eso está bien?

En proyectos web con Firebase, la `apiKey` es un **identificador público** del proyecto,
no una credencial secreta. Firebase lo diseña así: la seguridad real se implementa mediante
**Firebase Security Rules** en Firestore y Realtime Database.

**La API key expuesta en GitHub es aceptable SIEMPRE QUE las Security Rules estén bien configuradas.**

---

## ✅ Qué debes configurar en Firebase Console

### 1. Firestore Security Rules

Ve a: Firebase Console → Firestore → Rules

Reemplaza las reglas actuales con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Alumnos: solo lectura del propio documento, escritura restringida
    match /alumnos/{alumnoId} {
      allow read: if true; // El portal alumno lee por ID directo
      allow write: if true; // Temporalmente permisivo — ver nota abajo
    }

    // Catálogo de clases: lectura pública, escritura solo desde admin
    match /catalogo/{docId} {
      allow read: if true;
      allow write: if true; // Temporalmente permisivo
    }

    // Reservas: lectura y escritura de las propias reservas
    match /reservas/{docId} {
      allow read, write: if true; // Temporalmente permisivo
    }

    // Pagos: solo escritura (recepción registra), lectura restringida
    match /pagos/{docId} {
      allow read, write: if true; // Temporalmente permisivo
    }

    // Config: lectura pública (precios), escritura solo admin
    match /config/{docId} {
      allow read: if true;
      allow write: if true; // Temporalmente permisivo
    }
  }
}
```

> ⚠️ Las reglas de arriba son **permisivas temporales** para no romper el flujo actual.
> La siguiente fase debe migrar a Firebase Authentication para poder usar `request.auth.uid`.

### 2. Realtime Database Rules

Ve a: Firebase Console → Realtime Database → Rules

```json
{
  "rules": {
    "estatus_acceso": {
      ".read": true,
      ".write": true
    },
    "notificaciones": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3. Crear documento de configuración de inscripción

En Firestore, crea el documento:
- **Colección**: `config`
- **Documento ID**: `inscripcion`
- **Campos**:
  - `monto` (number): `800`
  - `updatedAt` (timestamp): fecha actual

Esto permite cambiar el precio de inscripción desde Firebase sin tocar el código.

### 4. Verificar documentos de costos

Asegúrate de que existan:
- `config/costos_fitness` con campos `d1`–`d5` (precio regular) y `p1`–`p5` (pronto pago)
- `config/costos_gimnasia` con los mismos campos

Si no existen, el sistema usará los precios de fallback hardcodeados en el código.

---

## 🚧 Mejoras de seguridad pendientes (fase 2)

1. **Migrar a Firebase Authentication**: Crear usuarios con `createUserWithEmailAndPassword` o custom tokens.
2. **Hash de contraseñas**: Usar Firebase Auth elimina la necesidad de manejar contraseñas manualmente.
3. **Security Rules estrictas**: Una vez con Firebase Auth, usar `request.auth.uid === alumnoId` para restringir acceso.
4. **Rate limiting en Cloud Functions**: Para `verificarCURP` y login, implementar rate limiting server-side.
5. **Remover `password` y `pin` de documentos Firestore**: Una vez migrado a Firebase Auth, estos campos ya no son necesarios.

---

## 📋 Cambios aplicados en este PR

| Problema | Solución |
|---|---|
| Datos sensibles (password, pin, curp) en localStorage | Solo se guarda el `id` del alumno |
| Contraseñas en texto plano expuestas en memoria | Se eliminan del objeto USER después de autenticar |
| 3 formas de autenticación inconsistentes | Unificado a comparación de string |
| Sin rate-limit en verificarCURP | Rate-limit de 5 intentos en memoria |
| Precios hardcodeados en alumno.js | Se cargan desde `config/costos_fitness` y `config/costos_gimnasia` |
| Precio de inscripción hardcodeado en recepcion.js | Se carga desde `config/inscripcion` |
| Archivos HTML con espacios y versiones `(2)` `(1)` | Renombrados a nombres limpios |
| Falta documentación de campos hora/horaFin vs inicio/fin | Comentario agregado en schema.js |
