
Vista General del Flujo - Diagrama ASCII que muestra las 5 fases principales desde infraestructura hasta roles

Fase 1: Governance - Detalle del despliegue de los 20+ core facets, inicialización de la Factory y configuración de Access Control

Fase 2: Business Logics - Cómo se despliegan y registran los contratos de lógica de negocio

Fase 3: Use Cases - Proceso de setConfig + deployUseCase para crear proxies Diamond

Fase 4: Manual Use Cases - Ejemplo detallado con ClientFiltering, mostrando los scripts register.ts y create-proxy.ts

Fase 5: Role Configuration - Proceso de asignación de roles con grant-role-by-param.ts

Resumen de Direcciones - Tabla con todas las direcciones desplegadas en la red dev

Flujo de Comandos - Comandos bash resumidos para cada fase

Diagrama de Dependencias - Cómo los componentes dependen unos de otros

Checklist de Despliegue - Lista de verificación paso a paso


#  ISBE Deployment Phases - Visual Schema

Este documento describe las fases de despliegue desde `deployAllClean` hasta la configuración de roles para use cases específicos.

---

##  Vista General del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 0: INFRAESTRUCTURA                              │
│                     (Red Besu + Nodos + Configuración)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 1: GOVERNANCE                                   │
│                   npx hardhat deployAllClean --network dev                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Deploy Diamond Factory (ISBE Factory)                              │  │
│  │  • Deploy Core Facets (20+ facets)                                    │  │
│  │  • Initialize Access Control                                          │  │
│  │  • Grant Initial Roles                                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Output: Factory Address = 0x90186F9907Cbe3150bf8203Bb1e97473284b0254       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FASE 2: BUSINESS LOGICS                                  │
│              (Automático durante deployAllClean)                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Deploy Business Logic Contracts                                    │  │
│  │  • Register in BusinessLogicFactoryFacet                              │  │
│  │  • Assign businessId + version to each logic                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FASE 3: USE CASES                                      │
│              (Automático durante deployAllClean)                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • setConfig: Register Use Case Configuration                         │  │
│  │  • deployUseCase: Create Diamond Proxy                                │  │
│  │  • Attach Business Logics to Proxy                                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Proxies Desplegados Automáticamente:                                       │
│  • HashTimestamp, Identity, Tokens, etc.                                    │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                      FIN DE deployAllClean
═══════════════════════════════════════════════════════════════════════════════

                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                FASE 4: USE CASES ADICIONALES (Manual)                        │
│           (Para Business Logics no incluidos en deployAllClean)              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  4A. Deploy Business Logic (si no existe)                             │  │
│  │      → BusinessLogicFactoryFacet.deploy(facet, businessId)           │  │
│  │                                                                       │  │
│  │  4B. Register Configuration (setConfig)                               │  │
│  │      → ConfigurationManagementFacet.setConfiguration(...)            │  │
│  │                                                                       │  │
│  │  4C. Deploy Use Case Proxy (deployUseCase)                           │  │
│  │      → ProxyFactoryFacet.deployUseCase(configId, salt, admin)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Scripts: fernando/filtering/register.ts + create-proxy.ts                  │
│  Example: ClientFiltering Proxy = 0x9741FC1da9b6a2EEEf88783b79184cEc355D5b5D │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FASE 5: ROLE CONFIGURATION                               │
│               (Asignar roles a cuentas en cada Proxy)                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Connect to specific Proxy contract                                 │  │
│  │  • Call AccessControl.grantRole(ROLE_HASH, targetAddress)            │  │
│  │  • Verify with hasRole()                                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Script: fernando/grant-role-by-param.ts                                    │
│  Roles: HASH_TIMESTAMP_ROLE, CLIENT_FILTERING_ROLE, etc.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

##  FASE 1: Governance Deployment (Detalle)

