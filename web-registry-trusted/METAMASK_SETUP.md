# Configuración de MetaMask para Anvil Local

Esta guía te ayudará a configurar MetaMask para conectarte a la red local de Anvil.

## Paso 1: Agregar la Red Anvil Local a MetaMask

1. Abre MetaMask
2. Haz clic en el selector de redes (arriba, en el centro)
3. Haz clic en "Add network" o "Agregar red"
4. Haz clic en "Add a network manually" o "Agregar una red manualmente"
5. Completa los siguientes datos:

```
Network Name: Anvil Local
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH
```

6. Haz clic en "Save" o "Guardar"

## Paso 2: Importar Cuentas de Anvil

Anvil genera automáticamente 10 cuentas con fondos. Aquí están las primeras 3:

### Cuenta 1 (OWNER del contrato) ⭐
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Cuenta 2
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Cuenta 3
```
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

## Cómo Importar una Cuenta en MetaMask:

1. Abre MetaMask
2. Haz clic en el icono de tu cuenta (arriba a la derecha)
3. Selecciona "Import account" o "Importar cuenta"
4. Selecciona "Private Key" como método de importación
5. Pega la private key (SIN el prefijo 0x o CON él, MetaMask acepta ambos)
6. Haz clic en "Import" o "Importar"

**Nota:** Para la cuenta owner, usa la Private Key de la Cuenta 1.

## Paso 3: Cambiar a la Red Anvil Local

1. En MetaMask, haz clic en el selector de redes
2. Selecciona "Anvil Local"

## Paso 4: Verificar la Conexión

1. Asegúrate de que Anvil esté corriendo:
   ```bash
   anvil
   ```

2. Verifica que veas el balance de ~10000 ETH en tu cuenta

## ⚠️ IMPORTANTE

- **NUNCA uses estas private keys en redes reales (mainnet, testnets públicas)**
- Estas cuentas son solo para desarrollo local
- Anvil debe estar corriendo en `http://localhost:8545`

## Problemas Comunes

### Error: "Invalid Chain ID"
- Asegúrate de que el Chain ID sea exactamente `31337`

### Error: "Cannot connect to RPC"
- Verifica que Anvil esté corriendo en el puerto 8545
- Ejecuta: `anvil` en una terminal

### No veo el balance
- Verifica que estás conectado a la red "Anvil Local"
- Reinicia MetaMask si es necesario

### La transacción falla
- Asegúrate de estar usando la cuenta owner para agregar issuers
- Verifica que el contrato esté desplegado en la dirección correcta

