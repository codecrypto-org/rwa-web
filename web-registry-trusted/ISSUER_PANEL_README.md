# Issuer Panel - Sistema de Aprobación de Claims

## 📋 Descripción

Panel de administración para que los **Trusted Issuers** puedan ver y aprobar/rechazar las peticiones de claims que los usuarios les envían desde la aplicación `web-identity`.

## ✨ Características

### Para Issuers (Trusted Issuers)
- ✅ Ver todas las peticiones dirigidas a su dirección
- ✅ Filtrar por estado: Pending, All, Approved, Rejected
- ✅ Ver detalles completos de cada petición
- ✅ Descargar documentos adjuntos desde MongoDB GridFS
- ✅ Aprobar o rechazar peticiones
- ✅ Agregar notas de revisión
- ✅ Solo pueden actuar en peticiones dirigidas a ellos

### Para Owners (Contract Owner)
- ✅ Agregar nuevos Trusted Issuers al registro
- ✅ Ver la lista completa de issuers registrados
- ✅ Ver los claim topics de cada issuer

## 🏗️ Arquitectura

```
web-registry-trusted/
├── app/
│   ├── api/
│   │   ├── issuer-requests/
│   │   │   └── route.ts          # GET requests del issuer
│   │   ├── update-request/
│   │   │   └── route.ts          # POST aprobar/rechazar
│   │   └── download/
│   │       └── [fileId]/
│   │           └── route.ts      # GET descargar archivos
│   └── page.tsx                  # Página principal con panel
├── components/
│   ├── IssuerRequestsList.tsx    # Lista de peticiones
│   └── RequestDetailModal.tsx    # Modal de detalle y aprobación
├── lib/
│   └── mongodb.ts                # Conexión a MongoDB
└── types/
    └── claim-request.ts          # Tipos TypeScript
```

## 🚀 Uso

### 1. Iniciar Servicios

```bash
# Terminal 1: MongoDB
brew services start mongodb-community

# Terminal 2: Anvil (blockchain local)
cd /path/to/blockchain-project
anvil

# Terminal 3: Web Registry Trusted
cd web-registry-trusted
npm run dev
```

### 2. Conectar como Owner (Agregar Issuers)

1. Abre http://localhost:3000
2. Conecta MetaMask con la cuenta owner:
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Agrega un nuevo issuer (ej: cuenta 2 de Hardhat)
4. Especifica los claim topics que puede emitir (ej: 1,7,9)

### 3. Conectar como Issuer (Aprobar Peticiones)

1. Cambia de cuenta en MetaMask a una cuenta de issuer registrado
2. Refresca la página
3. Verás el **🎫 Issuer Panel** con tus peticiones pendientes
4. Haz clic en una petición para ver detalles
5. Revisa la información y el documento adjunto
6. Aprueba o rechaza con una nota opcional

## 🔄 Flujo Completo

```
┌─────────────────┐
│  web-identity   │
│   (Requester)   │
└────────┬────────┘
         │
         │ 1. Crea petición
         │    + Documento
         ▼
   ┌──────────┐
   │ MongoDB  │
   │   rwa    │
   └────┬─────┘
        │
        │ 2. Consulta peticiones
        ▼
┌────────────────────┐
│ web-registry-trusted│
│     (Issuer)       │
└────────┬───────────┘
         │
         │ 3. Aprueba/Rechaza
         ▼
   ┌──────────┐
   │ MongoDB  │
   │ (update) │
   └──────────┘
```

## 📊 API Endpoints

### GET `/api/issuer-requests`

Obtener peticiones de un issuer específico.

**Query Parameters:**
- `issuerAddress` (required): Dirección del issuer
- `status` (optional): `pending`, `approved`, `rejected`

**Ejemplo:**
```bash
curl "http://localhost:3000/api/issuer-requests?issuerAddress=0x70997...&status=pending"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "requesterAddress": "0xf39...",
      "issuerAddress": "0x7099...",
      "claimTopic": "1",
      "message": "KYC verification request",
      "documentFileId": "67abc...",
      "documentName": "passport.pdf",
      "status": "pending",
      "createdAt": "2024-..."
    }
  ],
  "count": 1
}
```

### POST `/api/update-request`

Aprobar o rechazar una petición.

**Body:**
```json
{
  "requestId": "67abc123...",
  "status": "approved",
  "reviewNote": "Document verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67abc123...",
    "status": "approved",
    "reviewedAt": "2024-...",
    "reviewNote": "Document verified successfully",
    ...
  },
  "message": "Request approved successfully"
}
```

### GET `/api/download/[fileId]`

Descargar un documento desde MongoDB GridFS.

**Ejemplo:**
```bash
curl http://localhost:3000/api/download/67abc123... --output document.pdf
```