```
                    deployAllClean --network dev
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │      CleanDeploymentOrchestrator       │
         └────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │ Governance  │    │  Business   │    │  Use Case   │
    │  Deployer   │    │   Logic     │    │  Deployer   │
    │             │    │  Deployer   │    │             │
    └─────────────┘    └─────────────┘    └─────────────┘

                    STEP 1: GOVERNANCE
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │            Deploy 20+ Core Facets               │
    ├─────────────────────────────────────────────────┤
    │  BusinessLogicFactoryFacet                      │
    │  ProxyFactoryFacet                              │
    │  ConfigurationManagementFacet                   │
    │  AccessControlGovernanceFacet                   │
    │  AccessControlDidGovernanceFacet                │
    │  DiamondCutAccessControlFacet                   │
    │  DiamondLoupeFacet                              │
    │  GlobalIsbePauseFacet                           │
    │  ISBEPauseFacet                                 │
    │  DidDocumentDetailedFacet                       │
    │  DidControllerFacet                             │
    │  DidVerificationMethodFacet                     │
    │  DidVerificationRelationshipFacet               │
    │  DidRegistryQueryFacet                          │
    │  EnsRegistryFacet                               │
    │  TimeStampingRegistryFacet                      │
    │  ClientFilteringFacet                           │
    │  NetworkDirectoryFacet                          │
    │  BesuNodeManagerFacet                           │
    │  AnchoringCoreFacet                             │
    └─────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │      Create Diamond (ISBE Factory)              │
    │  • Initialize with DiamondCut                   │
    │  • Add all facets to diamond                    │
    │  • Set up diamond storage                       │
    └─────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │      Initialize Access Control Roles            │
    ├─────────────────────────────────────────────────┤
    │  DEFAULT_ADMIN_ROLE          (Admin Principal)  │
    │  ISBE_ROLE                   (Sistema ISBE)     │
    │  GOVERNANCE_MANAGER_ROLE     (Gestión Gob.)     │
    │  BUSINESS_LOGIC_DEPLOYER_ROLE (Despliegue BL)   │
    │  PROXY_DEPLOYER_ROLE         (Despliegue Proxy) │
    │  DID_REGISTRY_ROLE           (Registro DID)     │
    │  ENS_MANAGER_ROLE            (Gestión ENS)      │
    │  ISBE_PAUSER_ROLE            (Pausar Sistema)   │
    │  BESU_NODE_MANAGER_ROLE      (Gestión Nodos)    │
    │  NETWORK_DIRECTORY_ROLE      (Directorio Red)   │
    │  ANCHORER_ROLE               (Anclaje)          │
    │  TIMESTAMPING_REGISTRY_ROLE  (Sellado Tiempo)   │
    │  CLIENT_FILTERING_ROLE       (Filtrado)         │
    │  METADATA_MANAGER_ROLE       (Metadatos)        │
    └─────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  ✅ Factory: 0x90186F...84b0254        │
         │  ✅ Admin:   0x8792c7B...2ab5cd        │
         └────────────────────────────────────────┘
```

---

##  FASE 2: Business Logic Deployment (Detalle)

```
                    STEP 2: BUSINESS LOGICS
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │   CleanBusinessLogicDeployer.deployAll()        │
    │                                                 │
    │   Para cada Business Logic en config:           │
    └─────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  1. Deploy Contract (Facet bytecode)   │
         │     → Returns: facetAddress            │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  2. Register in Factory                │
         │     BusinessLogicFactoryFacet.deploy(  │
         │       facetAddress,                    │
         │       businessId,                      │
         │       version                          │
         │     )                                  │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  3. Store in Registry                  │
         │     mapping(businessId => versions[])  │
         │     mapping(version => facetAddress)   │
         └────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────┐
    │       Business Logic Registry Example           │
    ├─────────────────────────────────────────────────┤
    │  businessId: "HashTimestampFacet"               │
    │  versions: [1, 2, 3...]                         │
    │  addresses: {                                   │
    │    1 => 0xABC...,                              │
    │    2 => 0xDEF...,                              │
    │  }                                              │
    └─────────────────────────────────────────────────┘
```

---

## FASE 3: Use Case Deployment (Detalle)

```
                    STEP 3: USE CASES
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │   CleanUseCaseDeployer.deployAll()              │
    │                                                 │
    │   Para cada Use Case en config:                 │
    └─────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                     ▼
    ┌─────────────────┐                ┌─────────────────┐
    │   3A. setConfig │                │ 3B. deployProxy │
    │   (Registrar    │                │ (Crear Diamond  │
    │    Configuración)│               │    Proxy)       │
    └─────────────────┘                └─────────────────┘

              STEP 3A: setConfig
                    │
                    ▼
    ┌─────────────────────────────────────────────────┐
    │  ConfigurationManagementFacet.setConfiguration( │
    │    configId,           // bytes32 único         │
    │    businessLogics[],   // Array de {id, version}│
    │    metadata            // Nombre, descripción   │
    │  )                                              │
    └─────────────────────────────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────────────┐
    │            configId Calculation                 │
    │  keccak256(abi.encodePacked(                   │
    │    businessLogic1.id,                          │
    │    businessLogic1.version,                     │
    │    businessLogic2.id,                          │
    │    businessLogic2.version,                     │
    │    ...                                          │
    │  ))                                             │
    │                                                 │
    │  Example:                                       │
    │  ClientFiltering configId =                     │
    │  0x36d233a14f463fcecd58ef2aea8c649ae71c56ebc...│
    └─────────────────────────────────────────────────┘

              STEP 3B: deployUseCase
                    │
                    ▼
    ┌─────────────────────────────────────────────────┐
    │  ProxyFactoryFacet.deployUseCase(               │
    │    configId,           // Registered config     │
    │    salt,               // Unique deployment ID  │
    │    adminAddress        // Proxy admin           │
    │  )                                              │
    └─────────────────────────────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────────────┐
    │            Diamond Proxy Creation               │
    ├─────────────────────────────────────────────────┤
    │  1. Calculate proxy address (CREATE2)           │
    │  2. Deploy Diamond Proxy contract               │
    │  3. DiamondCut: Add all facets from config      │
    │  4. Initialize storage                          │
    │  5. Transfer admin role                         │
    └─────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────────────────────────┐
         │  ✅ Proxy Address                      │
         │     0x598c84C05b41C1ab663F38bC09...    │
         │     (HashTimestamp Proxy)              │
         │                                        │
         │  ✅ Facets Attached:                   │
         │     • HashTimestampFacet               │
         │     • AccessControl                    │
         │     • DiamondLoupe                     │
         │     • ...                              │
         └────────────────────────────────────────┘
```

