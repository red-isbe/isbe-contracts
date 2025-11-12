# Signature Providers

Sistema de providers unificado para manejar firmas en redes secp256k1 y secp256r1.

## Arquitectura

```
ISignatureProvider (interface)
    │   ├── Secp256k1Provider (secp256k1 implementation)
    │   └── Secp256r1Provider (secp256r1 implementation)
    └── SignatureProviderFactory (factory)
```

## Uso

### Detección Automática

El factory detecta automáticamente el tipo de red y crea el provider apropiado:

```typescript
import { SignatureProviderFactory } from './providers'

// Crear provider (detecta automáticamente secp256k1 o secp256r1)
const provider = SignatureProviderFactory.create(hre)

// Inicializar
await provider.initialize()

// Obtener información
const info = await provider.getProviderInfo()
console.log(`Curve: ${info.curve}`)
console.log(`Address: ${info.address}`)

// Desplegar contrato
const factory = await hre.ethers.getContractFactory('MyContract')
const tx = await provider.deploy(factory, arg1, arg2)

// Enviar transacción
const tx = await provider.sendTransaction(to, data, value)
```

### Provider Específico

Para casos especiales, puedes crear un provider específico:

```typescript
import { SignatureProviderFactory, CurveType } from './providers'

// Crear provider secp256r1 específicamente
const provider = SignatureProviderFactory.createSpecific(
    hre,
    CurveType.SECP256R1
)
```

## Providers

### Secp256k1Provider

Provider para redes Ethereum estándar (MVP, Arsys, Kepler, etc.)

**Características:**
- Usa ethers signers estándar
- Compatible con MetaMask y wallets estándar
- Sin configuración adicional necesaria

**Redes soportadas:**
- hardhat (31337)
- localhost (2222)
- mvp (2023)
- arsys (2024)
- kepler (1003)

### Secp256r1Provider

Provider para redes Hyperledger Besu con secp256r1 (NIST P-256)

**Características:**
- Usa utilidades de firma secp256r1 existentes
- Requiere cuentas secp256r1 configuradas
- Transaction signing custom

**Redes soportadas:**
- customR1Network (2222)
- bare (10962)

**Configuración requerida:**

```bash
# Generar cuentas secp256r1
npx hardhat generate-secp256r1-env --count 5

# Validar cuentas
npx hardhat validate-accounts
```

## Interface ISignatureProvider

Todos los providers implementan esta interfaz común:

```typescript
interface ISignatureProvider {
    // Inicializar provider
    initialize(): Promise<void>

    // Obtener dirección del deployer
    getAddress(): Promise<string>

    // Obtener tipo de curva
    getCurveType(): CurveType

    // Obtener información del provider
    getProviderInfo(): ProviderInfo

    // Desplegar contrato
    deploy(
        contractFactory: ContractFactory,
        ...args: any[]
    ): Promise<ContractTransactionResponse>

    // Enviar transacción
    sendTransaction(
        to: string,
        data: string,
        value?: bigint
    ): Promise<ContractTransactionResponse>

    // Esperar confirmación
    waitForTransaction(
        txHash: string,
        confirmations?: number
    ): Promise<ContractTransactionResponse>

    // Obtener balance
    getBalance(): Promise<bigint>

    // Obtener nonce
    getNonce(): Promise<number>

    // Verificar si está listo
    isReady(): boolean
}
```

## Ejemplos

### Ejemplo 1: Despliegue Simple

```typescript
const provider = SignatureProviderFactory.create(hre)
await provider.initialize()

const factory = await hre.ethers.getContractFactory('MyContract')
const tx = await provider.deploy(factory)
console.log(`Deployed at: ${tx.to}`)
```

### Ejemplo 2: Despliegue con Argumentos

```typescript
const provider = SignatureProviderFactory.create(hre)
await provider.initialize()

const factory = await hre.ethers.getContractFactory('ERC20Token')
const tx = await provider.deploy(factory, 'MyToken', 'MTK', 18)
```

### Ejemplo 3: Enviar Transacción

```typescript
const provider = SignatureProviderFactory.create(hre)
await provider.initialize()

const data = contractInterface.encodeFunctionData('transfer', [
    recipient,
    amount,
])
const tx = await provider.sendTransaction(contractAddress, data)
await provider.waitForTransaction(tx.hash)
```

### Ejemplo 4: Verificar Información

```typescript
const provider = SignatureProviderFactory.create(hre)
await provider.initialize()

const info = await provider.getProviderInfo()
console.log(`Network: ${info.network}`)
console.log(`Chain ID: ${info.chainId}`)
console.log(`Curve: ${info.curve}`)
console.log(`Deployer: ${info.address}`)

const balance = await provider.getBalance()
console.log(`Balance: ${balance} wei`)
```

## Testing

### Unit Tests

```typescript
describe('SignatureProviderFactory', () => {
    it('should detect secp256k1 network', async () => {
        const provider = SignatureProviderFactory.create(hre)
        expect(provider.getCurveType()).to.equal(CurveType.SECP256K1)
    })

    it('should detect secp256r1 network', async () => {
        const provider = SignatureProviderFactory.create(hre)
        expect(provider.getCurveType()).to.equal(CurveType.SECP256R1)
    })
})
```

## Migración desde Sistema Anterior

El nuevo sistema de providers es compatible con el código existente:

### Antes

```typescript
// tasks/deployment/providers/SignatureProviderFactory.ts
const provider = SignatureProviderFactory.create(hre)
```

### Ahora

```typescript
// deploy/providers/SignatureProviderFactory.ts
const provider = SignatureProviderFactory.create(hre)
```

Ambos sistemas pueden coexistir durante la migración.

## Troubleshooting

### Error: "No signers available"

**Solución:**
```bash
# Verificar configuración de cuentas
npx hardhat validate-accounts
```

### Error: "No secp256r1 accounts configured"

**Solución:**
```bash
# Generar cuentas secp256r1
npx hardhat generate-secp256r1-env --count 5
```

### Error: "Provider not initialized"

**Solución:**
```typescript
// Siempre llamar initialize() antes de usar el provider
await provider.initialize()
```

## Referencias

- [ISignatureProvider.ts](./ISignatureProvider.ts) - Interfaz común
- [Secp256k1Provider.ts](./Secp256k1Provider.ts) - Provider secp256k1
- [Secp256r1Provider.ts](./Secp256r1Provider.ts) - Provider secp256r1
- [SignatureProviderFactory.ts](./SignatureProviderFactory.ts) - Factory
