# Claim Request System

Este sistema permite a los usuarios solicitar claims de los trusted issuers registrados en el contrato TrustedIssuersRegistry.

## Características

### 1. **Formulario de Solicitud de Claims**
- Lista desplegable de issuers disponibles (obtenida del contrato)
- Lista sincronizada de claim topics que cada issuer puede emitir
- Campo de mensaje opcional para detalles adicionales
- Adjuntar documentos (PDF, DOC, DOCX, JPG, PNG) hasta 10MB
- Validación en tiempo real

### 2. **Lista de Peticiones**
- Visualización de todas las peticiones del usuario
- Estados: Pending, Approved, Rejected
- Filtros por estado
- Información detallada de cada petición
- Enlaces a documentos adjuntos con tamaño
- Timestamps de creación y actualización

### 3. **Almacenamiento**
- **Base de datos**: MongoDB (localhost)
- **Nombre de la DB**: `rwa`
- **Colección de peticiones**: `claim_requests`
- **Almacenamiento de archivos**: MongoDB GridFS (bucket: `claim_documents`)
- **Sin Mongoose** (usando driver nativo de MongoDB)
- **Ventajas de GridFS**:
  - Archivos almacenados directamente en MongoDB
  - No dependencia del sistema de archivos
  - Metadata asociada a cada archivo
  - Mejor para backups y replicación
  - Streaming eficiente de archivos grandes

## Estructura del Proyecto

```
web-identity/
├── app/
│   ├── api/
│   │   ├── claim-requests/
│   │   │   └── route.ts          # GET y POST para peticiones
│   │   ├── upload/
│   │   │   └── route.ts          # POST para subir archivos a GridFS
│   │   └── download/
│   │       └── [fileId]/
│   │           └── route.ts      # GET para descargar desde GridFS
│   └── page.tsx                  # Página principal con integración
├── components/
│   ├── ClaimRequestForm.tsx      # Formulario de solicitud
│   └── ClaimRequestsList.tsx     # Lista de peticiones
├── lib/
│   └── mongodb.ts                # Utilidad de conexión a MongoDB
├── types/
│   └── claim-request.ts          # Tipos TypeScript
└── contracts/
    └── TrustedIssuersRegistry.ts # Configuración del contrato
```

## Configuración

### 1. MongoDB

Asegúrate de que MongoDB esté corriendo en localhost:

```bash
# macOS (con Homebrew)
brew services start mongodb-community

# O manualmente
mongod --config /usr/local/etc/mongod.conf
```

Verificar conexión:
```bash
mongosh
> use rwa
> db.claim_requests.find()
```

### 2. Variables de Entorno (Opcional)

Puedes crear un archivo `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017
```

### 3. Iniciar Desarrollo

```bash
npm run dev
```

## Flujo de Uso

1. **Conectar Wallet**: El usuario conecta su wallet de MetaMask
2. **Crear Identidad**: El usuario crea y registra su identidad on-chain
3. **Solicitar Claim**: Una vez registrado, aparece el formulario:
   - Seleccionar un issuer de la lista
   - Seleccionar un claim topic (sincronizado con los topics del issuer)
   - Escribir un mensaje opcional
   - Adjuntar un documento opcional
   - Enviar la solicitud
4. **Ver Peticiones**: La lista muestra todas las peticiones con sus estados

## API Endpoints

### POST `/api/claim-requests`

Crear una nueva solicitud de claim.

**Body:**
```json
{
  "requesterAddress": "0x...",
  "issuerAddress": "0x...",
  "claimTopic": "1",
  "message": "Optional message",
  "documentFileId": "507f1f77bcf86cd799439011",
  "documentName": "document.pdf",
  "documentContentType": "application/pdf",
  "documentSize": 12345
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "requesterAddress": "0x...",
    "issuerAddress": "0x...",
    "claimTopic": "1",
    "message": "Optional message",
    "documentFileId": "507f1f77bcf86cd799439011",
    "documentName": "document.pdf",
    "documentContentType": "application/pdf",
    "documentSize": 12345,
    "status": "pending",
    "createdAt": "2024-...",
    "updatedAt": "2024-..."
  },
  "message": "Claim request created successfully"
}
```

### GET `/api/claim-requests`

Obtener peticiones con filtros opcionales.