---

##  FASE 4: Manual Use Case Deployment (Ejemplo: ClientFiltering)

```
    ┌─────────────────────────────────────────────────────────────────┐
    │  Cuando un Use Case NO está incluido en deployAllClean          │
    │  (ej: ClientFiltering, nuevos casos de uso custom)              │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                    STEP 4A: register.ts                         ║
    ║            fernando/filtering/register.ts                       ║
    ╚═════════════════════════════════════════════════════════════════╝
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  1. Deploy Facet (si no existe)                                 │
    │     BusinessLogicFactoryFacet.deploy(                           │
    │       facetAddress,                                             │
    │       "ClientFilteringFacet",                                   │
    │       1  // version                                             │
    │     )                                                           │
    │                                                                 │
    │  Output: BL Address = 0x256078A0C8172821Ae1eAdC85eA83dc23E5B52c1│
    │          Block: 300748                                          │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  2. Register Configuration                                      │
    │     ConfigurationManagementFacet.setConfiguration(              │
    │       configId,                                                 │
    │       [                                                         │
    │         { businessId: "ClientFilteringFacet", version: 1 },     │
    │         { businessId: "AccessControlFacet", version: 1 },       │
    │         { businessId: "DiamondCutAccessControlFacet", ver: 1 }, │
    │         { businessId: "DiamondLoupeFacet", version: 1 },        │
    │         ...                                                     │
    │       ],                                                        │
    │       metadata                                                  │
    │     )                                                           │
    │                                                                 │
    │  Output: Config ID = 0x36d233a14f463fcecd58ef2aea8c649ae71c... │
    │          Block: 300749                                          │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                   STEP 4B: create-proxy.ts                      ║
    ║           fernando/filtering/create-proxy.ts                    ║
    ╚═════════════════════════════════════════════════════════════════╝
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  3. Deploy Use Case Proxy                                       │
    │     ProxyFactoryFacet.deployUseCase(                            │
    │       configId,    // 0x36d233a14f463fce...                     │
    │       salt,        // Unique identifier                         │
    │       adminAddress // 0x8792c7B02D279BA876717...                │
    │     )                                                           │
    │                                                                 │
    │  Output: Proxy Address = 0x9741FC1da9b6a2EEEf88783b79184cEc...  │
    │          Block: 300794                                          │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  ✅ ClientFiltering Diamond Ready      │
         │                                        │
         │  Proxy: 0x9741FC1da9b6a2EEEf88...      │
         │  Factory: 0x90186F9907Cbe3150b...      │
         │  Config: 0x36d233a14f463fcecd5...      │
         └────────────────────────────────────────┘
```

---

##  FASE 5: Role Configuration

