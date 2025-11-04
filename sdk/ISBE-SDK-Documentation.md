# 📘 ISBE SDK - Documentación Completa

## 📋 Tabla de Contenidos

1. [Resumen del Despliegue de Contratos ISBE](#1-resumen-del-despliegue-de-contratos-isbe)
2. [Arquitectura del Sistema Diamond](#2-arquitectura-del-sistema-diamond)
3. [Diseño de la Librería ISBE SDK](#3-diseño-de-la-librería-isbe-sdk)
4. [API y Casos de Uso](#4-api-y-casos-de-uso)
5. [Roadmap de Implementación](#5-roadmap-de-implementación)

---

## 1. Resumen del Despliegue de Contratos ISBE

### 🎯 Objetivo del Despliegue

Preparar la red blockchain con la infraestructura necesaria para que usuarios puedan crear tokens ERC20/ERC721 personalizados mediante una aplicación no-code.

### 📦 Componentes a Desplegar

El sistema ISBE se despliega en **3 fases secuenciales**:

```
FASE 1: Governance (Factory Diamond)
   ↓
FASE 2: Business Logics (Facets reutilizables)
   ↓
FASE 3: Configurations (Recetas de combinaciones)
```

---

### **FASE 1: Governance Layer (Factory Diamond)** 🏛️

El Factory Diamond es el contrato principal que gobierna todo el ecosistema.

```bash
# Comando de despliegue
npx hardhat deployAllClean --network dev

# Resultado esperado:
# ✅ Factory Diamond desplegado en: 0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de
```

**¿Qué incluye el Factory?**

El Factory es un Diamond Pattern (EIP-2535) que contiene **17 facets de gobernanza**:

| Facet | Propósito |
|-------|-----------|
| `IsbeCutFacet` | Gestión de upgrades del diamond |
| `IsbeLoupeFacet` | Introspección del diamond (ver facets instalados) |
| `DiamondCutAccessControlFacet` | Control de acceso para upgrades |
| `AccessControlFacet` | Sistema RBAC (roles) |
| `AccessControlGovernanceFacet` | Roles de gobernanza |
| `BusinessLogicFactoryFacet` | Registro de business logics |
| `ConfigurationManagementFacet` | Registro de configuraciones |
| `ProxyFactoryFacet` | Despliegue de proxies (tokens de usuarios) |
| `GlobalIsbePauseFacet` | Pausa global del sistema |
| `ISBEPauseFacet` | Control de pausa individual |
| + 7 facets más de utilidad | ... |

**Roles críticos del Factory:**
- `DEFAULT_ADMIN_ROLE` (0x000...000): Admin principal
- `BUSINESS_LOGIC_DEPLOYER_ROLE`: Puede registrar business logics
- `CONFIGURATION_MANAGER_ROLE`: Puede crear configuraciones
- `PROXY_DEPLOYER_ROLE`: Puede desplegar tokens para usuarios
- `GOVERNANCE_MANAGER_ROLE`: Puede actualizar gobernanza

---

### **FASE 2: Business Logic Layer (Facets)** 🧩

Los Business Logics son implementaciones reutilizables de funcionalidad (facets) que se combinan para crear tokens.

```bash
# Desplegar todos los business logics
npx hardhat run fernando/deploy-business-logics.ts --network dev

# Resultado esperado:
# ✅ 24 business logics desplegados
```

**Lista completa de Business Logics:**

#### **Base/Obligatorios (4)**
| Business Logic | Resolver Key | Propósito |
|---------------|--------------|-----------|
| `IsbeCutFacet` | `0x3e325d...` | Gestión de upgrades |
| `IsbeLoupeFacet` | `0x360faa...` | Introspección |
| `AccessControlFacet` | `0xa4de16...` | Sistema de roles |
| `ISBEPauseFacet` | `0x7fabf0...` | Pausa de emergencia |

#### **ERC20 (6)**
| Business Logic | Resolver Key | Propósito |
|---------------|--------------|-----------|
| `ERC20Facet` | `0x2428f2...` | ERC20 básico (transfer, approve, etc.) |
| `ERC20SnapshotFacet` | `0xc4968f...` | Snapshots de balances |
| `ERC20BurnableFacet` | `0x81c694...` | Quemar tokens |
| `ERC20CappedFacet` | `0x94ece6...` | Límite de supply + mint |
| `ERC20ControllerFacet` | `0xed76d4...` | Control administrativo (force transfer) |

#### **ERC721 (8)**
| Business Logic | Resolver Key | Propósito |
|---------------|--------------|-----------|
| `ERC721Facet` | `0x90e014...` | ERC721 básico |
| `ERC721BurnableFacet` | `0x206b0e...` | Quemar NFTs |
| `ERC721EnumerableFacet` | `0xedb7f9...` | Enumerar NFTs |
| `ERC721CappedFacet` | `0x562609...` | Límite de supply |
| `ERC721ControllerFacet` | `0x3151ba...` | Control admin |
| `ERC721SnapshotFacet` | `0xf1a2b0...` | Snapshots |
| `ERC721RoyaltyFacet` | `0x93a54f...` | Regalías (EIP-2981) |
| `ERC721ConsecutiveFacet` | `0xcf4be1...` | Mint consecutivo |

**¿Qué hace el script `deploy-business-logics.ts`?**

1. Conecta con el Factory
2. Para cada business logic:
   - Verifica si ya existe (reutiliza si es posible)
   - Si no existe, lo despliega
   - Lo registra en el Factory con su `resolverKey`
3. Resultado: 24 implementaciones listas para usar

---

### **FASE 3: Configuration Management (Recetas)** 📋

Las Configuraciones son "recetas" que definen qué business logics se combinan para crear un tipo específico de token.

```bash
# Crear las configuraciones básicas
npx hardhat run fernando/setup-configurations.ts --network dev

# Resultado esperado:
# ✅ 3 configuraciones creadas inicialmente
```

**Configuraciones Iniciales Creadas:**

| Config ID | Nombre | Business Logics Incluidos | Uso |
|-----------|--------|---------------------------|-----|
| `0x...0020` | ERC20 Básico | 6 facets (ERC20 + base) | Token simple sin extras |
| `0x...2a20` | ERC20 + Capped | 7 facets (ERC20 + Capped + base) | Token con límite y minteo |
| `0x...006a` | ERC20 + Controller | 7 facets (ERC20 + Controller + base) | Token con control admin |

**Anatomía de una Configuración:**

```typescript
interface Configuration {
  configurationId: bytes32;  // ID único (ej: 0x...2a20)
  version: uint256;          // Versión de la config (normalmente 1)
  businessIds: bytes32[];    // Array de resolver keys de los facets
}
```

**¿Cómo se determina el Config ID?**

El Config ID es un hash que representa la combinación de facets:

```solidity
// Ejemplo para ERC20 + Capped
businessIds = [
  ERC20_RESOLVER_KEY,           // 0x2428f2...
  ERC20_CAPPED_RESOLVER_KEY,    // 0x94ece6...
  ISBE_CUT_RESOLVER_KEY,        // 0x3e325d...
  ISBE_LOUPE_RESOLVER_KEY,      // 0x360faa...
  ACCESS_CONTROL_RESOLVER_KEY,  // 0xa4de16...
  PAUSE_RESOLVER_KEY            // 0x7fabf0...
];

configId = keccak256(abi.encode(businessIds, version));
// Resultado: 0x0000000000000000000000000000000000000000000000000000000000002a20
```

---

### **Resumen del Estado Final de la Red**

Después de las 3 fases, la red queda con:

```
Factory Diamond (0xeF7F...0de)
├── 17 Governance Facets instalados
├── Registro de 24 Business Logics
│   ├── IsbeCutFacet → 0xE869...C430
│   ├── ERC20Facet → 0xe10d...cC48
│   ├── ERC20CappedFacet → 0x6410...a5E
│   └── ... (21 más)
├── Registro de 3+ Configuraciones
│   ├── 0x...0020 → ERC20 Básico
│   ├── 0x...2a20 → ERC20 + Capped
│   └── 0x...006a → ERC20 + Controller
└── [Ready para desplegar tokens de usuarios]
```

**La red está LISTA para:**
- ✅ Desplegar tokens ERC20 personalizados
- ✅ Desplegar tokens ERC721 personalizados
- ✅ Combinar múltiples facets según necesidades del usuario
- ✅ Gestionar roles y permisos
- ✅ Pausar tokens en caso de emergencia

---

## 2. Arquitectura del Sistema Diamond

### 🏛️ ¿Qué es el Diamond Pattern (EIP-2535)?

El Diamond Pattern es un estándar de Ethereum que permite crear contratos **modulares y upgradeables** sin límite de tamaño.

**Problema que resuelve:**
- ❌ Contratos de Solidity tienen límite de 24KB
- ❌ Upgrades complejos con proxies tradicionales
- ❌ Código duplicado entre contratos similares

**Solución del Diamond:**
- ✅ Un contrato "diamond" que delega a múltiples "facets"
- ✅ Cada facet es un contrato separado (sin límite de tamaño total)
- ✅ Los facets son reutilizables entre diferentes diamonds
- ✅ Upgrades granulares (cambiar solo un facet)

---

### 🔷 Arquitectura ISBE en 3 Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 1: GOVERNANCE                        │
│  Factory Diamond (único, desplegado por admin)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Facet: ProxyFactoryFacet                            │   │
│  │ Función: deployUseCase()                            │   │
│  │ - Crea nuevos proxies (tokens de usuarios)         │   │
│  │ - Asigna facets según configuración                │   │
│  │ - Inicializa roles                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Facet: ConfigurationManagementFacet                 │   │
│  │ Función: setConfiguration()                         │   │
│  │ - Registra combinaciones de facets                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Facet: BusinessLogicFactoryFacet                    │   │
│  │ Función: setBusinessLogic()                         │   │
│  │ - Registra facets reutilizables                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ registerBusinessLogic()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAPA 2: BUSINESS LOGIC                       │
│  Implementaciones reutilizables (desplegadas una vez)       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ERC20Facet   │  │ ERC20Capped  │  │ ERC721Facet  │     │
│  │ 0xe10d...    │  │ 0x6410...    │  │ 0x8436...    │     │
│  │              │  │              │  │              │     │
│  │ transfer()   │  │ mint()       │  │ ownerOf()    │     │
│  │ approve()    │  │ cap()        │  │ transferFrom│     │
│  │ balanceOf()  │  │ setCap()     │  │ ...          │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  + 21 facets más...                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ delegatecall
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CAPA 3: USE CASES                           │
│  Proxies individuales (tokens de usuarios)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Token Usuario #1: 0xfD7d...1d76                     │   │
│  │ (ERC20 Mintable + Capped)                           │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────┐               │   │
│  │ │ IsbeProxy (delegator)            │               │   │
│  │ │ - Almacena state (balances, etc)│               │   │
│  │ │ - Delega calls a facets          │               │   │
│  │ └──────────────────────────────────┘               │   │
│  │         │                                            │   │
│  │         ├─→ mint() → ERC20CappedFacet (0x6410...)  │   │
│  │         ├─→ transfer() → ERC20Facet (0xe10d...)    │   │
│  │         └─→ hasRole() → AccessControlFacet         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Token Usuario #2: 0x1234...5678                     │   │
│  │ (ERC721 + Royalty)                                  │   │
│  │ [Misma estructura, diferentes facets]               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 🔄 Flujo de Ejecución de una Llamada

**Ejemplo: Usuario llama `token.mint(address, amount)`**

```
1. Usuario → Token Proxy (0xfD7d...1d76)
   |
   | Proxy recibe: mint(0xABC..., 1000)
   |
2. Proxy consulta su mapping de selectores
   |
   | selector = bytes4(keccak256("mint(address,uint256)"))
   | selector = 0x40c10f19
   |
3. Proxy busca: ¿qué facet implementa 0x40c10f19?
   |
   | mapping[0x40c10f19] = 0x64103c6EcfE678CD5D57dA49cb0b168737546a5E
   | (dirección de ERC20CappedFacet)
   |
4. Proxy hace delegatecall a ERC20CappedFacet
   |
   | delegatecall(ERC20CappedFacet, mint(0xABC..., 1000))
   |
5. ERC20CappedFacet ejecuta la lógica
   |
   | function mint() {
   |   require(hasRole(MINTER_ROLE, msg.sender));  ← delegatecall a AccessControlFacet
   |   require(totalSupply + amount <= cap);
   |   _mint(account, amount);  ← delegatecall a ERC20Facet
   | }
   |
6. Storage del Proxy se actualiza
   |
   | balances[0xABC...] += 1000
   | totalSupply += 1000
   |
7. Retorna success al usuario
```

**Ventajas de este flujo:**
- ✅ Toda la lógica está en facets reutilizables
- ✅ El storage está en el proxy (aislado por usuario)
- ✅ Los facets no tienen state, son stateless
- ✅ Un facet puede llamar a otro facet (ej: mint llama a _mint)

---

### 🎯 Conceptos Clave del Diamond Pattern ISBE

#### **1. Facets = Piezas de LEGO**

Cada facet es una implementación independiente:

```solidity
// ERC20Facet.sol
contract ERC20Facet {
  function transfer(address to, uint256 amount) external {
    // Implementación...
  }
  
  function balanceOf(address account) external view returns (uint256) {
    // Implementación...
  }
}

// ERC20CappedFacet.sol
contract ERC20CappedFacet {
  function mint(address to, uint256 amount) external {
    // Implementación...
  }
  
  function cap() external view returns (uint256) {
    // Implementación...
  }
}
```

#### **2. Configuraciones = Recetas de LEGO**

Una configuración define qué piezas (facets) usar:

```typescript
// Configuración: ERC20 Mintable + Capped
const config = {
  businessIds: [
    ERC20_RESOLVER_KEY,        // Pieza 1: transfer, approve, balanceOf
    ERC20_CAPPED_RESOLVER_KEY, // Pieza 2: mint, cap
    ACCESS_CONTROL_KEY,        // Pieza 3: hasRole, grantRole
    PAUSE_KEY                  // Pieza 4: pause, unpause
  ]
};
```

#### **3. Use Case Proxy = LEGO Armado**

El proxy final es el resultado de armar las piezas:

```
Token Usuario (Proxy)
├── Tiene: ERC20Facet
│   ├── transfer()
│   ├── approve()
│   └── balanceOf()
├── Tiene: ERC20CappedFacet
│   ├── mint()
│   └── cap()
├── Tiene: AccessControlFacet
│   ├── hasRole()
│   └── grantRole()
└── Tiene: ISBEPauseFacet
    ├── pause()
    └── paused()
```

---

### 🔐 Sistema de Storage

**Problema:** ¿Cómo evitar colisiones de storage entre facets?

**Solución ISBE:** Diamond Storage Pattern

```solidity
// Cada facet tiene su propio "slot" de storage único
bytes32 constant ERC20_STORAGE_POSITION = keccak256("isbe.storage.erc20");
bytes32 constant CAPPED_STORAGE_POSITION = keccak256("isbe.storage.capped");

struct ERC20Storage {
  mapping(address => uint256) balances;
  mapping(address => mapping(address => uint256)) allowances;
  uint256 totalSupply;
  string name;
  string symbol;
}

function _erc20Storage() private pure returns (ERC20Storage storage s) {
  bytes32 position = ERC20_STORAGE_POSITION;
  assembly {
    s.slot := position
  }
}
```

**Ventajas:**
- ✅ Cada facet usa su propia "sección" de storage
- ✅ No hay colisiones entre facets
- ✅ Storage predecible y seguro

---

### 🛡️ Sistema de Inicialización

**Problema:** ¿Cómo evitar que un facet se inicialice dos veces?

**Solución ISBE:** Initializable Pattern

```solidity
abstract contract Initializable {
  mapping(bytes32 => bool) private _initialized;
  
  modifier initializer(bytes32 _facetKey) {
    require(!_initialized[_facetKey], "Already initialized");
    _;
    _initialized[_facetKey] = true;
  }
}

// Uso en facets
contract ERC20Facet is Initializable {
  function initializeErc20(
    string memory name,
    string memory symbol,
    uint8 decimals
  ) external initializer(ERC20_RESOLVER_KEY) {
    // Solo se ejecuta una vez
    _erc20Storage().name = name;
    _erc20Storage().symbol = symbol;
    _erc20Storage().decimals = decimals;
  }
}
```

**Durante el deployment de un token:**

```typescript
// Se inicializan todos los facets necesarios
await factory.deployUseCase(
  configId,
  version,
  rbacs,
  false,
  [ERC20_RESOLVER_KEY, CAPPED_RESOLVER_KEY], // Facets a inicializar
  [
    encodeInit("initializeErc20", ["My Token", "MTK", 18]),
    encodeInit("initializeCap", [parseEther("1000000")])
  ]
);
```

---

## 3. Diseño de la Librería ISBE SDK

### 🎯 Objetivos de la Librería

1. **Simplicidad**: Un desarrollador/front debe poder crear un token en 5 líneas
2. **Abstracción**: Ocultar la complejidad del Diamond Pattern
3. **Type-safe**: TypeScript con tipos completos
4. **Modular**: Fácil agregar nuevos facets/configuraciones
5. **Admin-friendly**: Herramientas para administrar la red

---

### 📦 Estructura de Carpetas

```
sdk/
├── src/
│   ├── core/                      # Core de la librería
│   │   ├── ISBEClient.ts          # Cliente principal
│   │   ├── ConfigurationManager.ts # Gestión de configs
│   │   ├── ProxyDeployer.ts       # Deploy de tokens
│   │   └── RoleManager.ts         # Gestión de roles
│   │
│   ├── builders/                  # Builders pattern
│   │   ├── TokenBuilder.ts        # Base abstracta
│   │   ├── ERC20Builder.ts        # Builder de ERC20
│   │   └── ERC721Builder.ts       # Builder de ERC721
│   │
│   ├── admin/                     # Herramientas admin
│   │   ├── BusinessLogicChecker.ts # Verificar business logics
│   │   ├── ErrorDecoder.ts        # Decodificar errores
│   │   ├── ProxyInspector.ts      # Inspeccionar tokens
│   │   └── ConfigurationExplorer.ts # Ver configs disponibles
│   │
│   ├── constants/                 # Constantes del sistema
│   │   ├── roles.ts               # MINTER_ROLE, etc.
│   │   ├── resolverKeys.ts        # ERC20_RESOLVER_KEY, etc.
│   │   ├── configIds.ts           # Config IDs conocidos
│   │   └── addresses.ts           # Factory address por red
│   │
│   ├── types/                     # TypeScript types
│   │   ├── TokenConfig.ts         # Config de token
│   │   ├── DeploymentResult.ts    # Resultado del deploy
│   │   ├── FacetInfo.ts           # Info de facets
│   │   └── NetworkConfig.ts       # Config de red
│   │
│   ├── utils/                     # Utilidades
│   │   ├── encoding.ts            # Encode de init data
│   │   ├── hashing.ts             # Cálculo de config IDs
│   │   └── validation.ts          # Validaciones
│   │
│   └── index.ts                   # Export principal
│
├── examples/                      # Ejemplos de uso
│   ├── 01-deploy-erc20-basic.ts
│   ├── 02-deploy-erc20-mintable.ts
│   ├── 03-deploy-erc721-royalty.ts
│   ├── 04-grant-roles.ts
│   └── 05-admin-tools.ts
│
├── test/                          # Tests
│   ├── core/
│   ├── builders/
│   └── admin/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

### 🏗️ Componentes Principales

#### **1. ISBEClient - El Cliente Principal**

```typescript
// src/core/ISBEClient.ts

import { ethers } from 'ethers';
import { ConfigurationManager } from './ConfigurationManager';
import { ProxyDeployer } from './ProxyDeployer';
import { RoleManager } from './RoleManager';
import { AdminTools } from '../admin';

export class ISBEClient {
  public config: ConfigurationManager;
  public deployer: ProxyDeployer;
  public roles: RoleManager;
  public admin: AdminTools;
  
  constructor(options: ISBEClientOptions) {
    // Conectar con Factory
    this.factory = new ethers.Contract(
      options.factoryAddress,
      FactoryABI,
      options.signer
    );
    
    // Inicializar componentes
    this.config = new ConfigurationManager(this.factory);
    this.deployer = new ProxyDeployer(this.factory);
    this.roles = new RoleManager(this.factory);
    this.admin = new AdminTools(this.factory);
  }
  
  // Método principal: Desplegar un token
  async deployToken(tokenConfig: TokenConfig): Promise<DeploymentResult> {
    // 1. Validar configuración
    this.validateConfig(tokenConfig);
    
    // 2. Determinar el config ID correcto
    const configId = await this.config.getConfigIdForFacets(
      tokenConfig.facets
    );
    
    // 3. Preparar init data
    const initData = this.prepareInitData(tokenConfig);
    
    // 4. Preparar roles
    const rbacs = this.roles.prepareRBACs(tokenConfig);
    
    // 5. Desplegar
    const tx = await this.deployer.deploy({
      configId,
      initData,
      rbacs,
      pause: false
    });
    
    // 6. Esperar confirmación
    const receipt = await tx.wait();
    
    // 7. Obtener dirección del token
    const tokenAddress = this.deployer.getTokenAddressFromReceipt(receipt);
    
    // 8. Retornar resultado
    return {
      address: tokenAddress,
      transactionHash: tx.hash,
      facets: tokenConfig.facets,
      roles: rbacs,
      config: tokenConfig
    };
  }
}
```

**Uso:**

```typescript
const isbe = new ISBEClient({
  network: 'dev',
  factoryAddress: '0xeF7FCccE...',
  signer: wallet
});

const result = await isbe.deployToken(myTokenConfig);
console.log('Token desplegado:', result.address);
```

---

#### **2. ERC20Builder - Constructor de ERC20**

```typescript
// src/builders/ERC20Builder.ts

export class ERC20Builder {
  private config: Partial<ERC20Config> = {};
  private facets: string[] = ['ERC20']; // Siempre incluye base
  private roles: Role[] = [];
  
  // Configuración básica
  setName(name: string): this {
    this.config.name = name;
    return this;
  }
  
  setSymbol(symbol: string): this {
    this.config.symbol = symbol;
    return this;
  }
  
  setDecimals(decimals: number): this {
    this.config.decimals = decimals;
    return this;
  }
  
  // Agregar funcionalidades (facets)
  addMintable(initialSupply?: BigNumber): this {
    this.facets.push('ERC20Capped');
    this.roles.push({ role: 'MINTER_ROLE', account: 'owner' });
    this.config.initialSupply = initialSupply;
    return this;
  }
  
  addBurnable(): this {
    this.facets.push('ERC20Burnable');
    this.roles.push({ role: 'BURNER_ROLE', account: 'owner' });
    return this;
  }
  
  addCapped(cap: BigNumber): this {
    if (!this.facets.includes('ERC20Capped')) {
      this.facets.push('ERC20Capped');
    }
    this.config.cap = cap;
    return this;
  }
  
  addSnapshot(): this {
    this.facets.push('ERC20Snapshot');
    this.roles.push({ role: 'SNAPSHOT_ROLE', account: 'owner' });
    return this;
  }
  
  addController(): this {
    this.facets.push('ERC20Controller');
    this.roles.push({ role: 'CONTROLLER_ROLE', account: 'owner' });
    return this;
  }
  
  // Configuración de owner
  setOwner(owner: string): this {
    this.config.owner = owner;
    return this;
  }
  
  // Build final
  build(): TokenConfig {
    // Validar que tiene todo lo necesario
    if (!this.config.name) throw new Error('Name is required');
    if (!this.config.symbol) throw new Error('Symbol is required');
    if (!this.config.owner) throw new Error('Owner is required');
    
    // Agregar facets base obligatorios
    const allFacets = [
      ...this.facets,
      'IsbeCut',
      'IsbeLou',
      'AccessControl',
      'ISBEPause'
    ];
    
    return {
      type: 'ERC20',
      facets: [...new Set(allFacets)], // Eliminar duplicados
      roles: this.roles,
      initData: this.config,
      owner: this.config.owner
    };
  }
}
```

**Uso:**

```typescript
const tokenConfig = new ERC20Builder()
  .setName('My Token')
  .setSymbol('MTK')
  .setDecimals(18)
  .setCap(ethers.parseEther('1000000'))
  .addMintable()
  .addBurnable()
  .setOwner(userAddress)
  .build();

const result = await isbe.deployToken(tokenConfig);
```

---

#### **3. ConfigurationManager - Gestión de Configuraciones**

```typescript
// src/core/ConfigurationManager.ts

export class ConfigurationManager {
  // Mapa de configuraciones conocidas
  private static KNOWN_CONFIGS: Map<string, ConfigInfo> = new Map([
    // ERC20 Básico
    ['ERC20_BASIC', {
      configId: '0x0000000000000000000000000000000000000000000000000000000000000020',
      facets: ['ERC20', 'IsbeCut', 'IsbeLoupeFacet', 'AccessControl', 'ISBEPause'],
      version: 1
    }],
    
    // ERC20 Mintable + Capped
    ['ERC20_MINTABLE_CAPPED', {
      configId: '0x0000000000000000000000000000000000000000000000000000000000002a20',
      facets: ['ERC20', 'ERC20Capped', 'IsbeCut', 'IsbeLoupeFacet', 'AccessControl', 'ISBEPause'],
      version: 1
    }],
    
    // ERC20 Full (Mintable + Burnable + Snapshot + Capped)
    ['ERC20_FULL', {
      configId: '0x0000000000000000000000000000000000000000000000000000000000ff20aa',
      facets: ['ERC20', 'ERC20Capped', 'ERC20Burnable', 'ERC20Snapshot', 'IsbeCut', 'IsbeLoupeFacet', 'AccessControl', 'ISBEPause'],
      version: 1
    }],
    
    // ... más configuraciones
  ]);
  
  // Dado un array de facets, encontrar el config ID correcto
  async getConfigIdForFacets(facets: string[]): Promise<string> {
    // Normalizar (agregar facets base si no están)
    const normalizedFacets = this.normalizeFacets(facets);
    
    // Buscar en configuraciones conocidas
    for (const [name, config] of ConfigurationManager.KNOWN_CONFIGS) {
      if (this.facetsMatch(normalizedFacets, config.facets)) {
        return config.configId;
      }
    }
    
    // Si no existe, calcular el config ID
    const resolverKeys = this.facetsToResolverKeys(normalizedFacets);
    const calculatedId = await this.calculateConfigId(resolverKeys);
    
    // Verificar si existe en la red
    const exists = await this.configExistsOnChain(calculatedId);
    
    if (!exists) {
      throw new Error(
        `Configuration not found for facets: ${normalizedFacets.join(', ')}. ` +
        `Please create this configuration first using admin tools.`
      );
    }
    
    return calculatedId;
  }
  
  // Verificar si una configuración existe en el Factory
  async configExistsOnChain(configId: string): Promise<boolean> {
    try {
      const config = await this.factory.getConfiguration(configId, 1);
      return config.businessIds.length > 0;
    } catch {
      return false;
    }
  }
  
  // Obtener info de una configuración
  async getConfigInfo(configId: string): Promise<ConfigurationInfo> {
    const config = await this.factory.getConfiguration(configId, 1);
    
    return {
      configId,
      version: 1,
      businessIds: config.businessIds,
      facetCount: config.businessIds.length,
      facets: await this.resolverKeysToFacetNames(config.businessIds)
    };
  }
  
  // Listar todas las configuraciones disponibles
  async listAllConfigurations(): Promise<ConfigurationInfo[]> {
    // Obtener del Factory todas las configs registradas
    const configs = [];
    
    for (const [name, config] of ConfigurationManager.KNOWN_CONFIGS) {
      const exists = await this.configExistsOnChain(config.configId);
      if (exists) {
        configs.push({
          name,
          ...config
        });
      }
    }
    
    return configs;
  }
}
```

---

#### **4. AdminTools - Herramientas de Administración**

```typescript
// src/admin/index.ts

export class AdminTools {
  public businessLogic: BusinessLogicChecker;
  public errorDecoder: ErrorDecoder;
  public proxyInspector: ProxyInspector;
  public configExplorer: ConfigurationExplorer;
  
  constructor(factory: Contract) {
    this.businessLogic = new BusinessLogicChecker(factory);
    this.errorDecoder = new ErrorDecoder();
    this.proxyInspector = new ProxyInspector(factory);
    this.configExplorer = new ConfigurationExplorer(factory);
  }
  
  // Verificar estado de business logics
  async checkBusinessLogics(): Promise<BusinessLogicStatus> {
    return this.businessLogic.check();
  }
  
  // Decodificar un error
  decodeError(errorData: string): DecodedError {
    return this.errorDecoder.decode(errorData);
  }
  
  // Inspeccionar un proxy/token
  async inspectProxy(address: string): Promise<ProxyInfo> {
    return this.proxyInspector.inspect(address);
  }
  
  // Listar configuraciones disponibles
  async listConfigurations(): Promise<ConfigInfo[]> {
    return this.configExplorer.list();
  }
}
```

**Uso:**

```typescript
// Verificar business logics
const status = await isbe.admin.checkBusinessLogics();
console.log(`Desplegados: ${status.deployed}/24`);

// Decodificar error
const decoded = isbe.admin.decodeError('0xa1180aad...');
console.log(decoded); // "AccountHasNoRole(0x86df..., MINTER_ROLE)"

// Inspeccionar token
const info = await isbe.admin.inspectProxy('0xfD7d...');
console.log('Facets:', info.facets);
console.log('Roles:', info.roles);
```

---

## 4. API y Casos de Uso

### 📝 Casos de Uso Completos

#### **Caso 1: Token ERC20 Básico (Solo Transferencias)**

```typescript
import { ISBEClient, ERC20Builder } from '@isbe/sdk';

// 1. Inicializar
const isbe = new ISBEClient({
  network: 'dev',
  factoryAddress: '0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de',
  signer: userWallet
});

// 2. Construir configuración
const config = new ERC20Builder()
  .setName('Basic Token')
  .setSymbol('BASIC')
  .setDecimals(18)
  .setOwner(userAddress)
  .build();

// 3. Desplegar
const result = await isbe.deployToken(config);

console.log('✅ Token desplegado:', result.address);
console.log('📋 Facets:', result.facets);
// Salida:
// ✅ Token desplegado: 0xABC...123
// 📋 Facets: ['ERC20', 'IsbeCut', 'IsbeLoupeFacet', 'AccessControl', 'ISBEPause']
```

---

#### **Caso 2: Token ERC20 Mintable con Cap**

```typescript
// Usuario en el front selecciona: "Quiero poder mintear tokens con un límite"

const config = new ERC20Builder()
  .setName('Mintable Token')
  .setSymbol('MINT')
  .setDecimals(18)
  .setCap(ethers.parseEther('1000000')) // 1M cap
  .addMintable()
  .setOwner(userAddress)
  .build();

const result = await isbe.deployToken(config);

console.log('✅ Token desplegado:', result.address);
console.log('🎫 Puedes mintear hasta 1,000,000 tokens');

// Ahora el usuario puede mintear
const token = await isbe.getToken(result.address);
await token.mint(userAddress, ethers.parseEther('10000'));
```

---

#### **Caso 3: Token ERC20 Full-Featured**

```typescript
// Usuario avanzado selecciona: Mintable + Burnable + Snapshot + Controller

const config = new ERC20Builder()
  .setName('Full Token')
  .setSymbol('FULL')
  .setDecimals(18)
  .setCap(ethers.parseEther('10000000'))
  .addMintable()
  .addBurnable()
  .addSnapshot()
  .addController()
  .setOwner(userAddress)
  .build();

const result = await isbe.deployToken(config);

// El token tiene todas las funciones:
const token = await isbe.getToken(result.address);

// Mintear
await token.mint(userAddress, ethers.parseEther('1000'));

// Quemar
await token.burn(ethers.parseEther('100'));

// Crear snapshot
await token.snapshot();

// Force transfer (como admin)
await token.forceTransfer(address1, address2, ethers.parseEther('50'));
```

---

#### **Caso 4: Token ERC721 con Royalties**

```typescript
import { ERC721Builder } from '@isbe/sdk';

const config = new ERC721Builder()
  .setName('My NFT Collection')
  .setSymbol('MNFT')
  .setBaseURI('https://api.mynft.com/metadata/')
  .addMintable()
  .addRoyalty({
    receiver: artistAddress,
    feeNumerator: 500 // 5% royalty
  })
  .setCap(10000) // Max 10k NFTs
  .setOwner(userAddress)
  .build();

const result = await isbe.deployToken(config);

// Mintear NFTs
const nft = await isbe.getToken(result.address);
await nft.mint(userAddress, 1); // Token ID 1
await nft.mint(userAddress, 2); // Token ID 2

// Verificar royalty
const royaltyInfo = await nft.royaltyInfo(1, ethers.parseEther('1'));
console.log('Royalty receiver:', royaltyInfo.receiver);
console.log('Royalty amount:', royaltyInfo.royaltyAmount); // 0.05 ETH (5%)
```

---

#### **Caso 5: Admin - Otorgar Roles**

```typescript
// Admin quiere dar permisos a otro usuario

await isbe.roles.grantRole({
  proxy: tokenAddress,
  role: 'MINTER_ROLE',
  account: newMinterAddress
});

console.log('✅ Rol MINTER_ROLE otorgado a', newMinterAddress);

// Verificar
const hasRole = await isbe.roles.hasRole(tokenAddress, 'MINTER_ROLE', newMinterAddress);
console.log('Tiene rol:', hasRole); // true
```

---

#### **Caso 6: Admin - Verificar Estado de la Red**

```typescript
// 1. Verificar business logics
const blStatus = await isbe.admin.checkBusinessLogics();
console.log('Business Logics:');
console.log(`  Desplegados: ${blStatus.deployed}/24`);
console.log(`  Faltantes: ${blStatus.missing.length}`);
if (blStatus.missing.length > 0) {
  console.log(`  Missing: ${blStatus.missing.join(', ')}`);
}

// 2. Ver configuraciones disponibles
const configs = await isbe.admin.listConfigurations();
console.log('\nConfiguraciones disponibles:');
configs.forEach(config => {
  console.log(`  - ${config.name} (${config.facets.length} facets)`);
});

// 3. Ver todos los tokens desplegados
const proxies = await isbe.admin.listProxies();
console.log(`\nProxies desplegados: ${proxies.length}`);
proxies.forEach(proxy => {
  console.log(`  - ${proxy.address} (${proxy.type})`);
});
```

---

#### **Caso 7: Admin - Decodificar Error**

```typescript
// Usuario reporta error al mintear

try {
  await token.mint(address, amount);
} catch (error: any) {
  // Error: 0xa1180aad00000000000000000000000086df4b738d592c31...
  
  const decoded = isbe.admin.decodeError(error.data);
  
  console.log('Error decodificado:');
  console.log(`  Tipo: ${decoded.name}`);
  console.log(`  Parámetros:`, decoded.params);
  console.log(`  Mensaje: ${decoded.message}`);
  
  // Salida:
  // Error decodificado:
  //   Tipo: AccountHasNoRole
  //   Parámetros: {
  //     account: '0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462',
  //     role: '0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace'
  //   }
  //   Mensaje: Account 0x86df... does not have role MINTER_ROLE
  
  // Solución sugerida
  console.log('\n💡 Solución:');
  console.log(decoded.suggestion);
  // Otorga el rol MINTER_ROLE a la cuenta 0x86df... usando grantRole()
}
```

---

### 🎨 Integración con Front-End

#### **Flujo completo desde el UI:**

```typescript
// 1. Usuario selecciona en el UI:
const userSelection = {
  type: 'ERC20',
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18,
  features: ['mintable', 'burnable', 'capped'],
  cap: '1000000'
};

// 2. El front convierte la selección a configuración SDK
const config = new ERC20Builder()
  .setName(userSelection.name)
  .setSymbol(userSelection.symbol)
  .setDecimals(userSelection.decimals);

// Agregar features seleccionadas
if (userSelection.features.includes('mintable')) {
  config.addMintable();
}
if (userSelection.features.includes('burnable')) {
  config.addBurnable();
}
if (userSelection.features.includes('capped')) {
  config.addCapped(ethers.parseEther(userSelection.cap));
}

config.setOwner(userWalletAddress);

// 3. Desplegar
const result = await isbe.deployToken(config.build());

// 4. Mostrar resultado al usuario
alert(`✅ Token creado en: ${result.address}`);

// 5. Guardar en base de datos del front
await saveTokenToDatabase({
  address: result.address,
  owner: userWalletAddress,
  name: userSelection.name,
  symbol: userSelection.symbol,
  features: userSelection.features,
  createdAt: new Date(),
  transactionHash: result.transactionHash
});
```

---

## 5. Roadmap de Implementación

### 🗓️ Fase 1: Core SDK (Semana 1-2)

**Objetivos:**
- ✅ ISBEClient básico funcional
- ✅ ERC20Builder con 3-4 configuraciones
- ✅ ProxyDeployer
- ✅ Soporte para red `dev`

**Entregables:**
1. `ISBEClient.ts`
2. `ERC20Builder.ts`
3. `ConfigurationManager.ts` (con 3 configs iniciales)
4. `ProxyDeployer.ts`
5. 2 ejemplos funcionales

**Criterio de éxito:**
- Poder desplegar ERC20 básico, mintable y mintable+capped

---

### 🗓️ Fase 2: Admin Tools (Semana 3)

**Objetivos:**
- ✅ Herramientas de admin
- ✅ Decodificador de errores
- ✅ Inspector de proxies

**Entregables:**
1. `BusinessLogicChecker.ts`
2. `ErrorDecoder.ts`
3. `ProxyInspector.ts`
4. `ConfigurationExplorer.ts`

**Criterio de éxito:**
- Admin puede diagnosticar problemas en la red
- Decodificador reconoce 20+ tipos de errores

---

### 🗓️ Fase 3: ERC721 Support (Semana 4)

**Objetivos:**
- ✅ ERC721Builder completo
- ✅ Soporte para royalties
- ✅ Soporte para enumerables

**Entregables:**
1. `ERC721Builder.ts`
2. Configuraciones ERC721 (10+)
3. Ejemplos de uso

**Criterio de éxito:**
- Poder desplegar NFTs con royalties

---

### 🗓️ Fase 4: Configuraciones Exhaustivas (Semana 5-6)

**Objetivos:**
- ✅ Mapear TODAS las combinaciones posibles
- ✅ Crear ~150 configuraciones en el Factory
- ✅ Actualizar ConfigurationManager

**Entregables:**
1. Script para generar todas las configs
2. ConfigurationManager con 150+ configs
3. Documentación de cada config

**Criterio de éxito:**
- Cualquier combinación válida de facets tiene su config

---

### 🗓️ Fase 5: Testing & Docs (Semana 7)

**Objetivos:**
- ✅ Tests unitarios (80% coverage)
- ✅ Tests de integración
- ✅ Documentación completa

**Entregables:**
1. Suite de tests completa
2. README detallado
3. Ejemplos comentados
4. API docs (TypeDoc)

**Criterio de éxito:**
- Tests pasan en CI
- Docs generadas automáticamente

---

### 🗓️ Fase 6: Front-End Integration (Semana 8)

**Objetivos:**
- ✅ Integrar SDK con front React
- ✅ UI para seleccionar facets
- ✅ Preview de configuración

**Entregables:**
1. Hook React `useISBE()`
2. Componente `<TokenBuilder />`
3. Demo app funcional

**Criterio de éxito:**
- Usuario no-técnico puede crear token desde UI

---

## 📊 Estimación Total

| Fase | Duración | Esfuerzo | Prioridad |
|------|----------|----------|-----------|
| 1. Core SDK | 2 semanas | Alto | 🔥 Crítica |
| 2. Admin Tools | 1 semana | Medio | 🔥 Crítica |
| 3. ERC721 Support | 1 semana | Medio | Alta |
| 4. Configuraciones | 2 semanas | Alto | Alta |
| 5. Testing & Docs | 1 semana | Medio | Alta |
| 6. Front Integration | 1 semana | Medio | Media |
| **TOTAL** | **8 semanas** | - | - |

---

## 🚀 Próximos Pasos Inmediatos

### Para empezar HOY:

1. **Crear estructura base del SDK:**
   ```bash
   mkdir -p sdk/src/{core,builders,admin,constants,types,utils}
   mkdir -p sdk/examples
   mkdir -p sdk/test
   ```

2. **Implementar ISBEClient básico:**
   - Constructor
   - Conexión con Factory
   - Método `deployToken()` básico

3. **Implementar ERC20Builder:**
   - Métodos básicos (setName, setSymbol, etc.)
   - `.addMintable()`
   - `.addCapped()`
   - `.build()`

4. **Crear primer ejemplo funcional:**
   - `examples/01-deploy-erc20-mintable.ts`
   - Que funcione end-to-end

---

## ✅ Checklist de Inicio

- [ ] Crear carpetas del SDK
- [ ] Instalar dependencias (ethers, typescript, etc.)
- [ ] Configurar `tsconfig.json`
- [ ] Copiar constantes desde el proyecto principal
- [ ] Implementar `ISBEClient` (esqueleto)
- [ ] Implementar `ERC20Builder` (esqueleto)
- [ ] Crear primer ejemplo
- [ ] Probarlo en red dev
- [ ] Iterar hasta que funcione

---

## 🎯 Conclusión

Este SDK permitirá:

1. **A usuarios finales:** Crear tokens personalizados en minutos sin tocar código
2. **A developers:** Integrar fácilmente la creación de tokens en sus apps
3. **A admins:** Diagnosticar y resolver problemas rápidamente
4. **A la plataforma:** Escalar a miles de usuarios creando tokens

**¿Listo para empezar? 🚀**

---

**Documento generado el:** 3 de Noviembre, 2025  
**Versión:** 1.0  
**Autor:** ISBE Team