**Query Parameters:**
- `requesterAddress`: Filtrar por dirección del solicitante
- `issuerAddress`: Filtrar por dirección del issuer
- `status`: Filtrar por estado (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "requesterAddress": "0x...",
      "issuerAddress": "0x...",
      "claimTopic": "1",
      "status": "pending",
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  ],
  "count": 1
}
```

### POST `/api/upload`

Subir un archivo a MongoDB GridFS.

**Body:** FormData con campo `file`

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "507f1f77bcf86cd799439011",
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 12345,
    "uploadedAt": "2024-..."
  },
  "message": "File uploaded successfully to MongoDB"
}
```

### GET `/api/download/[fileId]`

Descargar un archivo desde MongoDB GridFS.

**Parameters:**
- `fileId`: ObjectId del archivo en GridFS

**Response:**
- Devuelve el archivo con los headers apropiados:
  - `Content-Type`: Tipo MIME del archivo
  - `Content-Length`: Tamaño del archivo
  - `Content-Disposition`: inline con el nombre del archivo

## Esquema de Base de Datos

### Colección: `claim_requests`

```typescript
{
  _id: ObjectId,
  requesterAddress: string,        // Dirección del solicitante (lowercase)
  issuerAddress: string,            // Dirección del issuer (lowercase)
  claimTopic: string,               // ID del claim topic
  message?: string,                 // Mensaje opcional
  documentFileId?: string,          // ObjectId del archivo en GridFS
  documentName?: string,            // Nombre original del documento
  documentContentType?: string,     // Tipo MIME del documento
  documentSize?: number,            // Tamaño del documento en bytes
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Date,
  updatedAt: Date
}
```

### GridFS Bucket: `claim_documents`

MongoDB GridFS crea automáticamente dos colecciones:
- `claim_documents.files`: Metadata de los archivos
- `claim_documents.chunks`: Chunks de datos de los archivos

**Estructura de `claim_documents.files`:**
```typescript
{
  _id: ObjectId,
  length: number,
  chunkSize: number,
  uploadDate: Date,
  filename: string,
  metadata: {
    originalName: string,
    contentType: string,
    size: number,
    uploadedAt: Date
  }
}
```

### Índices Recomendados

```javascript
// Colección claim_requests
db.claim_requests.createIndex({ requesterAddress: 1 })
db.claim_requests.createIndex({ issuerAddress: 1 })
db.claim_requests.createIndex({ status: 1 })
db.claim_requests.createIndex({ createdAt: -1 })
db.claim_requests.createIndex({ documentFileId: 1 })

// GridFS indices (se crean automáticamente)
db.claim_documents.files.createIndex({ filename: 1 })
db.claim_documents.chunks.createIndex({ files_id: 1, n: 1 })
```

## Notas de Seguridad

- **Archivos en MongoDB GridFS**: Los archivos se almacenan directamente en MongoDB, no en el sistema de archivos
- **Validación de tipo MIME**: Solo se permiten tipos de archivo específicos
- **Límite de tamaño**: Máximo 10MB por archivo
- **Formatos permitidos**: PDF, DOC, DOCX, JPG, PNG
- **ObjectId únicos**: Cada archivo tiene un ID único en GridFS
- **Metadata completa**: Cada archivo incluye nombre original, tipo, tamaño y fecha
- **Direcciones normalizadas**: Las direcciones de Ethereum se almacenan en lowercase
- **Streaming eficiente**: Los archivos grandes se transmiten por chunks

## Próximos Pasos (Futuras Mejoras)

1. **Panel de Admin para Issuers**: Permitir a los issuers ver y aprobar/rechazar peticiones
2. **Notificaciones**: Sistema de notificaciones por email o webhook
3. **Integración con Contrato**: Emitir claims on-chain cuando sean aprobados
4. **Autenticación**: Sistema de autenticación más robusto
5. **Paginación**: Añadir paginación a la lista de peticiones
6. **Búsqueda Avanzada**: Filtros y búsqueda más complejos
7. **Almacenamiento en IPFS**: Guardar documentos en IPFS en lugar del servidor

## Troubleshooting

### Error: Cannot connect to MongoDB

Verifica que MongoDB esté corriendo:
```bash
brew services list
```

Inicia MongoDB si no está corriendo:
```bash
brew services start mongodb-community
```

### Error: File upload failed

Verifica que MongoDB esté corriendo y accesible. GridFS no requiere configuración adicional, se crea automáticamente.

### Los issuers no aparecen en el formulario

Verifica que:
1. Anvil esté corriendo en `localhost:8545`
2. El contrato TrustedIssuersRegistry esté desplegado
3. Haya issuers registrados en el contrato