```
    ╔═════════════════════════════════════════════════════════════════╗
    ║                 STEP 5: grant-role-by-param.ts                  ║
    ║              fernando/grant-role-by-param.ts                    ║
    ╚═════════════════════════════════════════════════════════════════╝
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  Inputs (Environment Variables):                                │
    │  • PROXY_ADDRESS = 0x9741FC1da9b6a2EEEf88783b79184cEc355D5b5D  │
    │  • TARGET_ADDRESS = 0xeC7a918b186d73E83eB6780A3846714cBA873553 │
    │  • ROLE = CLIENT_FILTERING_ROLE                                 │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  Execution:                                                     │
    │                                                                 │
    │  1. Resolve Role Hash:                                          │
    │     ROLE_NAME → keccak256("CLIENT_FILTERING_ROLE")             │
    │     = 0xcbb09df20dd6e5dbe10d3957a6ca4269c2c926a5334d2cbcd...    │
    │                                                                 │
    │  2. Connect to Proxy:                                           │
    │     AccessControl at 0x9741FC1da9b6a2EEEf88783b79184...         │
    │                                                                 │
    │  3. Grant Role:                                                 │
    │     accessControl.grantRole(roleHash, targetAddress)            │
    │                                                                 │
    │  4. Verify:                                                     │
    │     accessControl.hasRole(roleHash, targetAddress) → true       │
    └─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  ✅ Role Granted Successfully          │
         │                                        │
         │  Role: CLIENT_FILTERING_ROLE           │
         │  Account: 0xeC7a918b186d73E83eB67...   │
         │  Proxy: 0x9741FC1da9b6a2EEEf887...     │
         │  Block: 301576                         │
         └────────────────────────────────────────┘
```

---

##  Resumen de Direcciones (Red Dev)

| Componente | Dirección | Block |
|------------|-----------|-------|
| **ISBE Factory** | `0x90186F9907Cbe3150bf8203Bb1e97473284b0254` | deployAllClean |
| **Admin Account** | `0x8792c7B02D279BA876717a509e8DF0A37f2ab5cd` | - |
| **HashTimestamp Proxy** | `0x598c84C05b41C1ab663F38bC09Cf25577ff38df5` | deployAllClean |
| **ClientFiltering BL** | `0x256078A0C8172821Ae1eAdC85eA83dc23E5B52c1` | 300748 |
| **ClientFiltering Proxy** | `0x9741FC1da9b6a2EEEf88783b79184cEc355D5b5D` | 300794 |
| **Target Account** | `0xeC7a918b186d73E83eB6780A3846714cBA873553` | roles granted |

---

## Flujo Resumido de Comandos

```bash
# FASE 1-3: Despliegue completo de infraestructura
npx hardhat deployAllClean --network dev

# FASE 4A: Registrar nuevo use case (si no existe)
npx hardhat run fernando/filtering/register.ts --network dev

# FASE 4B: Crear proxy para el use case
npx hardhat run fernando/filtering/create-proxy.ts --network dev

# FASE 5: Asignar roles
PROXY_ADDRESS=0x... TARGET_ADDRESS=0x... ROLE=CLIENT_FILTERING_ROLE \
  npx hardhat run fernando/grant-role-by-param.ts --network dev
```

---

##  Diagrama de Dependencias

```
                    ┌─────────────────┐
                    │   Red Besu Dev  │
                    │  (Chain 11073)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  ISBE Factory   │◄────────────────────────┐
                    │  (Governance)   │                         │
                    └────────┬────────┘                         │
                             │                                  │
           ┌─────────────────┼─────────────────┐               │
           ▼                 ▼                 ▼               │
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
    │ Business    │   │Configuration│   │    Proxy    │       │
    │ Logic       │   │ Management  │   │   Factory   │       │
    │ Factory     │   │             │   │             │       │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
           │                 │                 │               │
           ▼                 ▼                 │               │
    ┌─────────────┐   ┌─────────────┐         │               │
    │   Deploy    │   │  Register   │         │               │
    │   Facets    │──▶│  Configs    │─────────┼───────────────┤
    └─────────────┘   └─────────────┘         │               │
                                              ▼               │
                                       ┌─────────────┐        │
                                       │  Deploy     │        │
                                       │  Use Case   │────────┘
                                       │  Proxies    │  (refs Factory)
                                       └──────┬──────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Grant     │
                                       │   Roles     │
                                       └─────────────┘
```

---

## Checklist de Despliegue

### Pre-requisitos
- [ ] Red Besu operativa y accesible
- [ ] Cuentas configuradas con ETH para gas
- [ ] Variables de entorno configuradas (.env)

### Fase 1-3: deployAllClean
- [ ] `npx hardhat deployAllClean --network dev`
- [ ] Verificar Factory Address
- [ ] Verificar Admin tiene DEFAULT_ADMIN_ROLE

### Fase 4: Use Case Manual (si aplica)
- [ ] Verificar si Business Logic ya existe
- [ ] Registrar Business Logic (register.ts)
- [ ] Verificar configId está registrado
- [ ] Crear Proxy (create-proxy.ts)
- [ ] Verificar Proxy funciona (check-facets, etc.)

### Fase 5: Roles
- [ ] Identificar roles necesarios para cada use case
- [ ] Asignar roles a cuentas target
- [ ] Verificar roles con hasRole()

---
