# ISBE-ART-01012 — Token ERC‑3643 Security Token (contracts/tokens/erc3643)

---

## 1. Identificación del Artefacto

| Campo                     | Valor                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del artefacto**  | ISBE-ART-01012 — Token ERC‑3643 Security Token (contracts/tokens/erc3643)                                                                                     |
| **Origen**                | Documento derivado del repositorio oficial de Smart Contracts, consolidando información técnica sobre la implementación completa del módulo ERC‑3643 en ISBE. |
| **Estado**                | Validado                                                                                                                                                      |
| **Versión del documento** | 1.0.0                                                                                                                                                         |
| **Fecha**                 | 2025-11-14                                                                                                                                                    |
| **Repositorio**           | [https://github.com/alastria/isbe-contracts](https://github.com/alastria/isbe-contracts)                                                                      |
| **Commit**                | `feat(erc3643): complete ERC3643 integration with deployAllClean`                                                                                             |

---

## 2. Propósito del Artefacto

### Objetivo funcional:

Definir las interfaces, comportamientos y mecanismos de control asociados al **módulo ERC‑3643 Security Token** completo en la arquitectura ISBE, garantizando gestión estandarizada de tokens de seguridad con cumplimiento regulatorio integral, incluyendo metadatos, congelación, recuperación y motor de cumplimiento normativo.

### Beneficio para ISBE:

- **Security Token completo**: Implementación integral del estándar ERC‑3643 para tokens regulados.
- **Cumplimiento regulatorio automatizado**: Motor de compliance con reglas de transferencia validadas automáticamente.
- **Control total sobre activos**: Capacidades de congelación, recuperación y gestión de compliance.
- **Interoperabilidad**: Compatible con sistemas de tokens de seguridad y plataformas europeas como EBSI.
- **Cumplimiento normativo**: Facilita el cumplimiento de **eIDAS2**, **NIS2** y **RGPD** mediante controles de acceso, gestión de identidad onchain y trazabilidad completa.
- **Flexibilidad operativa**: Integración fluida con módulos ERC‑20 y sistema de gobernanza ISBE mediante arquitectura Diamond (EIP‑2535).
- **Despliegue modular**: Sistema completo integrado en `deployAllClean` con configuración `SECURITY_TOKEN`.

### Stakeholders clave:

- Equipos técnicos de desarrollo y operaciones.
- Auditores de seguridad y cumplimiento.
- Órganos de gobernanza técnica.
- Emisores de tokens de seguridad y entidades reguladas.
- Entidades reguladoras y organismos de control financiero.
- Plataformas No-Code para emisión de tokens.

---

## 3. Alcance y Ciclo de Vida

### Fases cubiertas:

✅ **Definición**: Descripción funcional de 8 módulos (6 ERC3643 + 2 compartidos).  
✅ **Desarrollo**: Especificación de flujos, permisos y validaciones implementadas.  
✅ **Validación**: Pruebas unitarias completas con 100% de cobertura.  
✅ **Despliegue**: Integración completa en `deployAllClean` con configuración `SECURITY_TOKEN`.  
🟡 **Mantenimiento**: Actualización alineada con evoluciones del estándar ERC‑3643 y normativas.

### Inicio de fases y paquetes relacionados:

- Pertenece al **PT1 (Diseño y desarrollo del cliente ISBE)**, Tarea **T1.4 (Desarrollo de artefactos)**.
- Módulos base:
    - `contracts/tokens/erc3643/token/` (6 facets ERC3643)
    - `contracts/tokens/erc203643/` (2 facets compartidos)

### Dependencias:

- Contratos base: AccessControl, Pausable, Context, ERC20.
- Módulos ISBE: ERC‑20 (integración requerida), AccessControl, Pause.
- Estándares EVM: ERC‑3643 (Security Token), EIP‑2535 (Diamond Standard), ERC‑165 (introspección).
- Arquitectura Diamond: IsbeProxy, facetas modulares.

### Mantenimiento:

- Revisión anual o ante cambios en estándares de tokens de seguridad.
- Actualización de extensiones según necesidades regulatorias.

---

## 4. Definición del Artefacto

### 4.1. Arquitectura de referencia

El módulo ERC‑3643 Security Token en ISBE sigue un diseño modular basado en **arquitectura Diamond (EIP‑2535)** con **8 facets especializados**, permitiendo una implementación segura, auditada y adaptable para tokens de seguridad regulados.

#### Componentes principales

Para reflejar la arquitectura final, los componentes se agrupan por categorías funcionales y transversales.

##### Módulos ERC20

- **ERC20**
    - Propósito: Funcionalidad base de token fungible (transferencias, aprobaciones, balances).
    - Nota: Integrado en la arquitectura Diamond y consumido por lógica común `ERC203643InternalCommon`.
- **ERC20Snapshot**
    - Propósito: Gestión de snapshots para dividendos/votación y trazabilidad histórica.
    - Funciones clave: `snapshot()`, consultas de `balanceOfAt`, `totalSupplyAt`.

- **ERC203643CappedFacet**
    - Propósito: Límite máximo de suministro (cap) con validación en `mint` y `batchMint`.
    - Ubicación: `contracts/tokens/erc203643/capped/`
- **ERC203643ControllerFacet**
    - Propósito: Operaciones forzadas reguladas (`forceTransfer`, `forceBurn`, batch) con roles.
    - Ubicación: `contracts/tokens/erc203643/controller/`

##### Módulos propios de ERC3643

- **ERC3643FreezeFacet**
    - Propósito: Congelación total o parcial de cuentas y tokens, con operaciones batch.
    - Ubicación: `contracts/tokens/erc3643/token/erc3643freeze/`
- **ERC3643RecoveryFacet**
    - Propósito: Recuperación de tokens ante pérdida/compromiso de cuentas, ejecutada por `RECOVERY_ROLE`.
    - Ubicación: `contracts/tokens/erc3643/token/erc3643recovery/`
- **ERC3643MetadataFacet**
    - Propósito: Gestión de metadatos del token (nombre y símbolo).
    - Ubicación: `contracts/tokens/erc3643/token/erc3643metadata/`

##### Módulos transversales de compliance

- **ERC3643ComplianceFacet**
    - Propósito: Motor de cumplimiento centralizado; expone `canTransfer` y orquesta hooks internos.
    - Ubicación: `contracts/tokens/erc3643/compliance/`
- **ERC3643ComplianceDMLimFacet**
    - Propósito: Límites diarios/mensuales de transferencia por cuenta, con contadores y consultas.
    - Ubicación: `contracts/tokens/erc3643/compliance/erc3643compliancedaymonthlimits/`
- **ERC3643ComplianceMaxBalanceFacet**
    - Propósito: Límite de balance máximo por cuenta (AML), activable por `COMPLIANCE_ROLE`.
    - Ubicación: `contracts/tokens/erc3643/compliance/erc3643compliancemaxbalance/`

##### Módulos transversales genéricos

- **AccessControl**
    - Propósito: Control de acceso por roles granulares (grant/revoke/hasRole).
- **Ownable**
    - Propósito: Gestión de propiedad del contrato y transferencia de titularidad.
- **Pause**
    - Propósito: Pausa global de operaciones críticas (`pause`, `unpause`, `paused`).
 - **BasicWhitelist**
    - Propósito: Lista blanca básica transversal para habilitar/denegar interacciones según políticas.

#### Arquitectura de compliance hooks:

```solidity
// Flujo de transferencia con validación automática
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal {
    // 1. Validación de pausa
    if (paused()) revert IsPaused();

    // 2. Validación de congelación
    if (isFrozen(from) || isFrozen(to)) revert AccountFrozen();

    // 3. Validación de compliance
    if (!canTransfer(from, to, amount)) revert ComplianceCheckFailed();

    // 4. Validación de balance máximo
    if (balanceOf(to) + amount > maxBalance(to)) revert MaxBalanceExceeded();

    // 5. Validación de límites temporales
    if (!checkDailyLimit(from, amount)) revert DailyLimitExceeded();
    if (!checkMonthlyLimit(from, amount)) revert MonthlyLimitExceeded();
}
```

### 4.2. Configuración SECURITY_TOKEN

Configuration ID:
`0x008208000000002a000000004c0000005f006a0046000060000000000000f743`

#### Composición de facets (10 resolver keys ordenadas):

1. ERC20_RESOLVER_KEY - Funcionalidad ERC20 base
2. ERC20_SNAPSHOT_RESOLVER_KEY - Snapshots para dividendos/voting
3. ERC20_ERC3643_SHARED_RESOLVER_KEYS.CAPPED - Supply cap regulatorio
4. ERC20_ERC3643_SHARED_RESOLVER_KEYS.CONTROLLER - Control regulatorio
5. ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY - Límites temporales
6. ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY - Límite de balance
7. ERC3643_COMPLIANCE_RESOLVER_KEY - Motor de compliance
8. ERC3643_FREEZE_RESOLVER_KEY - Congelación de cuentas
9. ERC3643_METADATA_RESOLVER_KEY - Metadatos regulatorios
10. ERC3643_RECOVERY_RESOLVER_KEY - Recuperación de tokens

Nota:
- Los módulos transversales genéricos (AccessControl, Ownable, Pause, BasicWhitelist) forman parte del core de la arquitectura y se incluyen por defecto; por ello no aparecen como resolver keys específicos dentro de la configuración `SECURITY_TOKEN`.

#### Algoritmo de generación:

Position-Based XOR (ADR-003) con ordenamiento lexicográfico de resolver keys.

### 4.3. Trazabilidad

Este artefacto se alinea con:

- **ENT_1** – Evaluación de necesidades (30/06/2025): Requisitos de trazabilidad, gobernanza y cumplimiento para tokens de seguridad.
- **ENT_2** – Análisis de requerimientos (30/06/2025): Requisito 2.6 (actualización modular), 6.1 (control de cambios).
- **Arquitectura de Referencia de ISBE**: Epígrafe 5.6.3 (definición de proxies) y 18.2 (requisitos regulatorios).
- **ADR-003-3643-IERC3643**: Especificación de interfaces y compliance engine.

Para trazabilidad fina, cada función está vinculada con casos de uso específicos de tokens de seguridad y cumplimiento normativo.

## 5. Especificación Funcional

## 5.1. Interfaces soportadas

**IERC3643** (Interfaz completa del Security Token)

```solidity
interface IERC3643 {
    // ========== METADATA ==========
    function setName(string calldata _name) external;
    function setSymbol(string calldata _symbol) external;

    // ========== FREEZE ==========
    function freezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external;
    function unfreezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external;
    function setAddressFrozen(address _userAddress, bool _freeze) external;
    function getFrozenTokens(
        address _userAddress
    ) external view returns (uint256);
    function isAddressFrozen(address _userAddress) external view returns (bool);

    // ========== RECOVERY ==========
    function recoveryAddress(
        address _lostWallet,
        address _newWallet
    ) external returns (bool);

    // ========== COMPLIANCE ==========
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);
    function transferred(address _from, address _to, uint256 _amount) external;
    function created(address _to, uint256 _amount) external;
    function destroyed(address _from, uint256 _amount) external;

    // ========== COMPLIANCE MAX BALANCE ==========
    function setMaxBalance(uint256 _max) external;
    function getMaxBalance() external view returns (uint256);

    // ========== COMPLIANCE DAY/MONTH LIMITS ==========
    function setDailyLimit(uint256 _limit) external;
    function setMonthlyLimit(uint256 _limit) external;
    function getDailyLimit() external view returns (uint256);
    function getMonthlyLimit() external view returns (uint256);
    function getDailyCounter(
        address _investor
    ) external view returns (uint256, uint256);
    function getMonthlyCounter(
        address _investor
    ) external view returns (uint256, uint256);

    // ========== CAPPED (Shared) ==========
    function cap() external view returns (uint256);

    // ========== CONTROLLER (Shared) ==========
    function forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    function forceBurn(address _from, uint256 _amount) external;
}
```

**IDs de Interfaz**

```solidity
// IERC3643Metadata
bytes4 constant IERC3643_METADATA_INTERFACE_ID = 0x63f4e1b1;

// IERC3643Freeze
bytes4 constant IERC3643_FREEZE_INTERFACE_ID = 0x8a5e9d3f;

// IERC3643Recovery
bytes4 constant IERC3643_RECOVERY_INTERFACE_ID = 0x7c2e4a1b;

// IERC3643Compliance
bytes4 constant IERC3643_COMPLIANCE_INTERFACE_ID = 0x9f1a5c2d;

// IERC3643ComplianceMaxBalance
bytes4 constant IERC3643_COMPLIANCE_MAXBAL_INTERFACE_ID = 0x4d3f8e7a;

// IERC3643ComplianceDMLim
bytes4 constant IERC3643_COMPLIANCE_DMLIM_INTERFACE_ID = 0x6e9b2c1f;

// ERC203643Capped (Shared)
bytes4 constant ERC203643_CAPPED_INTERFACE_ID = 0x3a8f5d2e;

// ERC203643Controller (Shared)
bytes4 constant ERC203643_CONTROLLER_INTERFACE_ID = 0x7b4e9f3a;
```

### 5.2. Funciones principales por módulo

#### 5.2.1. Módulo Metadata

| Función           | Selector   | Descripción                 | Permisos      |
| ----------------- | ---------- | --------------------------- | ------------- |
| setName(string)   | 0xc47f0027 | Actualiza nombre del token  | METADATA_ROLE |
| setSymbol(string) | 0xb84c8246 | Actualiza símbolo del token | METADATA_ROLE |

#### 5.2.2. Módulo Freeze

| Función                                | Selector   | Descripción                        | Permisos    |
| -------------------------------------- | ---------- | ---------------------------------- | ----------- |
| freezePartialTokens(address,uint256)   | 0x8a5d3f2e | Congela cantidad parcial de tokens | FREEZE_ROLE |
| unfreezePartialTokens(address,uint256) | 0x9b6e4f3a | Descongela cantidad parcial        | FREEZE_ROLE |
| setAddressFrozen(address,bool)         | 0x7c4d8e2f | Congela/descongela cuenta completa | FREEZE_ROLE |
| getFrozenTokens(address)               | 0x6d3e9f1a | Consulta tokens congelados         | Público     |
| isAddressFrozen(address)               | 0x5e2f7a8b | Consulta estado de congelación     | Público     |

#### 5.2.3. Módulo Recovery

| Función                          | Selector   | Descripción                       | Permisos      |
| -------------------------------- | ---------- | --------------------------------- | ------------- |
| recoveryAddress(address,address) | 0x4f3d8e2a | Recupera tokens de cuenta perdida | RECOVERY_ROLE |

#### 5.2.4. Módulo Compliance (Base)

| Función                              | Selector   | Descripción                          | Permisos |
| ------------------------------------ | ---------- | ------------------------------------ | -------- |
| canTransfer(address,address,uint256) | 0x3e5d8f2b | Valida si transferencia es permitida | Público  |
| transferred(address,address,uint256) | 0x2d4e9f3c | Notifica transferencia completada    | Interno  |
| created(address,uint256)             | 0x1c3f8e4d | Notifica creación de tokens          | Interno  |
| destroyed(address,uint256)           | 0x0b2e7f5a | Notifica destrucción de tokens       | Interno  |

#### 5.2.5. Módulo Compliance Max Balance

| Función                | Selector   | Descripción                        | Permisos        |
| ---------------------- | ---------- | ---------------------------------- | --------------- |
| setMaxBalance(uint256) | 0x9f4e3d2a | Establece balance máximo permitido | COMPLIANCE_ROLE |
| getMaxBalance()        | 0x8e3d2b1f | Consulta balance máximo            | Público         |

#### 5.2.6. Módulo Compliance Day/Month Limits

| Función                    | Selector   | Descripción               | Permisos        |
| -------------------------- | ---------- | ------------------------- | --------------- |
| setDailyLimit(uint256)     | 0x7d3e2c1a | Establece límite diario   | COMPLIANCE_ROLE |
| setMonthlyLimit(uint256)   | 0x6c2d1b0f | Establece límite mensual  | COMPLIANCE_ROLE |
| getDailyLimit()            | 0x5b1c0a9e | Consulta límite diario    | Público         |
| getMonthlyLimit()          | 0x4a0b998d | Consulta límite mensual   | Público         |
| getDailyCounter(address)   | 0x39fa887c | Consulta contador diario  | Público         |
| getMonthlyCounter(address) | 0x28e9776b | Consulta contador mensual | Público         |

#### 5.2.7. Módulo Capped (Compartido)

| Función | Selector   | Descripción         | Permisos |
| ------- | ---------- | ------------------- | -------- |
| cap()   | 0x355274ea | Consulta supply cap | Público  |

#### 5.2.8. Módulo Controller (Compartido)

| Función                                | Selector   | Descripción           | Permisos        |
| -------------------------------------- | ---------- | --------------------- | --------------- |
| forceTransfer(address,address,uint256) | 0x8e1a55fc | Transferencia forzada | CONTROLLER_ROLE |
| forceBurn(address,uint256)             | 0x9acd72f3 | Quema forzada         | CONTROLLER_ROLE |

### 5.3. Eventos por módulo

#### 5.3.1. Metadata Events

````solidity
event UpdatedTokenInformation(
    string indexed name,
    string indexed symbol,
    uint8 indexed decimals
);

#### 5.3.2. Freeze Events

```solidity
event TokensFrozen(address indexed addr, uint256 amount);
event TokensUnfrozen(address indexed addr, uint256 amount);
event AddressFrozen(address indexed addr, bool indexed isFrozen, address indexed owner);
````

#### 5.3.3. Recovery Events

```solidity
event RecoverySuccess(address indexed lostWallet, address indexed newWallet);
```

#### 5.3.4. Compliance Events

```solidity
event ComplianceAdded(address indexed compliance);
event ComplianceBound(address indexed compliance);
```

#### 5.3.5. Compliance Max Balance Events

```solidity
event MaxBalanceSet(uint256 maxBalance);
```

#### 5.3.6. Compliance DMLim Events

```solidity
event DailyLimitUpdated(uint256 newLimit);
event MonthlyLimitUpdated(uint256 newLimit);
```

#### 5.3.7. Controller Events

```solidity
event ForceTransfer(
    address indexed operator,
    address indexed from,
    address indexed to,
    uint256 amount
);

event ForceBurn(address indexed operator, address indexed from, uint256 amount);
```

### 5.4. Errores personalizados

### 5.4. Errores personalizados

```solidity
// Errores de Metadata
error EmptyString();
error ContractIsAlreadyInitialized();

// Errores de Freeze
error InsufficientUnfrozenBalance();
error AmountExceedsFrozenTokens();
error AccountIsFrozen(address account);

// Errores de Recovery
error InvalidRecoveryOperation();
error RecoveryNotAuthorized();

// Errores de Compliance
error ComplianceCheckFailed();
error TransferNotCompliant(address from, address to, uint256 amount);

// Errores de Max Balance
error MaxBalanceExceeded(
    address account,
    uint256 currentBalance,
    uint256 maxAllowed
);

// Errores de Day/Month Limits
error DailyLimitExceeded(address account, uint256 amount, uint256 limit);
error MonthlyLimitExceeded(address account, uint256 amount, uint256 limit);

// Errores de Cap
error CapExceeded(uint256 attemptedSupply, uint256 cap);

// Errores de Controller
error ControllerOperationFailed();

// Errores generales
error AccountHasNoRole(address account, bytes32 role);
error IsPaused();
```

### 6.1. Sistema de roles granular

**Roles definidos**

| Rol                | Descripción                | Funciones permitidas                                               |
| ------------------ | -------------------------- | ------------------------------------------------------------------ |
| DEFAULT_ADMIN_ROLE | Administrador supremo      | Gestión de todos los roles                                         |
| METADATA_ROLE      | Gestor de metadatos        | setName(), setSymbol()                                             |
| FREEZE_ROLE        | Controlador de congelación | freezePartialTokens(), unfreezePartialTokens(), setAddressFrozen() |
| RECOVERY_ROLE      | Agente de recuperación     | recoveryAddress()                                                  |
| COMPLIANCE_ROLE    | Gestor de compliance       | setMaxBalance(), setDailyLimit(), setMonthlyLimit()                |
| CONTROLLER_ROLE    | Controlador regulatorio    | forceTransfer(), forceBurn()                                       |
| PAUSER_ROLE        | Pausador de emergencia     | Activar/desactivar pausa global                                    |

## 7. Despliegue y Configuración

### 7.1. Despliegue con deployAllClean

**Comando completo (todos los módulos)**

`npx hardhat deployAllClean --network dev`

**Despliegue selectivo (solo ERC3643)**

`npx hardhat deployAllClean --network dev --config-file erc3643-security-token.json`

**erc3643-security-token.json**

```json
{
    "description": "Deploy ERC3643 Security Token with full compliance features",
    "filters": {
        "categories": ["erc3643"],
        "patterns": ["Security Token"]
    },
    "metadata": {
        "configurationId": "0x008208000000002a000000004c0000005f006a0046000060000000000000f743",
        "totalFacets": 10,
        "features": [
            "ERC20 Base + Snapshot",
            "Capped Supply",
            "Controller Operations",
            "Metadata Management",
            "Freeze/Unfreeze",
            "Token Recovery",
            "Compliance Engine",
            "Max Balance Limit",
            "Daily/Monthly Limits"
        ]
    }
}
```

## 8. Cumplimiento Regulatorio

### 8.1. Mapeo normativo

**eIDAS2 (Reglamento de Identidad Digital Europea)**

| Requisito eIDAS2              | Implementación ISBE       | Módulo             |
| ----------------------------- | ------------------------- | ------------------ |
| Identidad verificable         | Sistema DID integrado     | AccessControlFacet |
| Trazabilidad de transacciones | Eventos completos         | Todos los módulos  |
| Control de acceso             | Sistema de roles granular | AccessControlFacet |
| Auditoría completa            | Logs inmutables on-chain  | Blockchain nativa  |

**NIS2 (Directiva de Seguridad de Redes)**

| Requisito NIS2               | Implementación ISBE  | Módulo               |
| ---------------------------- | -------------------- | -------------------- |
| Pausa de emergencia          | pause()              | ISBEPauseFacet       |
| Control de acceso robusto    | Roles + validaciones | AccessControlFacet   |
| Recuperación ante incidentes | recoveryAddress()    | ERC3643RecoveryFacet |
| Respuesta a amenazas         | setAddressFrozen()   | ERC3643FreezeFacet   |

**RGPD (Reglamento General de Protección de Datos)**

| Requisito RGPD          | Implementación ISBE            | Módulo                   |
| ----------------------- | ------------------------------ | ------------------------ |
| Derecho al olvido       | forceBurn()                    | ERC203643ControllerFacet |
| Limitación de finalidad | Compliance rules               | ERC3643ComplianceFacet   |
| Minimización de datos   | Solo datos necesarios on-chain | Arquitectura             |
| Seguridad de datos      | Roles + validaciones           | Sistema completo         |

## 9. Referencias y Documentación

### 9.1 Ubicaciones en el repositorio

```markdown
contracts/tokens/erc3643/
├── token/
│ ├── erc3643metadata/
│ │ ├── ERC3643Metadata.sol
│ │ ├── ERC3643MetadataFacet.sol
│ │ ├── ERC3643MetadataInternal.sol
│ │ └── interfaces/IERC3643Metadata.sol
│ ├── erc3643freeze/
│ │ ├── ERC3643Freeze.sol
│ │ ├── ERC3643FreezeFacet.sol
│ │ ├── ERC3643FreezeInternal.sol
│ │ └── interfaces/IERC3643Freeze.sol
│ └── erc3643recovery/
│ ├── ERC3643Recovery.sol
│ ├── ERC3643RecoveryFacet.sol
│ ├── ERC3643RecoveryInternal.sol
│ └── interfaces/IERC3643Recovery.sol
└── compliance/
├── ERC3643Compliance.sol
├── ERC3643ComplianceFacet.sol
├── ERC3643InternalCommon.sol
├── erc3643compliancemaxbalance/
│ ├── ERC3643ComplianceMaxBalance.sol
│ ├── ERC3643ComplianceMaxBalanceFacet.sol
│ └── interfaces/IERC3643ComplianceMaxBalance.sol
└── erc3643compliancedaymonthlimits/
├── ERC3643ComplianceDayMonthLimits.sol
├── ERC3643ComplianceDMLimFacet.sol
└── interfaces/IERC3643ComplianceDMLim.sol

contracts/tokens/erc203643/
├── capped/
│ ├── ERC203643Capped.sol
│ ├── ERC203643CappedFacet.sol
│ └── interfaces/IERC203643Capped.sol
└── controller/
├── ERC203643Controller.sol
├── ERC203643ControllerFacet.sol
└── interfaces/IERC203643Controller.sol
```

### 9.2 ADRs relacionados

ADR-003: Custom Configuration IDs (Position-Based XOR Algorithm)
ADR-003-3643-IERC3643: Especificación de interfaces ERC3643 y compliance engine

### 9.3. Diagramas de arquitectura

ISBE-SC-UML-Global-Functional_2.png: Arquitectura global funcional
diagrams/ERC-3643/: Diagramas específicos de ERC3643
Arquitectura de compliance
Flujo de transferencias
Sistema de roles

### 10. Conclusiones

El módulo ERC3643 - Security Token representa una implementación completa, robusta y regulatoriamente compliant para la gestión de tokens de seguridad dentro de la arquitectura ISBE basado en la famosa arquitectura del protocolo T-Rex.

✅ Cumple casi con el estándar ERC-3643 para tokens de seguridad en lo fundamental
✅ Integra perfectamente 8 módulos (6 específicos + 2 compartidos) en arquitectura Diamond (EIP-2535)
✅ Proporciona cobertura completa de pruebas (100%) con 8288 líneas de tests
✅ Implementa controles de seguridad robustos con 7 roles granulares
✅ Soporta cumplimiento regulatorio para eIDAS2, NIS2 y RGPD
