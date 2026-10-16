# Sistema de Gestión de Eventos - Cámaras y Red

Sistema web completo de gestión de eventos e incidentes para cámaras visuales y equipos de red, alojado al 100% en GitHub Pages (costo cero).

## 🚀 Características

- **Frontend Web:** HTML5 + Tailwind CSS + Vanilla JS + Firebase SDK v9
- **Base de Datos:** Firebase Firestore (Plan Gratuito Spark)
- **Roles:** Operador (sin contraseña) y Administrador (con token)
- **Diseño Responsivo:** Funciona en desktop, tablet y móvil
- **Gestión en Tiempo Real:** Reportes y comentarios en tiempo real
- **Opcional:** Automatización de emails (requiere plan Blaze)

## 📋 Requisitos Previos

- Cuenta de GitHub
- Cuenta de Google (para Firebase)

## ⚠️ Nota Importante sobre Planes de Firebase

**Plan Spark (Gratuito):**
- ✅ Sistema web completamente funcional
- ✅ Gestión de reportes en tiempo real
- ❌ NO permite emails automáticos (limitación del plan)
- ❌ NO permite conexiones desde servidores externos (GitHub Actions)

**Plan Blaze (Pago por uso):**
- ✅ Sistema web completamente funcional
- ✅ Gestión de reportes en tiempo real
- ✅ Emails automáticos diarios
- ✅ Conexiones desde servidores externos
- 💰 Puede seguir siendo gratuito dentro de los límites gratuitos

Este proyecto está configurado inicialmente para el **Plan Spark**. Para habilitar los emails automáticos, necesitas actualizar al Plan Blaze.

---

## 🔧 Paso 1: Configuración de Firebase

### 1.1 Crear Proyecto en Firebase

1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa el nombre del proyecto (ej: `event-management-system`)
4. Deshabilita Google Analytics (opcional para plan gratuito)
5. Haz clic en "Crear proyecto"

### 1.2 Configurar Firestore Database

1. En el menú izquierdo, selecciona **Build** > **Firestore Database**
2. Haz clic en **"Crear base de datos"**
3. Selecciona una ubicación (elige la más cercana a tus usuarios)
4. Selecciona **"Modo de prueba"** (para desarrollo inicial)
5. Haz clic en **"Habilitar"**

### 1.3 Obtener Credenciales del SDK Web

1. En el menú izquierdo, selecciona **Project Overview** (icono de engranaje) > **Configuración del proyecto**
2. Desplázate hasta la sección "Sus apps"
3. Haz clic en el icono **</>** (Web)
4. Ingresa un nombre para la app (ej: `Dashboard`)
5. **NO** habilites Firebase Hosting (usaremos GitHub Pages)
6. Haz clic en **"Registrar app"**
7. Copia el objeto `firebaseConfig` que se muestra, se verá así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 1.4 Configurar Reglas de Seguridad de Firestore

En Firestore Database > **Reglas**, reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reports collection
    match /reports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

> **Nota:** Para producción, deberás implementar autenticación real de Firebase. Para esta versión inicial, las reglas son permisivas.

### 1.5 Obtener Credenciales del Admin SDK (para GitHub Actions)

1. En Firebase Console, ve a **Project Settings** > **Service accounts**
2. Haz clic en **"Generar nueva clave privada"**
3. Selecciona tu cuenta de servicio
4. Haz clic en **"Generar clave"**
5. Se descargará un archivo JSON. **GUARDA ESTE ARCHIVO SEGURO**, lo necesitarás para los secretos de GitHub.

El archivo JSON tendrá este formato:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## 🔧 Paso 2: Configuración del Proveedor de Email

### Opción A: Usar Resend (Recomendado - Plan Gratuito)

