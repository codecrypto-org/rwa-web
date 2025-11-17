# ⚡ Guía Rápida - RWA Platform

**Para comenzar en 5 minutos**

---

## 🚀 Inicio Rápido

### 1. Iniciar Servicios (3 comandos)

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Anvil (Blockchain local)
anvil

# Terminal 3: Aplicaciones web
cd "57_RWA_WEB"
./start-all.sh
```

### 2. Configurar MetaMask

**Red Anvil:**
- Network: Anvil Local
- RPC: http://localhost:8545
- Chain ID: 31337

**Importar cuenta de prueba:**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 3. Abrir Aplicaciones

- 🆔 Identity: http://localhost:4001
- 🏛️ Registry: http://localhost:4002
- 🏭 Token: http://localhost:4003

---

## 📋 Flujo Básico (10 pasos)

### Como Admin/Issuer (Cuenta 0xf39F...)

#### Paso 1-2: Crear Token
```
1. http://localhost:4003
2. Create Token:
   - Name: "Test Token"
   - Symbol: "TEST"
   - Claims: KYC, Accredited, Jurisdiction
3. Set Price: 0.5 ETH
```

### Como Investor (Cambiar cuenta en MetaMask)

#### Paso 3-5: Obtener Claims
```
3. http://localhost:4001
4. Deploy Identity
5. Request Claims → Select Issuer → KYC
```

#### Paso 6: Aprobar como Issuer (Cambiar a cuenta Issuer)
```
6. http://localhost:4002
7. Approve request
```

#### Paso 7-8: Cargar Claims (Volver a cuenta Investor)
```
8. http://localhost:4001
9. Load approved claim to contract
```

#### Paso 9-10: Comprar Token
```
10. http://localhost:4003/marketplace
11. Buy Tokens → Enter amount → ✅ Success!
```

---

## 🎯 Comandos Útiles

### Verificar Estado
```bash
./check-status.sh
```

### Detener Todo
```bash
./stop-all.sh
```

### Ver Logs
```bash
tail -f logs/web-identity.log
tail -f logs/web-registry-trusted.log
tail -f logs/web-token.log
```

### Verificar MongoDB
```bash
mongosh
> use rwa
> db.tokens.find().pretty()
> db.claim_requests.find().pretty()
```

---

## 🔧 Troubleshooting Rápido

### "Transfer not compliant"
→ Ve a Identity app → Request claims → Load to contract

### "Execution reverted"
→ Verifica que eres el owner del token/contrato

### "No veo Issuer Panel"
→ Tu cuenta no es trusted issuer en el registro

### "Account no cambia"
→ Recarga la página después de cambiar en MetaMask

---

## 📚 Documentación Completa

- **Guía Detallada:** Ver `FICHERO_PARA_ESTUDIANTE.md`
- **Diagramas C4:** Ver `DIAGRAMA_C4.md`
- **README Principal:** Ver `README.md`

---

## 🎓 Conceptos Clave

| Término | Significado |
|---------|-------------|
| **Claim** | Certificación on-chain (KYC, Accreditation) |
| **Issuer** | Entidad que certifica claims |
| **Compliance** | Verificación automática de requisitos |
| **RWA** | Real World Assets - Activos tokenizados |
| **Clone** | Token creado con EIP-1167 (gas efficient) |

---

**¡Listo para empezar!** 🚀
