# Guía de Testing - Sistema de Claim Requests

## ✅ Problema Resuelto: Download de Archivos

### Cambio Aplicado
En Next.js 15+, los parámetros dinámicos en rutas API deben ser asíncronos:

```typescript
// ❌ Antes (no funciona en Next.js 15+)
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
)

// ✅ Ahora (correcto)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params; // ← Importante: await params
}
```

## 🧪 Testing del Sistema

### 1. Iniciar MongoDB

```bash
# macOS con Homebrew
brew services start mongodb-community

# Verificar que está corriendo
brew services list | grep mongodb

# O conectarse directamente
mongosh
```

### 2. Iniciar el Servidor de Desarrollo

```bash
cd web-identity
npm run dev
```

### 3. API de Testing

He creado una API para verificar el estado del sistema:

**Endpoint:** `GET http://localhost:3000/api/test-gridfs`

```bash
curl http://localhost:3000/api/test-gridfs | json_pp
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 0,
    "files": [],
    "totalRequests": 0,
    "requests": []
  }
}
```

### 4. Flujo Completo de Testing

#### Paso 1: Conectar Wallet
1. Abre http://localhost:3000
2. Conecta MetaMask con la cuenta de desarrollo
3. Crea y registra tu identidad

#### Paso 2: Subir Archivo y Crear Request
1. En el formulario de "Request Claim":
   - Selecciona un issuer
   - Selecciona un claim topic
   - Escribe un mensaje (opcional)
   - **Adjunta un archivo PDF** (importante para testing)
   - Click en "Submit Claim Request"

2. Verifica en consola del navegador:
   - Debe mostrar "File uploaded successfully to MongoDB"
   - Debe mostrar "Claim request created successfully"

#### Paso 3: Verificar en MongoDB

```bash
mongosh
> use rwa
> db.claim_documents.files.find().pretty()
> db.claim_requests.find().pretty()
```

**Deberías ver:**
- Archivo en `claim_documents.files` con metadata
- Request en `claim_requests` con `documentFileId`

#### Paso 4: Probar Download
1. En la lista de peticiones, haz clic en el nombre del documento
2. El archivo debería abrirse/descargarse en una nueva pestaña
3. URL será: `http://localhost:3000/api/download/[fileId]`

### 5. Testing Manual de APIs

#### Upload de Archivo

```bash
# Subir un archivo de prueba
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/test.pdf" \
  | json_pp
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "fileId": "67abc123...",
    "filename": "test.pdf",
    "contentType": "application/pdf",
    "size": 12345,
    "uploadedAt": "2024-..."
  }
}
```

#### Download de Archivo

```bash
# Usar el fileId del paso anterior
curl http://localhost:3000/api/download/67abc123... \
  --output downloaded.pdf
```

#### Crear Request

```bash
curl -X POST http://localhost:3000/api/claim-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "issuerAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "claimTopic": "1",
    "message": "Test request",
    "documentFileId": "67abc123...",
    "documentName": "test.pdf",
    "documentContentType": "application/pdf",
    "documentSize": 12345
  }' \
  | json_pp
```

#### Listar Requests

```bash
curl http://localhost:3000/api/claim-requests | json_pp

# Filtrar por dirección
curl "http://localhost:3000/api/claim-requests?requesterAddress=0xf39..." | json_pp
```

## 🐛 Troubleshooting

### Error: "Failed to download file"

**Posibles causas:**

1. **MongoDB no está corriendo**
   ```bash
   brew services start mongodb-community
   ```

2. **FileId inválido**
   - Verifica que el fileId es un ObjectId válido de MongoDB (24 caracteres hex)
   - Verifica en MongoDB: `db.claim_documents.files.find()`

3. **El archivo no existe en GridFS**
   ```bash
   mongosh
   > use rwa
   > db.claim_documents.files.count()  // Debe ser > 0
   ```

### Error: "Invalid file ID"

El fileId debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales).

**Verificar:**
```bash
mongosh
> use rwa
> db.claim_documents.files.find({}, {_id: 1, filename: 1})
```

### Error en Upload

1. **Verificar tipo de archivo**
   - Solo: PDF, DOC, DOCX, JPG, PNG
   
2. **Verificar tamaño**
   - Máximo: 10MB

3. **Verificar MongoDB**
   ```bash
   mongosh --eval "db.serverStatus()" --quiet
   ```

### No aparecen archivos en la lista

1. **Verificar que el upload fue exitoso**
   - Abrir DevTools → Network → Ver response del POST a `/api/upload`
   - Debe devolver `success: true` y un `fileId`

2. **Verificar que el request se creó correctamente**
   - Abrir DevTools → Network → Ver response del POST a `/api/claim-requests`
   - Debe incluir `documentFileId`

3. **Verificar en MongoDB**
   ```bash
   mongosh
   > use rwa
   > db.claim_requests.find({}, {documentFileId: 1, documentName: 1}).pretty()
   ```

## 📊 Monitoreo

### Ver logs del servidor
```bash
# En la terminal donde corre npm run dev
# Verás logs de:
# - Uploads a GridFS
# - Downloads desde GridFS
# - Creación de requests
```

### Estadísticas de GridFS

```javascript
mongosh
> use rwa
> db.claim_documents.files.aggregate([
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: "$length" },
        avgSize: { $avg: "$length" }
      }
    }
  ])
```

## 🔍 Debugging Avanzado

### Inspeccionar un archivo específico

```javascript
mongosh
> use rwa
> const file = db.claim_documents.files.findOne()
> print(JSON.stringify(file, null, 2))
```

### Ver chunks de un archivo

```javascript
> const fileId = ObjectId("67abc123...")
> db.claim_documents.chunks.find({ files_id: fileId }).count()
```

### Eliminar archivos de prueba

```javascript
// ⚠️ CUIDADO: Esto elimina TODO
> db.claim_documents.files.deleteMany({})
> db.claim_documents.chunks.deleteMany({})
> db.claim_requests.deleteMany({})
```

## ✅ Checklist de Verificación

- [ ] MongoDB está corriendo
- [ ] Servidor de desarrollo iniciado (`npm run dev`)
- [ ] Wallet conectada con identidad registrada
- [ ] API `/api/test-gridfs` responde correctamente
- [ ] Puedo subir un archivo (verificar en DevTools)
- [ ] El archivo aparece en MongoDB (`claim_documents.files`)
- [ ] Puedo crear un request con archivo
- [ ] El link de descarga aparece en la lista
- [ ] Puedo descargar el archivo haciendo clic en el link

## 🎯 Próximos Pasos

Si todo funciona correctamente:
1. Probar con diferentes tipos de archivo (PDF, JPG, PNG)
2. Probar con archivos grandes (cerca de 10MB)
3. Verificar que los archivos se descargan correctamente
4. Implementar el panel de issuers para aprobar/rechazar requests