## 🔐 Seguridad

### Validaciones Implementadas

1. **Verificación de Issuer**: 
   - Solo el issuer al que está dirigida la petición puede aprobar/rechazar
   - Se verifica que la dirección coincida con `issuerAddress`

2. **Estado de Petición**:
   - Solo se pueden aprobar/rechazar peticiones con estado `pending`
   - Las peticiones ya procesadas no pueden modificarse

3. **Validación de ObjectId**:
   - Todos los IDs de MongoDB se validan antes de usar

4. **Solo Issuers Registrados**:
   - El panel solo aparece si la cuenta conectada es un issuer registrado en el contrato

## 📝 Base de Datos

### Colección: `claim_requests`

```typescript
{
  _id: ObjectId,
  requesterAddress: string,      // Usuario que solicita el claim
  issuerAddress: string,          // Issuer que debe aprobar (tú)
  claimTopic: string,             // Tipo de claim (1, 7, 9, etc.)
  message?: string,               // Mensaje del solicitante
  documentFileId?: string,        // ID del documento en GridFS
  documentName?: string,
  documentContentType?: string,
  documentSize?: number,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Date,
  updatedAt: Date,
  reviewedAt?: Date,              // Fecha de revisión
  reviewNote?: string             // Nota del issuer
}
```

### GridFS Bucket: `claim_documents`

Los documentos adjuntos se almacenan en GridFS:
- `claim_documents.files`: Metadata
- `claim_documents.chunks`: Datos del archivo

## 🧪 Testing

### Verificar MongoDB

```bash
mongosh
> use rwa
> db.claim_requests.find().pretty()
> db.claim_documents.files.find().pretty()
```

### Verificar Estado del Sistema

```bash
# Ver peticiones pendientes para un issuer
curl "http://localhost:3000/api/issuer-requests?issuerAddress=0x70997970C51812dc3A010C7d01b50e0d17dc79C8&status=pending" | json_pp
```

### Aprobar una Petición

```bash
curl -X POST http://localhost:3000/api/update-request \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "67abc123...",
    "status": "approved",
    "reviewNote": "All documents verified"
  }' | json_pp
```

## 🎯 Estados de Peticiones

| Estado | Descripción | Puede Modificarse |
|--------|-------------|-------------------|
| `pending` | Esperando revisión del issuer | ✅ Sí |
| `approved` | Aprobada por el issuer | ❌ No |
| `rejected` | Rechazada por el issuer | ❌ No |

## 🔍 Troubleshooting

### No veo el panel de issuer

**Causas posibles:**
1. No estás conectado con una cuenta de issuer registrado
2. La cuenta no está en el contrato TrustedIssuersRegistry
3. Anvil no está corriendo

**Solución:**
```bash
# Verificar si eres issuer
mongosh
> use rwa
# Conectar a Anvil y verificar con ethers
```

### No aparecen peticiones

**Causas posibles:**
1. No hay peticiones dirigidas a tu dirección
2. MongoDB no está corriendo
3. Las peticiones están en otra dirección

**Solución:**
```bash
# Ver todas las peticiones
mongosh
> use rwa
> db.claim_requests.find({ issuerAddress: "0x70997..." }).pretty()
```

### Error al aprobar/rechazar

**Causas posibles:**
1. La petición ya fue procesada
2. No eres el issuer de esa petición
3. MongoDB no responde

**Solución:**
- Verifica el estado de la petición en MongoDB
- Verifica que tu dirección coincida con `issuerAddress`

## 📚 Recursos Adicionales

- **Guía de Configuración**: `QUICK_START.md`
- **Contrato**: `CONTRACT_INTEGRATION_SUMMARY.md`
- **Setup de MetaMask**: `METAMASK_SETUP.md`

## 🎨 UI Features

- **Filtros por Estado**: Pending (default), All, Approved, Rejected
- **Contador de Pendientes**: Muestra cuántas peticiones esperan aprobación
- **Modal de Detalle**: Información completa de la petición
- **Descarga de Documentos**: Click directo para ver/descargar archivos
- **Timestamps**: Fechas de creación, actualización y revisión
- **Notas de Revisión**: Campo opcional para agregar comentarios

## 🚦 Next Steps (Futuras Mejoras)

1. **Emisión On-Chain**: Crear el claim en blockchain cuando se aprueba
2. **Notificaciones**: Avisar al usuario cuando su petición es aprobada
3. **Historial**: Ver peticiones procesadas anteriormente
4. **Estadísticas**: Dashboard con métricas del issuer
5. **Búsqueda**: Filtrar por dirección de solicitante o fecha
6. **Paginación**: Para issuers con muchas peticiones
7. **Exportar**: Descargar reporte de peticiones aprobadas/rechazadas

