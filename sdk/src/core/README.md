# Core Module

Token deployment builders and configuration management.

## ERC20Builder

Fluent API for deploying ERC20 tokens.

```typescript
import { ERC20Builder } from './ERC20Builder';

const builder = new ERC20Builder(provider, signer, factoryAddress);

const result = await builder
  .setToken('My Token', 'MTK', 18)
  .addMintable()
  .addCapped()
  .deploy();
```

### Methods

- `setToken(name, symbol, decimals)` - Configure token parameters
- `addMintable()` - Enable minting
- `addCapped()` - Add supply cap
- `addBurnable()` - Enable burning
- `addPausable()` - Enable pausing
- `addSnapshot()` - Enable snapshots
- `addController()` - Add controller functions
- `deploy()` - Deploy the token
- `getSummary()` - Get configuration summary
- `validate()` - Validate configuration

## ERC721Builder

Fluent API for deploying ERC721 NFT collections.

```typescript
import { ERC721Builder } from './ERC721Builder';

const builder = new ERC721Builder(provider, signer, factoryAddress);

const result = await builder
  .setToken('My NFT', 'MNFT')
  .addCapped()
  .deploy();
```

### Methods

- `setToken(name, symbol)` - Configure NFT parameters
- `setBaseURI(uri)` - Set base URI for metadata
- `addCapped()` - Add supply cap (includes mint)
- `addBurnable()` - Enable burning
- `addEnumerable()` - Enable enumeration
- `addPausable()` - Enable pausing
- `addRoyalty()` - Add ERC2981 royalty
- `addSnapshot()` - Enable snapshots
- `addController()` - Add controller functions
- `addConsecutive()` - Add ERC2309 consecutive
- `deploy()` - Deploy the NFT
- `getSummary()` - Get configuration summary
- `validate()` - Validate configuration

## ConfigurationResolver

Query available token configurations.

```typescript
import { ConfigurationResolver } from './ConfigurationResolver';

const resolver = new ConfigurationResolver();

// Find by features
const config = resolver.findByFeatures('ERC20', ['base', 'mintable']);

// Get all
const all = resolver.getAllConfigurations('ERC20');

// Find by name
const config = resolver.findByName('ERC20', 'ERC20 Mintable');
```

### Methods

- `getAllConfigurations(standard)` - Get all configs for standard
- `findByFeatures(standard, features[])` - Find by feature combination
- `findByName(standard, name)` - Find by configuration name
- `findByConfigId(standard, configId)` - Find by config ID

## ClientConfigurationManager

Manage deployment history for clients.

```typescript
import { ClientConfigurationManager } from './ClientConfigurationManager';

const manager = new ClientConfigurationManager();

// Save deployment
manager.addDeployment(clientAddress, {
  address: tokenAddress,
  type: 'ERC20',
  name: 'My Token',
  timestamp: Date.now()
});

// Get deployments
const deployments = manager.getDeployments(clientAddress);
```

### Methods

- `addDeployment(client, deployment)` - Save new deployment
- `getDeployments(client)` - Get all deployments for client
- `getDeployment(client, address)` - Get specific deployment
- `removeDeployment(client, address)` - Remove deployment
- `clearDeployments(client)` - Clear all for client
```

## Archivos

### ISBEClient.ts

**Propósito:** Cliente principal y punto de entrada del SDK.

**Responsabilidades:**
- Gestionar la conexión a la red (dev/main)
- Inicializar el provider y signer de ethers.js
- Conectar con el Factory Diamond usando la dirección configurada
- Coordinar el ConfigurationManager y ProxyDeployer
- Proporcionar métodos para verificar el estado de la red
- Leer la clave privada desde variables de entorno (`.env`)

**Métodos principales:**
- `constructor(network, signer?)` - Crear cliente con red y signer opcional
- `static fromPrivateKey(privateKey, network)` - Crear desde clave privada
- `static fromMnemonic(mnemonic, network, accountIndex)` - Crear desde mnemonic
- `static readOnly(network)` - Crear cliente solo lectura
- `verifyConnection()` - Verificar que el Factory Diamond es accesible
- `getNetworkStatus()` - Obtener información del estado de la red
- `listConfigurations()` - Listar configuraciones disponibles

**Uso:**
```typescript
import { ISBEClient } from './core/ISBEClient';

