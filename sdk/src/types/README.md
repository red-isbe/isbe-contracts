# Types Module

Type definitions and interfaces for the SDK.

## NetworkType

```typescript
type NetworkType = 'dev' | 'production' | 'custom';
```

Network types supported by the SDK.

## TokenConfiguration

```typescript
interface TokenConfiguration {
  configId: string;           // Configuration ID
  name: string;               // Configuration name
  standard: 'ERC20' | 'ERC721';
  features: string[];         // Features included
  businessLogics: string[];   // Business logic keys
  facetCount: number;         // Number of facets
  description: string;        // Description
  requiredRoles: string[];    // Required roles
}
```

## DeploymentResult

```typescript
interface DeploymentResult {
  success: boolean;
  tokenAddress?: string;
  configId?: string;
  txHash?: string;
  error?: string;
}
```

Result from token deployment.

## ERC20TokenParams

```typescript
interface ERC20TokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply?: bigint;
  cap?: bigint;
}
```

Parameters for ERC20 token creation.

## ERC721TokenParams

```typescript
interface ERC721TokenParams {
  name: string;
  symbol: string;
  baseURI?: string;
}
```

Parameters for ERC721 token creation.
```

## Archivos

### networks.ts

**Propósito:** Definir tipos y configuraciones de red.

**Contenido:**

#### `NetworkType`
```typescript
type NetworkType = 'dev' | 'main';
```
Tipo literal para las redes soportadas:
- `'dev'` - Red de desarrollo local (Besu en localhost:8545)
- `'main'` - Red principal (futura mainnet de ISBE)

#### `NetworkConfig`
```typescript
interface NetworkConfig {
  name: string;                    // Nombre descriptivo
  rpcUrl: string;                  // URL del RPC endpoint
  chainId: number;                 // Chain ID de la red
  factoryDiamondAddress: string;   // Dirección del Factory Diamond
  blockExplorer?: string;          // URL del explorador de bloques (opcional)
}
```
Configuración completa de una red.

#### `NETWORKS`
```typescript
const NETWORKS: Record<NetworkType, NetworkConfig>
```
Objeto con las configuraciones de ambas redes:

**Dev Network:**
- RPC: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Factory: `0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de`

**Main Network (placeholder):**
- RPC: `https://rpc.isbe.network`
- Chain ID: `9999`
- Factory: TBD

**Uso:**
```typescript
import { NetworkType, NETWORKS } from './types';

const devConfig = NETWORKS.dev;
console.log(devConfig.rpcUrl); // http://127.0.0.1:8545
```

---

### configuration.ts

**Propósito:** Definir tipos relacionados con configuraciones de tokens y roles.

**Contenido:**

#### `TokenStandard`
```typescript
type TokenStandard = 'ERC20' | 'ERC721' | 'ERC1155';
```
Standards de tokens soportados.

#### `TokenConfiguration`
```typescript
interface TokenConfiguration {
  configId: string;          // bytes32 ID único de configuración
  name: string;              // Nombre descriptivo
  standard: TokenStandard;   // Standard del token
  businessLogics: string[];  // Facetas incluidas
  features: string[];        // Lista de características
  description: string;       // Descripción completa
}
```
Representa una configuración de token completa con sus facetas asociadas.

**Ejemplo:**
```typescript
{
  configId: '0x...2a20',
  name: 'ERC20 Mintable with Cap',
  standard: 'ERC20',
  businessLogics: ['ERC20Facet', 'ERC20CappedFacet', 'ERC20MintableFacet'],
  features: ['Minting', 'Supply cap', 'Role-based access'],
  description: 'ERC20 token with minting capability and maximum supply cap'
}
```

#### `ROLES`
```typescript
const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000...0000',
  PAUSER_ROLE: '0x65d7...862a',
  MINTER_ROLE: '0xd8e8...cace',
  BURNER_ROLE: '0x9667...b7c8',
  GOVERNANCE_ROLE: '0x7184...ceb1',
  UPGRADER_ROLE: '0x189a...d2e3',
  CONTROLLER_ROLE: '0x7b76...3357',
} as const;
```
Constantes de roles extraídas de `contracts/constants/roles.sol`.

**IMPORTANTE:** Estos hashes son los valores correctos que deben usarse para asignar roles durante el despliegue. Usar valores incorrectos causará errores `AccountHasNoRole`.

#### `RoleType`
```typescript
type RoleType = keyof typeof ROLES;
```
Tipo para las claves de roles: `'DEFAULT_ADMIN_ROLE' | 'MINTER_ROLE' | ...`

#### `RoleAssignment`
```typescript
interface RoleAssignment {
  role: string;    // Hash del rol (bytes32)
  account: string; // Dirección de la cuenta
}
```
Representa una asignación de rol a una cuenta durante el despliegue.

**Uso:**
```typescript
import { ROLES, RoleAssignment } from './types';

const roles: RoleAssignment[] = [
  { role: ROLES.DEFAULT_ADMIN_ROLE, account: adminAddress },
  { role: ROLES.MINTER_ROLE, account: minterAddress },
];
```

---

### index.ts

**Propósito:** Punto de exportación central de todos los tipos.

**Contenido:**
```typescript
export * from './networks';
export * from './configuration';
```

Re-exporta todos los tipos de los módulos `networks` y `configuration` para facilitar las importaciones.

**Uso:**
```typescript
// En lugar de:
import { NetworkType } from './types/networks';
import { ROLES } from './types/configuration';

// Puedes hacer:
import { NetworkType, ROLES } from './types';
```

---

## Importancia de los tipos

1. **Type Safety:** TypeScript valida los tipos en tiempo de compilación
2. **IntelliSense:** Autocompletado en el IDE
3. **Documentación:** Los tipos sirven como documentación inline
4. **Refactoring:** Cambios seguros en toda la codebase
5. **Validación:** Previene errores comunes (direcciones malformadas, roles incorrectos)

## Uso común

```typescript
import { 
  NetworkType, 
  NETWORKS, 
  TokenConfiguration, 
  ROLES, 
  RoleAssignment 
} from './types';

// Seleccionar red
const network: NetworkType = 'dev';
const config = NETWORKS[network];

// Crear roles
const roles: RoleAssignment[] = [
  { role: ROLES.MINTER_ROLE, account: '0x...' }
];

// Trabajar con configuraciones
const tokenConfig: TokenConfiguration = {
  configId: '0x...0020',
  name: 'My Token',
  standard: 'ERC20',
  businessLogics: ['ERC20Facet'],
  features: ['transfers'],
  description: 'Simple ERC20'
};
```