1. Ve a [https://resend.com/](https://resend.com/)
2. Regístrate y verifica tu dominio de email
3. Ve a **API Keys** y crea una nueva API key
4. Configura tus credenciales SMTP en Resend:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `tu-api-key`

### Opción B: Usar SendGrid (Plan Gratuito)

1. Ve a [https://sendgrid.com/](https://sendgrid.com/)
2. Regístrate y crea una API Key
3. Configura tu sender (domínio verificado)
4. Usa las credenciales SMTP proporcionadas

### Opción C: Usar cualquier servidor SMTP

Puedes usar Gmail, Outlook, o cualquier servidor SMTP con las credenciales correspondientes.

---

## 🔧 Paso 3: Configurar el Código

### 3.1 Actualizar index.html

Abre `index.html` y reemplaza la configuración de Firebase (líneas ~364-371):

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

Y reemplaza el token de administrador (línea ~376):

```javascript
const ADMIN_TOKEN = "TU_TOKEN_SEGURO"; // Crea un token seguro, ej: "admin123secure"
```

### 3.2 Verificar Estructura de Archivos

Asegúrate de tener esta estructura:

```
Dashboard/
├── .github/
│   └── workflows/
│       └── daily_reports.yml
├── scripts/
│   └── dailyCheck.js
├── index.html
├── package.json
└── README.md
```

---

## 🔧 Paso 4: Crear Repositorio en GitHub

### 4.1 Inicializar Git y Subir Código

```bash
cd C:\Users\lboutin\Dashboard
git init
git add .
git commit -m "Initial commit - Event Management System"
```

### 4.2 Crear Repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre del repositorio: `event-management-system` (o el que prefieras)
3. Marca **Public** o **Private** según tu preferencia
4. **NO** marques "Initialize this repository with a README"
5. Haz clic en **"Create repository"**
6. Sigue las instrucciones para subir tu repositorio existente:

```bash
git remote add origin https://github.com/TU_USUARIO/event-management-system.git
git branch -M main
git push -u origin main
```

---

## 🔧 Paso 5: Configurar GitHub Pages

### 5.1 Habilitar GitHub Pages

1. En tu repositorio de GitHub, ve a **Settings** > **Pages**
2. En **Build and deployment** > **Source**, selecciona **Deploy from a branch**
3. En **Branch**, selecciona **main** y **/ (root)**
4. Haz clic en **Save**

### 5.2 Verificar Despliegue

1. Espera unos minutos (GitHub Pages tarda ~1-2 minutos en desplegar)
2. Ve a la URL que se muestra (ej: `https://TU_USUARIO.github.io/event-management-system/`)
3. Deberías ver la pantalla de login del sistema

---

## 🔧 Paso 6: Configurar Secretos en GitHub Actions

### 6.1 Agregar Secretos de Firebase

1. En tu repositorio, ve a **Settings** > **Secrets and variables** > **Actions**
2. Haz clic en **"New repository secret"**
3. Agrega los siguientes secretos (copia los valores del archivo JSON del paso 1.5):

| Nombre del Secreto | Valor (del archivo JSON) |
|-------------------|--------------------------|
| `FIREBASE_TYPE` | `"service_account"` |
| `FIREBASE_PROJECT_ID` | Tu project_id |
| `FIREBASE_PRIVATE_KEY_ID` | Tu private_key_id |
| `FIREBASE_PRIVATE_KEY` | Tu private_key (¡incluye los \n!) |
| `FIREBASE_CLIENT_EMAIL` | Tu client_email |
| `FIREBASE_CLIENT_ID` | Tu client_id |
| `FIREBASE_AUTH_URI` | `"https://accounts.google.com/o/oauth2/auth"` |
| `FIREBASE_TOKEN_URI` | `"https://oauth2.googleapis.com/token"` |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Tu auth_provider_x509_cert_url |
| `FIREBASE_CLIENT_X509_CERT_URL` | Tu client_x509_cert_url |

> **IMPORTANTE:** Para `FIREBASE_PRIVATE_KEY`, copia todo el valor incluyendo los `\n` literales. Si usas la interfaz web de GitHub, asegúrate de que las nuevas líneas se mantengan.

### 6.2 Agregar Secretos de Email

Agrega estos secretos adicionales:

| Nombre del Secreto | Valor |
|-------------------|-------|
| `SMTP_HOST` | `smtp.resend.com` (o tu servidor SMTP) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `resend` (o tu usuario SMTP) |
| `SMTP_PASS` | Tu API key o contraseña SMTP |
| `ADMIN_EMAIL` | `admin@tuempresa.com` (correo del administrador) |
| `FROM_EMAIL` | `noreply@tudominio.com` (correo remitente) |

---

## 🔧 Paso 7: Probar la Automatización

### 7.1 Ejecutar Manualmente el Workflow

1. En tu repositorio, ve a **Actions** tab
2. Selecciona el workflow **"Daily Reports and Follow-up"**
3. Haz clic en **"Run workflow"** > **"Run workflow"**
4. Espera a que termine la ejecución
5. Si todo está configurado correctamente, recibirás un email de prueba en `ADMIN_EMAIL`

### 7.2 Verificar Logs

Si hay errores, revisa los logs en la ejecución del workflow para identificar qué credencial está mal configurada.

---

## 📖 Uso del Sistema

### Para Operadores

1. Ingresa a la URL de GitHub Pages
2. Ingresa tu correo electrónico corporativo
3. NO marques "Soy Administrador"
4. Haz clic en "Ingresar"
5. Podrás:
   - Crear nuevos reportes
   - Ver listado de reportes activos
   - Agregar comentarios a reportes
   - **NO** podrás editar ni eliminar reportes

### Para Administradores

1. Ingresa a la URL de GitHub Pages
2. Ingresa tu correo electrónico
3. Marca "Soy Administrador"
4. Ingresa el token de administrador (configurado en `index.html`)
5. Haz clic en "Ingresar"
6. Podrás:
   - Ver todos los reportes
   - Cambiar estados (Abierto, En Proceso, Resuelto, Cerrado)
   - Editar detalles
   - Eliminar registros
   - Ver métricas del sistema

---

## 📊 Automatización Diaria

El sistema ejecuta automáticamente a las **00:00 UTC** (medianoche) las siguientes tareas:

### 1. Reporte Diario al Administrador

Incluye:
- Total de eventos creados hoy
- Total de eventos resueltos hoy
- Lista de eventos abiertos
- Métricas generales del día

### 2. Verificación de 24 Horas

Para reportes abiertos hace 24+ horas:
- Envia email de **ALERTA** al operador original
- Solicita actualización del estado

Para reportes resueltos en las últimas 24 horas:
- Envia email de **confirmación de cierre** al operador original

---

## 🔒 Seguridad

### Consideraciones Importantes

1. **Token de Administrador:** Usa un token seguro y no lo compartas públicamente
2. **Secretos de GitHub:** Nunca commits archivos con credenciales
3. **Reglas de Firestore:** Implementa autenticación real para producción
4. **Email:** Usa dominios verificados para evitar spam

### Mejoras de Seguridad Recomendadas

- Implementar Firebase Authentication real
- Usar reglas de Firestore más restrictivas
- Implementar rate limiting en el API
- Usar HTTPS (GitHub Pages ya lo proporciona)
- Validar dominios de correo corporativo

---

## 🐛 Solución de Problemas

### Error: "Permission denied" en Firestore

**Solución:** Verifica las reglas de seguridad en Firebase Console. Asegúrate de que permitan lectura/escritura.

### Error: "Invalid credentials" en GitHub Actions

**Solución:** Verifica que todos los secretos estén configurados correctamente. Especialmente `FIREBASE_PRIVATE_KEY` debe incluir los `\n` literales.

### Los emails no llegan

**Solución:** 
- Verifica que el dominio del remitente esté verificado en tu proveedor de email
- Revisa la carpeta de spam
- Verifica los logs del workflow en GitHub Actions

### GitHub Pages no se actualiza

**Solución:**
- Verifica que la rama correcta esté configurada en Settings > Pages
- Espera hasta 2 minutos después del push
- Revisa que no haya errores de build en la pestaña Actions

---

## 📚 Estructura de Datos

### Colección `reports`

```javascript
{
  id: "auto-generated",
  type: "Cámara PTZ", // o Cámara Fija, NVR/Almacenamiento, etc.
  location: "CAM-001",
  severity: "Alta", // Baja, Media, Alta
  description: "Descripción del problema...",
  operatorEmail: "usuario@empresa.com",
  status: "Abierto", // Abierto, En Proceso, Resuelto, Cerrado
  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp // opcional
}
```

### Colección `comments`

```javascript
{
  reportId: "report-id",
  text: "Comentario...",
  authorEmail: "usuario@empresa.com",
  createdAt: Timestamp
}
```

---

## 🔄 Actualización del Sistema

Para actualizar el código:

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

GitHub Pages se actualizará automáticamente en ~1-2 minutos.

---

## � Habilitar Emails Automáticos (Opcional - Requiere Plan Blaze)

Si en el futuro deseas habilitar los reportes diarios por email, necesitas:

### 1. Actualizar a Plan Blaze
1. Ve a Firebase Console > Settings > Usage and billing
2. Actualiza de Spark a Blaze
3. Agrega método de pago (no se cobrará si te mantienes en límites gratuitos)

### 2. Configurar Proveedor de Email
- Regístrate en Resend, SendGrid, o usa SMTP
- Configura las credenciales SMTP

### 3. Configurar Secretos en GitHub Actions
- Agrega todos los secretos de Firebase (FIREBASE_*)
- Agrega secretos de email (SMTP_*, ADMIN_EMAIL, FROM_EMAIL)

### 4. Verificar Permisos en Google Cloud
- Asigna rol "Cloud Firestore Client" o "Editor" a la cuenta de servicio
- Habilita APIs necesarias (Firestore, IAM, Cloud Resource Manager)

Luego ejecuta el workflow manualmente para probar.

Ver documentación completa en el README original para pasos detallados.

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica la configuración de Firebase Console
2. Revisa que el token de administrador sea correcto en index.html
3. Consulta la documentación de [Firebase](https://firebase.google.com/docs)

**Nota:** Con el plan Spark, los emails automáticos no están disponibles. Para habilitarlos, actualiza al plan Blaze.

---

## 📄 Licencia

MIT License - Siéntete libre de usar y modificar este proyecto.

---

## 🙏 Agradecimientos

Este sistema utiliza tecnologías gratuitas y open-source:
- [GitHub Pages](https://pages.github.com/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Nodemailer](https://nodemailer.com/)
