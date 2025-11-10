# 🎫 Interfaz de Aprobación de Solicitudes - Guía Visual

## 📱 Vista General de la Interfaz

La interfaz está completamente implementada y funcional. Aquí te explico cada parte:

---

## 1️⃣ Panel Principal - Lista de Solicitudes

### Ubicación
Cuando te conectas como un **Issuer registrado**, automáticamente aparece debajo de la sección de "Trusted Issuers":

```
┌─────────────────────────────────────────────────────┐
│  🎫 Issuer Panel                                    │
│  You are a trusted issuer. Review and approve      │
│  claim requests sent to your address.              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Claim Requests (5)           🔄 Refresh            │
│  X pending approval                                 │
│                                                     │
│  [Pending] [All] [Approved] [Rejected] ← Filtros   │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ⏳ PENDING    Topic 1    📎 Document        │  │
│  │ Requester: 0xf39Fd6...                      │  │
│  │ Message: Please verify my KYC documents...  │  │
│  │ Created: Nov 10, 2024, 10:30 AM            │  │
│  │                                         👉  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ⏳ PENDING    Topic 7    📎 Document        │  │
│  │ Requester: 0x70997...                       │  │
│  │ Message: Accreditation verification...      │  │
│  │ Created: Nov 10, 2024, 9:15 AM             │  │
│  │                                         👉  │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Características de la Lista:

✅ **Filtros por Estado**:
- **Pending** (por defecto) - Muestra solo las pendientes
- **All** - Todas las solicitudes
- **Approved** - Solo las aprobadas
- **Rejected** - Solo las rechazadas

✅ **Información Visible**:
- Badge de estado con icono (⏳ pending, ✅ approved, ❌ rejected)
- Claim Topic solicitado
- Indicador de documento adjunto (📎)
- Dirección del solicitante
- Mensaje de la solicitud (truncado si es largo)
- Fecha de creación

✅ **Interacción**:
- Click en cualquier solicitud para ver detalles completos
- Hover para resaltar
- Refresh para actualizar la lista

---

## 2️⃣ Modal de Detalle - Vista Completa

### Al hacer click en una solicitud:

```
┌───────────────────────────────────────────────────────────┐
│  Claim Request Details                              ✕     │
│                                                             │
│  ⏳ PENDING                                                │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Requester Address                                  │   │
│  │ 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Issuer Address (You)                               │   │
│  │ 0x70997970C51812dc3A010C7d01b50e0d17dc79C8        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Claim Topic                                        │   │
│  │ Topic 1                                            │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Message                                            │   │
│  │ I am requesting KYC verification for my identity.  │   │
│  │ I have attached all required documents including   │   │
│  │ passport, proof of address, and bank statements.   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Attached Document                                  │   │
│  │ [📎 passport.pdf (245.3 KB)]  ← Click to download│   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Timeline                                           │   │
│  │ Created: Nov 10, 2024, 10:30:15 AM                │   │
│  │ Updated: Nov 10, 2024, 10:30:15 AM                │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────│
│                                                             │
│  Review This Request                                       │
│                                                             │
│  Review Note (Optional)                                    │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [Add any notes about your decision...]            │   │
│  │                                                    │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │   ✓ Approve          │  │   ✕ Reject           │      │
│  └──────────────────────┘  └──────────────────────┘      │
└───────────────────────────────────────────────────────────┘
```

### Características del Modal:

✅ **Información Completa**:
- Todas las direcciones (requester e issuer)
- Claim topic solicitado
- Mensaje completo del solicitante
- Documento adjunto con descarga directa
- Timeline completo (created, updated, reviewed)

✅ **Descarga de Documentos**:
- Click en el nombre del archivo para descargar/ver
- Muestra el tamaño del archivo
- Se abre en nueva pestaña

✅ **Sección de Revisión** (solo para pending):
- Campo de texto para agregar notas
- Botón "✓ Approve" (verde)
- Botón "✕ Reject" (rojo)
- Loading state mientras procesa

✅ **Validaciones**:
- Solo el issuer correcto puede aprobar/rechazar
- Solo peticiones "pending" pueden modificarse
- Mensajes de error claros

---

## 3️⃣ Estados de las Solicitudes

### Estado: PENDING (⏳)
```
┌─────────────────────────────────────┐
│ ⏳ PENDING   Topic 1   📎          │
│ Requester: 0xf39...                │
│ Message: Please verify...          │
│                                 👉  │
└─────────────────────────────────────┘
```
- **Color**: Amarillo/Naranja
- **Acción**: Puede ser aprobado o rechazado
- **Visible en**: Filtro "Pending"

### Estado: APPROVED (✅)
```
┌─────────────────────────────────────┐
│ ✅ APPROVED   Topic 1   📎         │
│ Requester: 0xf39...                │
│ Reviewed: Nov 10, 2024             │
│                                 👉  │
└─────────────────────────────────────┘
```
- **Color**: Verde
- **Acción**: Solo lectura (ya procesado)
- **Visible en**: Filtro "Approved" y "All"

### Estado: REJECTED (❌)
```
┌─────────────────────────────────────┐
│ ❌ REJECTED   Topic 1              │
│ Requester: 0xf39...                │
│ Reviewed: Nov 10, 2024             │
│                                 👉  │
└─────────────────────────────────────┘
```
- **Color**: Rojo
- **Acción**: Solo lectura (ya procesado)
- **Visible en**: Filtro "Rejected" y "All"

---

## 4️⃣ Flujo de Uso Completo

### Paso 1: Conectar como Issuer
```
1. Abre http://localhost:3000
2. Conecta MetaMask con una cuenta de issuer registrado
3. El sistema detecta automáticamente que eres issuer
4. Aparece el panel "🎫 Issuer Panel"
```

### Paso 2: Ver Solicitudes Pendientes
```
1. Por defecto, muestra filtro "Pending"
2. Contador indica: "X pending approval"
3. Lista muestra todas las solicitudes pendientes
```

### Paso 3: Revisar una Solicitud
```
1. Click en una solicitud
2. Se abre modal con detalles completos
3. Si hay documento, click para descargar/ver
4. Lee toda la información
```

### Paso 4: Tomar Decisión
```
1. Escribe nota de revisión (opcional)
2. Click en "✓ Approve" o "✕ Reject"
3. Confirma la acción
4. Sistema actualiza el estado
5. Modal se cierra
6. Lista se actualiza automáticamente
```

---

## 5️⃣ Características Especiales

### Actualización Automática
- Al aprobar/rechazar, la lista se refresca automáticamente
- No necesitas recargar la página

### Contador de Pendientes
```
Claim Requests (15)
3 pending approval  ← Contador dinámico
```

### Refresh Manual
- Botón "🔄 Refresh" en la esquina superior derecha
- Útil si alguien más aprobó una solicitud

### Responsive Design
- Funciona en desktop y móvil
- Modal adaptable al tamaño de pantalla

---

## 6️⃣ Casos Especiales

### Sin Solicitudes
```
┌─────────────────────────────────────┐
│  No pending requests found.         │
└─────────────────────────────────────┘
```

### Ya Revisada
Si intentas aprobar/rechazar una ya procesada:
```
⚠️ This request has already been reviewed
```

### No Autorizado
Si intentas revisar una solicitud de otro issuer:
```
⚠️ You are not authorized to review this request
```

---

## 7️⃣ Testing Rápido

### 1. Crear una solicitud desde web-identity
```bash
# Terminal 1
cd web-identity
npm run dev -- -p 3001
# Abre http://localhost:3001
# Crea una solicitud con documento
```

### 2. Ver y aprobar desde web-registry-trusted
```bash
# Terminal 2
cd web-registry-trusted
npm run dev
# Abre http://localhost:3000
# Conecta como issuer
# Ve la solicitud en el panel
# Click → Revisar → Aprobar
```

### 3. Verificar en MongoDB
```bash
mongosh
> use rwa
> db.claim_requests.find().pretty()
```

---

## 🎨 Paleta de Colores

- **Pending**: Amarillo/Naranja (#FEF3C7, #F59E0B)
- **Approved**: Verde (#D1FAE5, #10B981)
- **Rejected**: Rojo (#FEE2E2, #EF4444)
- **Panel Issuer**: Púrpura (#F3E8FF, #A855F7)
- **Botones**: Azul (#3B82F6), Verde (#10B981), Rojo (#EF4444)

---

## 🔐 Seguridad Implementada

✅ Solo el issuer correspondiente puede aprobar/rechazar  
✅ Validación de direcciones en frontend y backend  
✅ Solo peticiones "pending" pueden modificarse  
✅ Verificación contra el contrato TrustedIssuersRegistry  
✅ Panel solo visible para issuers registrados  

---

## 📊 Resumen de Componentes

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `IssuerRequestsList` | `/components/` | Lista de solicitudes con filtros |
| `RequestDetailModal` | `/components/` | Modal de detalle y aprobación |
| `/api/issuer-requests` | `/app/api/` | Obtener solicitudes del issuer |
| `/api/update-request` | `/app/api/` | Aprobar/rechazar solicitud |
| `/api/download/[fileId]` | `/app/api/` | Descargar documento adjunto |

---

## ✅ Todo Está Listo!

La interfaz está **completamente funcional** con:

1. ✅ Lista de solicitudes con filtros
2. ✅ Modal de detalles completo
3. ✅ Botones de aprobar/rechazar
4. ✅ Descarga de documentos
5. ✅ Actualización automática
6. ✅ Validaciones de seguridad
7. ✅ Diseño responsive y moderno

**Solo necesitas**:
1. Iniciar MongoDB
2. Iniciar Anvil
3. `npm run dev` en web-registry-trusted
4. Conectar con una cuenta de issuer

¡Y listo para usar! 🚀

