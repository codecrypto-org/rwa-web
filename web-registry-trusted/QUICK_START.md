# Quick Start Guide

## 🚀 Inicio Rápido

### 1. Verificar Pre-requisitos

Asegúrate de tener Anvil corriendo:

```bash
# En una terminal separada
anvil
```

El contrato ya está desplegado en:
- **Address**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Network**: Anvil Local (http://localhost:8545)

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Iniciar la Aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Archivos Importantes

### Configuración del Contrato

```
lib/contracts/
├── TrustedIssuersRegistry.ts   # ABI y dirección del contrato
├── index.ts                     # Exports centralizados
└── README.md                    # Documentación completa
```

### Componente de Ejemplo

```
lib/examples/
└── TrustedIssuersExample.tsx    # Componente React de ejemplo
```

---

## 🔧 Uso Básico

### Importar la configuración del contrato:

```typescript
import {
  TRUSTED_ISSUERS_REGISTRY_ADDRESS,
  TRUSTED_ISSUERS_REGISTRY_ABI,
  NETWORK_CONFIG,
  CONTRACT_OWNER,
} from '@/lib/contracts';
```

### Ejemplo de lectura del contrato:

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const contract = new ethers.Contract(
  TRUSTED_ISSUERS_REGISTRY_ADDRESS,
  TRUSTED_ISSUERS_REGISTRY_ABI,
  provider
);

// Obtener todos los issuers confiables
const issuers = await contract.getTrustedIssuers();
console.log('Trusted Issuers:', issuers);

// Verificar si una dirección es un issuer confiable
const isTrusted = await contract.isTrustedIssuer('0x...');
console.log('Is Trusted:', isTrusted);

// Obtener los claim topics de un issuer
const topics = await contract.getIssuerClaimTopics('0x...');
console.log('Claim Topics:', topics);
```

---

## 📦 Instalación de Librerías Web3

Dependiendo de tu preferencia, puedes usar:

### ethers.js (Recomendado para comenzar)
```bash
npm install ethers
```

### viem (Alternativa moderna)
```bash
npm install viem
```

### wagmi (Para hooks de React)
```bash
npm install wagmi viem @tanstack/react-query
```

---

## 🎯 Funciones del Contrato

### Funciones de Lectura (Públicas)

| Función | Descripción | Retorna |
|---------|-------------|---------|
| `getTrustedIssuers()` | Lista todos los issuers | `address[]` |
| `isTrustedIssuer(address)` | Verifica si es confiable | `bool` |
| `getIssuerClaimTopics(address)` | Obtiene claim topics | `uint256[]` |
| `hasClaimTopic(address, uint256)` | Verifica topic específico | `bool` |
| `getTrustedIssuersCount()` | Cuenta total de issuers | `uint256` |
| `owner()` | Dirección del owner | `address` |

### Funciones de Escritura (Solo Owner)

| Función | Descripción | Requiere |
|---------|-------------|----------|
| `addTrustedIssuer(address, uint256[])` | Agregar issuer | Owner |
| `removeTrustedIssuer(address)` | Remover issuer | Owner |
| `updateIssuerClaimTopics(address, uint256[])` | Actualizar topics | Owner |
| `transferOwnership(address)` | Transferir ownership | Owner |

---

## 🔑 Interactuar con el Contrato (Como Owner)

Para agregar o modificar issuers, necesitas usar la cuenta del owner:

**Owner Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key** (Anvil default): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Ejemplo con ethers.js:

```typescript
import { ethers } from 'ethers';
import { TRUSTED_ISSUERS_REGISTRY_ADDRESS, TRUSTED_ISSUERS_REGISTRY_ABI } from '@/lib/contracts';

// Conectar con la cuenta del owner
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
const contract = new ethers.Contract(
  TRUSTED_ISSUERS_REGISTRY_ADDRESS,
  TRUSTED_ISSUERS_REGISTRY_ABI,
  wallet
);

// Agregar un trusted issuer con claim topics
const issuerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const claimTopics = [1, 2, 3]; // KYC, AML, etc.
const tx = await contract.addTrustedIssuer(issuerAddress, claimTopics);
await tx.wait();
console.log('Issuer added successfully!');
```

---

## 🧪 Testing

Para probar rápidamente que todo funciona:

### 1. Verificar el contrato desde la consola del navegador:

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(
  '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  [/* ABI */],
  provider
);

const issuers = await contract.getTrustedIssuers();
console.log(issuers);
```

### 2. Usando el componente de ejemplo:

```typescript
// En tu app/page.tsx
import TrustedIssuersExample from '@/lib/examples/TrustedIssuersExample';

export default function Home() {
  return <TrustedIssuersExample />;
}
```

---

## 📚 Recursos Adicionales

- **Documentación del Contrato**: Ver `lib/contracts/README.md`
- **Ejemplos de Código**: Ver `lib/examples/`
- **Next.js Docs**: https://nextjs.org/docs
- **ethers.js Docs**: https://docs.ethers.org/v6/
- **Anvil Docs**: https://book.getfoundry.sh/anvil/

---

## 🐛 Troubleshooting

### Error: "Cannot connect to localhost:8545"
- Asegúrate de que Anvil esté corriendo: `anvil`

### Error: "Contract not deployed"
- Verifica que la dirección del contrato sea correcta
- Redespliega si es necesario y actualiza la dirección en `lib/contracts/TrustedIssuersRegistry.ts`

### Error: "Transaction reverted"
- Verifica que estés usando la cuenta del owner para funciones restringidas
- Revisa que los parámetros sean correctos

---

## 💡 Próximos Pasos

1. **Personaliza la UI**: Edita `app/page.tsx` con tu interfaz
2. **Agrega funcionalidad de escritura**: Implementa formularios para agregar/remover issuers
3. **Conecta una wallet**: Integra MetaMask u otra wallet para interactuar como owner
4. **Agrega eventos**: Escucha eventos del contrato en tiempo real
5. **Deploy a testnet**: Despliega el contrato en Sepolia o Polygon Mumbai

---

¡Listo para empezar! 🎉