// Con private key desde .env
const client = ISBEClient.fromPrivateKey(process.env.PRIVATE_KEY!, 'dev');

// Read-only
const readClient = ISBEClient.readOnly('dev');
```

---

### ConfigurationManager.ts

**Propósito:** Gestionar el registro de configuraciones de tokens disponibles.

**Responsabilidades:**
- Mantener un mapa de configuraciones pre-definidas
- Mapear IDs de configuración a combinaciones de business logics
- Proporcionar búsqueda por ID, nombre, standard o features
- Permitir registrar nuevas configuraciones dinámicamente

**Configuraciones actuales:**
- `0x...0020` - ERC20 Basic (solo ERC20Facet)
- `0x...2a20` - ERC20 Mintable with Cap (ERC20 + Capped + Mintable)
- `0x...006a` - ERC20 with Controller (ERC20 + Controller)

**Métodos principales:**
- `registerConfiguration(config)` - Registrar nueva configuración
- `getConfiguration(configId)` - Obtener por ID
- `getConfigurationByName(name)` - Buscar por nombre
- `listConfigurations()` - Listar todas
- `listConfigurationsByStandard(standard)` - Filtrar por ERC20/ERC721/ERC1155
- `listConfigurationsByFeature(feature)` - Filtrar por característica

**Uso:**
```typescript
const configManager = new ConfigurationManager();

// Buscar configuración
const config = configManager.getConfigurationByName('ERC20 Basic');
console.log(config.configId); // 0x...0020

// Listar todas las ERC20
const erc20s = configManager.listConfigurationsByStandard('ERC20');
```

---

### ProxyDeployer.ts

**Propósito:** Ejecutar el despliegue de proxies de tokens a través del Factory Diamond.

**Responsabilidades:**
- Formatear los parámetros de despliegue (configId, initData, roles)
- Llamar a `deployUseCase()` en el Factory Diamond
- Esperar la confirmación de la transacción
- Extraer la dirección del proxy desde los eventos
- Estimar gas antes del despliegue
- Validar parámetros de entrada

**Métodos principales:**
- `deployProxy(params)` - Desplegar nuevo proxy de token
- `estimateGas(params)` - Estimar gas para el despliegue
- `validateParams(params)` - Validar parámetros antes de desplegar
- `extractProxyAddressFromReceipt(receipt)` - Extraer dirección del evento

**Parámetros de despliegue:**
```typescript
interface DeploymentParams {
  configId: string;        // bytes32 de la configuración
  initializeData: string[]; // Datos de inicialización codificados
  roles: RoleAssignment[];  // [{ role, account }]
  signer: Signer;          // Firmante para la tx
}
```

**Resultado:**
```typescript
interface DeploymentResult {
  proxyAddress: string;     // Dirección del proxy desplegado
  transactionHash: string;  // Hash de la transacción
  blockNumber: number;      // Número de bloque
  gasUsed: bigint;         // Gas consumido
}
```

**Uso:**
```typescript
const deployer = new ProxyDeployer(factoryContract);

const result = await deployer.deployProxy({
  configId: '0x...2a20',
  initializeData: [encodedInitCall],
  roles: [{ role: ROLES.MINTER_ROLE, account: myAddress }],
  signer: wallet,
});

console.log('Token deployed at:', result.proxyAddress);
```

---

## Flujo de trabajo

```
ISBEClient
    ├── Conecta con red (dev/main)
    ├── Inicializa Factory Diamond contract
    ├── Crea ConfigurationManager
    │       └── Carga configuraciones disponibles
    └── Crea ProxyDeployer
            └── Listo para desplegar proxies

Usuario usa ISBEClient para:
1. Consultar configuraciones disponibles
2. Seleccionar una configuración
3. Preparar datos de inicialización
4. Desplegar proxy usando ProxyDeployer
```

## Dependencias

- `ethers` v6 - Interacción con blockchain
- `../types` - Tipos y definiciones del SDK

## Próximos componentes

- **ERC20Builder** - API fluida para construir tokens ERC20
- **ERC721Builder** - API fluida para construir NFTs
- **AdminTools** - Herramientas de administración y diagnóstico
