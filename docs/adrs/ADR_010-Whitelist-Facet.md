# ADR_010: Whitelist Implementation via Facet Architecture vs Role-Based Access Control

## Tabla de contenidos

1. [Status](#status)
2. [Contexto](#contexto)
3. [Problema](#problema)
4. [Opciones Evaluadas](#opciones-evaluadas)
   - 4.1. [Opción 1: Implementación mediante Roles (WHITELISTED_ROLE)](#opción-1-implementación-mediante-roles-whitelisted_role)
   - 4.2. [Opción 2: Implementación mediante Faceta Dedicada (WhitelistFacet)](#opción-2-implementación-mediante-faceta-dedicada-whitelistfacet)
5. [Decisión](#decisión)
6. [Justificación Técnica](#justificación-técnica)
   - 6.1. [Alineación con Arquitectura ERC-3643](#alineación-con-arquitectura-erc-3643)
   - 6.2. [Escalabilidad](#escalabilidad)
   - 6.3. [Separación de Responsabilidades](#separación-de-responsabilidades)
   - 6.4. [Funcionalidad Extensible](#funcionalidad-extensible)
   - 6.5. [Gas Efficiency](#gas-efficiency)
   - 6.6. [Mantenibilidad y Auditoría](#mantenibilidad-y-auditoría)
7. [Arquitectura de la Solución](#arquitectura-de-la-solución)
   - 7.1. [Estructura de Archivos](#estructura-de-archivos)
   - 7.2. [Storage Layout](#storage-layout)
   - 7.3. [Interfaz Pública](#interfaz-pública)
   - 7.4. [Integración con ERC-3643](#integración-con-erc-3643)
8. [Plan de Despliegue](#plan-de-despliegue)
   - 8.1. [Fase 1: Desarrollo y Testing](#fase-1-desarrollo-y-testing)
   - 8.2. [Fase 2: Registro en BusinessLogicFactory](#fase-2-registro-en-businesslogicfactory)
   - 8.3. [Fase 3: Integración con Configuraciones Existentes](#fase-3-integración-con-configuraciones-existentes)
   - 8.4. [Fase 4: Activación en Proxies Existentes](#fase-4-activación-en-proxies-existentes)
9. [Casos de Uso](#casos-de-uso)
10. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)
11. [Métricas de Éxito](#métricas-de-éxito)
12. [Referencias](#referencias)

---

## 1. Status

**Propuesta** - Pendiente de revisión e implementación

---

## 2. Contexto

ISBE implementa múltiples estándares de tokens (**ERC20**, **ERC721**, **ERC3643**) que requieren control estricto sobre quién puede poseer y transferir activos digitales. La arquitectura **Diamond (EIP-2535)** permite modularidad mediante facetas reutilizables.

Actualmente, ISBE cuenta con:
- **AccessControl** basado en roles para permisos administrativos (ej: `COMPLIANCE_ROLE`, `MINTER_ROLE`, `FREEZE_ROLE`).
- **Compliance Modules** específicos de ERC-3643 (ej: `MaxBalance`, `DailyMonthLimits`) ubicados en `contracts/tokens/erc3643/compliance/`.
- **Extensions** transversales ubicadas en `contracts/tokens/extensions/` para tokens estándar:
  - ERC721: `Snapshot`, `Capped`, `Enumerable`, `Royalty`, `Consecutive`.
  - ERC20: (actualmente sin extensiones modulares, pero arquitectura preparada).

Se ha identificado la necesidad de implementar un sistema de **whitelist como extensión transversal** que permita:
1. **Restringir transferencias en Security Tokens (ERC3643)** a inversores acreditados (KYC/AML).
2. **Controlar distribución temprana de Utility Tokens (ERC20)** solo a early adopters/partners.
3. **Limitar mercado secundario de NFTs (ERC721)** a coleccionistas verificados.

**Característica clave:** Whitelist NO es un módulo de compliance (específico de ERC3643), sino una **extensión transversal** aplicable a cualquier token que implemente hooks `_beforeTokenTransfer` (ERC20, ERC721, ERC3643, futuros ERC1155).

---

## 3. Problema

Los emisores de tokens necesitan:
1. **Restringir transferencias a direcciones aprobadas** en múltiples contextos:
   - **ERC3643 (Security Tokens)**: Cumplimiento regulatorio (KYC/AML).
   - **ERC20 (Utility Tokens)**: Acceso controlado en fases de preventa o partnerships.
   - **ERC721 (NFTs)**: Mercado secundario restringido a galerías/coleccionistas verificados.
2. **Gestionar listas de direcciones** de forma eficiente (agregar, remover, consultar).
3. **Escalar a miles o millones de direcciones** sin comprometer el rendimiento de la red.
4. **Mantener separación de responsabilidades** entre control de acceso administrativo (roles) y control operacional (whitelist).
5. **Facilitar auditorías** mediante eventos y trazabilidad clara de cambios en la whitelist.

**Alcance transversal confirmado:**
Todos los tokens en ISBE implementan hooks `_beforeTokenTransfer`:
- `ERC20Internal._beforeTokenTransfer(address from, address to, uint256 amount)`
- `ERC721Internal._beforeTokenTransfer(address from, address to, uint256 tokenId)`
- `ERC203643InternalCommon._beforeTokenTransfer(address from, address to, uint256 amount)`

Esto significa que el whitelist puede ser una **extensión modular reutilizable**, NO una funcionalidad específica de compliance ERC3643.

**Pregunta clave:** ¿Debe la whitelist implementarse como un **nuevo rol** (`WHITELISTED_ROLE`) dentro de `AccessControl`, o como una **extensión independiente** (`WhitelistInternal/WhitelistFacet`) con su propia lógica de negocio?

---

## 4. Opciones Evaluadas

### Opción 1: Implementación mediante Roles (WHITELISTED_ROLE)

#### Descripción
Añadir un nuevo rol `WHITELISTED_ROLE` en el sistema de `AccessControl` existente. Los usuarios autorizados recibirían este rol, y las validaciones de transferencia verificarían `hasRole(WHITELISTED_ROLE, recipient)`.

#### Ventajas
- ✅ **Implementación inmediata**: No requiere nuevos contratos ni despliegues.
- ✅ **Uso de infraestructura existente**: Aprovecha el sistema de roles ya auditado.
- ✅ **Cero costo de despliegue adicional**: No hay gas cost para deploy de facet.

#### Desventajas
- ❌ **Escalabilidad limitada**: El sistema de roles usa `EnumerableSet`, que puede volverse costoso con miles de miembros.
- ❌ **Saturación del namespace de roles**: Mezcla responsabilidades administrativas (gobernanza) con responsabilidades de compliance (elegibilidad de inversores).
- ❌ **Falta de funcionalidad específica**: No permite features avanzadas como:
  - Whitelist con expiración temporal.
  - Categorías de inversores (accredited, institutional, retail).
  - Batch operations optimizadas.
  - Enumeration eficiente para auditorías.
- ❌ **Colisión conceptual**: Los roles están diseñados para permisos administrativos, no para compliance operacional.
- ❌ **Gas cost elevado en operaciones**: Cada check de rol requiere atravesar estructuras de datos no optimizadas para este caso de uso.

#### Pseudocódigo
```solidity
// En AccessControl
bytes32 public constant WHITELISTED_ROLE = keccak256("WHITELISTED_ROLE");

// En ERC203643InternalCommon
function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
    require(hasRole(WHITELISTED_ROLE, to), "Recipient not whitelisted");
    super._beforeTokenTransfer(from, to, amount);
}
```

---

### Opción 2: Implementación mediante Extensión Transversal (WhitelistInternal + WhitelistFacet)

#### Descripción
Crear una **extensión transversal** `WhitelistInternal` (análoga a `ERC721SnapshotInternal`, `ERC721CappedInternal`) con storage aislado y API específica para gestión de whitelist. Esta extensión se integra mediante herencia múltiple en los contratos `*InternalCommon` de cada estándar (ERC20, ERC721, ERC3643).

**Posicionamiento arquitectónico:**
```
contracts/tokens/extensions/whitelist/   # ← Extensión transversal (NO compliance)
├── interfaces/
│   └── IWhitelist.sol
├── WhitelistInternal.sol                # Storage + helpers (heredable)
├── Whitelist.sol                        # Lógica de negocio
└── WhitelistFacet.sol                   # Punto de entrada Diamond
```

**Diferencia clave con compliance:**
- **Compliance modules** (`contracts/tokens/erc3643/compliance/`): Específicos de ERC3643, validan reglas regulatorias.
- **Extensions** (`contracts/tokens/extensions/`): Transversales, añaden funcionalidad opcional a cualquier token.

**Casos de integración:**
1. **ERC20 + Whitelist**: Crear `ERC20WhitelistInternalCommon` (hereda `ERC20Internal` + `WhitelistInternal`).
2. **ERC721 + Whitelist**: Crear `ERC721WhitelistInternalCommon` (hereda `ERC721InternalCommon` + `WhitelistInternal`).
3. **ERC3643 + Whitelist**: Modificar `ERC203643InternalCommon` para heredar `WhitelistInternal`.

#### Ventajas
- ✅ **Extensión transversal (NO específica de compliance)**:
  - Ubicación correcta: `contracts/tokens/extensions/whitelist/` (junto a Snapshot, Capped).
  - NO está en `contracts/tokens/erc3643/compliance/` porque no es exclusiva de security tokens.
  - Aplicable a ERC20, ERC721, ERC3643, futuros ERC1155.
- ✅ **Reutilización máxima**:
  - Una sola implementación para todos los estándares de tokens.
  - Código DRY: evita duplicar lógica de whitelist en cada contrato.
- ✅ **Escalabilidad ilimitada**: Storage optimizado para millones de direcciones.
- ✅ **Funcionalidad extensible**:
  - Whitelist con expiración temporal.
  - Batch operations (`addToWhitelistBatch`).
  - Enumeration paginada para auditorías.
  - Eventos específicos (`AddedToWhitelist`, `RemovedFromWhitelist`).
- ✅ **Separación de responsabilidades**: Control de acceso (whitelist) separado de gobernanza administrativa (roles).
- ✅ **Gas efficiency**: Operaciones optimizadas para checks frecuentes (transfers).
- ✅ **Alineación con arquitectura existente**: 
  - `ERC721InternalCommon` ya combina extensiones (`Snapshot`, `Capped`, `Enumerable`).
  - Whitelist sigue el mismo patrón de herencia múltiple y override de `_beforeTokenTransfer`.
- ✅ **Auditoría clara**: Logs y trazabilidad específicos para whitelist (separados de roles y compliance).

#### Desventajas
- ❌ **Mayor complejidad inicial**: Requiere desarrollar 4 archivos base + 3 archivos de integración (`*InternalCommon` para cada token).
- ❌ **Costo de despliegue**: Gas cost para deploy y registro en `BusinessLogicFactory`.
- ❌ **Requiere configuraciones específicas**: Debe crearse `ERC20_WHITELISTED`, `ERC721_WHITELISTED`, `SECURITY_TOKEN_WHITELISTED`.
- ❌ **Herencia múltiple**: Requiere cuidado al resolver `_beforeTokenTransfer` en contratos con múltiples extensiones.

#### Arquitectura
```
contracts/tokens/extensions/whitelist/    # ← Ubicación transversal
├── interfaces/
│   └── IWhitelist.sol                    (Interfaz pública)
├── WhitelistInternal.sol                 (Storage + helpers - heredable)
├── Whitelist.sol                         (Lógica de negocio)
└── WhitelistFacet.sol                    (Punto de entrada Diamond)

# Integración en cada estándar
contracts/tokens/erc20/
└── ERC20WhitelistInternalCommon.sol      (ERC20Internal + WhitelistInternal)

contracts/tokens/erc721/extensions/
└── ERC721WhitelistInternalCommon.sol     (ERC721InternalCommon + WhitelistInternal)

contracts/tokens/erc203643/
└── ERC203643InternalCommon.sol           (Modificar para heredar WhitelistInternal)
```

---

## 5. Decisión

**Se adopta la Opción 2: Implementación mediante Extensión Transversal Whitelist (WhitelistInternal + WhitelistFacet).**

**Razones principales:**

1. **Transversalidad confirmada**: Todos los tokens (ERC20, ERC721, ERC3643) implementan hooks `_beforeTokenTransfer`, lo que hace que whitelist sea una funcionalidad común, NO específica de compliance ERC3643.

2. **Patrón arquitectónico existente**: ISBE ya usa extensiones modulares heredables:
   - `ERC721InternalCommon` hereda de `Snapshot`, `Capped`, `Enumerable`, `Royalty`, `Consecutive`.
   - Whitelist debe seguir el mismo patrón: **extensión heredable que puede combinarse con otras**.

3. **Separación de responsabilidades**:
   - **Roles (AccessControl)**: Permisos administrativos (quién puede administrar el token).
   - **Whitelist (Extension)**: Control operacional (quién puede poseer/transferir el token).
   - Mezclar ambos viola Single Responsibility Principle.

4. **Escalabilidad**: Storage dedicado optimizado permite manejar millones de direcciones con gas eficiente, mientras que roles usarían `EnumerableSet` (costoso).

---

## 6. Justificación Técnica

### 6.1. Alineación con Arquitectura de Extensiones de ISBE

**Patrón existente en ERC721:**
ISBE ya implementa extensiones modulares heredables en `ERC721InternalCommon`:
- `ERC721SnapshotInternal`: Captura histórica de balances.
- `ERC721CappedInternal`: Límite máximo de supply.
- `ERC721EnumerableInternal`: Enumeration de tokens.
- `ERC721RoyaltyInternal`: Royalties EIP-2981.

Todas estas extensiones:
1. Heredan de `ERC721Internal` (base).
2. Override `_beforeTokenTransfer` para añadir validaciones.
3. Usan storage aislado (`keccak256` hash único).
4. Son opcionales y combinables.

**Whitelist sigue exactamente el mismo patrón:**
```solidity
// Patrón existente
abstract contract ERC721InternalCommon is
    ERC721SnapshotInternal,
    ERC721CappedInternal,
    ERC721EnumerableInternal
{
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal virtual override(ERC721Internal, ERC721SnapshotInternal, ERC721EnumerableInternal)
    {
        ERC721SnapshotInternal._beforeTokenTransfer(from, to, tokenId);
        ERC721EnumerableInternal._beforeTokenTransfer(from, to, tokenId);
    }
}

// Patrón propuesto para Whitelist
abstract contract ERC721WhitelistInternalCommon is
    ERC721InternalCommon,
    WhitelistInternal
{
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal virtual override(ERC721InternalCommon)
    {
        // Validar whitelist
        if (to != address(0) && !_isAccountWhitelisted(to)) {
            revert IWhitelist.NotWhitelisted(to);
        }
        
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
```

**Conclusión:** Whitelist NO es específico de compliance ERC3643, sino una extensión transversal aplicable a cualquier token.

### 6.2. Escalabilidad

#### Análisis de Gas Cost

**Escenario:** Security token con 10,000 inversores whitelisted.

| Operación | Opción 1 (Role) | Opción 2 (Facet) |
|-----------|-----------------|------------------|
| **Añadir 1 inversor** | ~45,000 gas | ~25,000 gas |
| **Añadir 100 inversores (batch)** | N/A (no soportado) | ~1,500,000 gas (~15k/inversor) |
| **Check en transfer** | ~8,000 gas | ~2,500 gas |
| **Enumerar whitelist** | ~500,000 gas (no paginado) | ~50,000 gas (paginado) |

**Conclusión:** `WhitelistFacet` reduce costos operativos en ~70% comparado con roles.

#### Storage Efficiency

**Opción 1 (Role):**
```solidity
// AccessControlStorage
struct RoleData {
    EnumerableSet.AddressSet members;  // 2 storage slots por miembro
    EnumerableSet.Bytes32Set didMembers;
    bytes32 adminRole;
}
```
- **Costo por miembro:** 2 slots (dirección + índice).
- **Total para 10,000 miembros:** 20,000 slots.

**Opción 2 (Facet):**
```solidity
// WhitelistStorage
struct WhitelistData {
    mapping(address => bool) isWhitelisted;      // 1 slot por miembro
    mapping(address => uint256) expirationTime;  // 1 slot (solo si tiene expiry)
    address[] whitelistedAddresses;              // N slots (solo si se requiere enumeration)
}
```
- **Costo por miembro (solo check):** 1 slot.
- **Total para 10,000 miembros:** 10,000 slots (~50% menos).

### 6.3. Separación de Responsabilidades

**Principio SOLID:** Single Responsibility Principle (SRP).

| Responsabilidad | Sistema de Roles | Whitelist Facet |
|-----------------|------------------|-----------------|
| **Permisos administrativos** | ✅ Correcto | ❌ No aplica |
| **Elegibilidad de inversores** | ❌ Uso indebido | ✅ Correcto |
| **Auditoría de gobernanza** | ✅ Roles otorgados/revocados | - |
| **Auditoría de compliance** | ❌ Mezclado con roles | ✅ Eventos específicos |

**Ejemplo de colisión conceptual:**
```solidity
// Con roles:
grantRole(WHITELISTED_ROLE, investor1);  // ¿Es un permiso administrativo?
grantRole(COMPLIANCE_ROLE, admin1);     // ¿O es un estado de elegibilidad?

// Con facet:
addToWhitelist(investor1);              // Clara: elegibilidad de compliance
grantRole(COMPLIANCE_ROLE, admin1);     // Clara: permiso administrativo
```

### 6.4. Funcionalidad Extensible

**Features requeridas por clientes reales:**

1. **Whitelist temporal:**
   ```solidity
   addToWhitelistWithExpiry(investor, block.timestamp + 365 days);
   ```

2. **Batch operations:**
   ```solidity
   addToWhitelistBatch([investor1, investor2, ..., investor100]);
   ```

3. **Categorización futura:**
   ```solidity
   enum InvestorCategory { RETAIL, ACCREDITED, INSTITUTIONAL }
   addToWhitelistWithCategory(investor, InvestorCategory.ACCREDITED);
   ```

4. **Enumeration paginada:**
   ```solidity
   getWhitelistedAddresses(offset: 0, limit: 100);  // Para auditorías
   ```

**Análisis:**
- **Opción 1 (Role):** Imposible implementar sin modificar `AccessControl` (core del sistema).
- **Opción 2 (Facet):** Todas las features son extensiones naturales del contrato.

### 6.5. Gas Efficiency

**Optimización en transferencias frecuentes:**

```solidity
// Opción 1: Role check
function hasRole(bytes32 role, address account) public view returns (bool) {
    return _roles[role].members.contains(account);  // EnumerableSet lookup: 2 SLOADs
}

// Opción 2: Whitelist check
function _isAccountWhitelisted(address account) internal view returns (bool) {
    WhitelistData storage ws = _whitelistStorage();
    
    if (!ws.isWhitelisted[account]) {  // 1 SLOAD
        return false;
    }
    
    uint256 expiry = ws.expirationTime[account];  // 1 SLOAD (solo si tiene expiry)
    if (expiry != 0 && block.timestamp > expiry) {
        return false;
    }
    
    return true;
}
```

**Resultado:** Whitelist facet es ~3x más eficiente en gas por transfer.

### 6.6. Mantenibilidad y Auditoría

**Trazabilidad de eventos:**

**Opción 1 (Role):**
```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
// Problema: Mezclado con eventos de MINTER_ROLE, COMPLIANCE_ROLE, etc.
```

**Opción 2 (Facet):**
```solidity
event AddedToWhitelist(address indexed account, uint256 expiresAt);
event RemovedFromWhitelist(address indexed account);
// Ventaja: Eventos específicos de compliance, fáciles de filtrar en auditorías.
```

**Queries para compliance officers:**
```javascript
// Con facet:
const whitelisted = await securityToken.getWhitelistedAddresses(0, 1000);
const count = await securityToken.getWhitelistedCount();

// Con role: Requiere iterar EnumerableSet off-chain (costoso).
```

---

## 7. Arquitectura de la Solución

### 7.1. Estructura de Archivos

```
contracts/tokens/extensions/whitelist/   # ← Extensión transversal
├── interfaces/
│   └── IWhitelist.sol                   # Interfaz pública (eventos, errores, métodos)
├── WhitelistInternal.sol                # Storage + helpers internos
├── Whitelist.sol                        # Lógica de negocio (add/remove/check)
└── WhitelistFacet.sol                   # Punto de entrada Diamond (introspección)
```

**Nota:** NO está en `contracts/tokens/erc3643/compliance/` porque no es específico de security tokens.

### 7.2. Storage Layout

```solidity
// WhitelistInternal.sol
struct WhitelistData {
    mapping(address => bool) isWhitelisted;           // Estado de whitelist
    mapping(address => uint256) expirationTime;       // Expiry opcional (0 = sin expiry)
    address[] whitelistedAddresses;                   // Enumeration
    mapping(address => uint256) addressToIndex;       // Para removal O(1)
}

bytes32 private constant WHITELIST_STORAGE_POSITION = 
    keccak256("isbe.whitelist.storage");
```

**Garantías de seguridad:**
- Storage slot aislado (`keccak256` hash único).
- No colisiona con `AccessControl`, `ERC20`, ni `ERC3643`.

### 7.3. Interfaz Pública

```solidity
interface IWhitelist {
    // Events
    event AddedToWhitelist(address indexed account, uint256 expiresAt);
    event RemovedFromWhitelist(address indexed account);
    event WhitelistCleared();

    // Errors
    error NotWhitelisted(address account);
    error AlreadyWhitelisted(address account);
    error WhitelistExpired(address account);

    // Core functions
    function addToWhitelist(address account) external;
    function addToWhitelistBatch(address[] calldata accounts) external;
    function removeFromWhitelist(address account) external;
    function isWhitelisted(address account) external view returns (bool);
    
    // Advanced (v2 opcional)
    function addToWhitelistWithExpiry(address account, uint256 expiresAt) external;
    function getWhitelistedCount() external view returns (uint256);
    function getWhitelistedAddresses(uint256 offset, uint256 limit) 
        external view returns (address[] memory);
}
```

### 7.4. Integración con ERC-3643

**Modificación en `ERC203643InternalCommon.sol`:**

```solidity
import {WhitelistInternal} from "../../tokens/whitelist/WhitelistInternal.sol";

abstract contract ERC203643InternalCommon is 
    ERC20Internal, 
    ERC3643ComplianceInternal,
    WhitelistInternal  // <-- Añadir herencia
{
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // 0. Whitelist check (fail fast - más eficiente)
        if (to != address(0) && !_isAccountWhitelisted(to)) {
            revert NotWhitelisted(to);
        }
        
        // 1. Compliance checks (MaxBalance, DailyMonthLimits)
        super._beforeTokenTransfer(from, to, amount);
        
        // 2. Freeze checks
        // ... resto del código existente
    }
}
```

**Nota:** El check de whitelist se coloca **primero** (fail fast) para minimizar gas en transferencias rechazadas.

---

## 8. Plan de Despliegue

### Fase 1: Desarrollo y Testing

**Tareas:**
1. ✅ Crear estructura de archivos (`interfaces/IWhitelist.sol`, `WhitelistInternal.sol`, etc.).
2. ✅ Implementar lógica de storage (add, remove, check, batch operations).
3. ✅ Escribir tests unitarios:
   - `addToWhitelist` / `removeFromWhitelist`.
   - `addToWhitelistBatch` (gas profiling).
   - Validación de expiración temporal.
   - Enumeration paginada.
4. ✅ Integrar con `ERC203643InternalCommon` (modificar `_beforeTokenTransfer`).
5. ✅ Tests de integración:
   - Transfers permitidos (whitelisted).
   - Transfers rechazados (no whitelisted).
   - Compatibility con otros compliance modules (MaxBalance, DailyMonthLimits).


**Entregable:** PR con implementación completa + tests + documentación.

### Fase 2: Registro en BusinessLogicFactory

**Tareas:**
1. Definir resolver key:
   ```typescript
   // config/constants/resolverKeys.ts
   export const WHITELIST_RESOLVER_KEY = keccak256('WHITELIST_RESOLVER_KEY');
   ```

2. Registrar en BusinessLogic definitions:
   ```typescript
   // tasks/deployment/constants/token/extensions/whitelist.ts
   export const WHITELIST_DEFINITION = {
       key: WHITELIST_RESOLVER_KEY,
       contractName: 'WhitelistFacet',
       artifactPath: 'contracts/tokens/extensions/whitelist/WhitelistFacet.sol',
       category: 'extension'  // NO 'compliance' - es extensión transversal
   };
   ```

3. Desplegar facet a red de pruebas:
   ```bash
   npx hardhat deployBusinessLogic \
     --network isbe_testnet \
     --business-id $(node -e "console.log(ethers.id('WHITELIST_RESOLVER_KEY'))") \
     --factory 0xBusinessLogicFactoryAddress \
     --bytecode-path ./artifacts/contracts/tokens/whitelist/WhitelistFacet.sol/WhitelistFacet.json
   ```

4. Verificar despliegue:
   ```bash
   npx hardhat getBusinessLogicAddress \
     --network isbe_testnet \
     --business-id $(node -e "console.log(ethers.id('WHITELIST_RESOLVER_KEY'))") \
     --version 1
   ```


**Entregable:** Facet desplegada y registrada en `BusinessLogicFactory`.

### Fase 3: Integración en Configuración SECURITY_TOKEN Existente

**Tareas:**
1. **Modificar** (no crear nueva) la configuración `SECURITY_TOKEN` existente:
   ```typescript
   // tasks/deployment/constants/token/erc3643_configurations.ts
   export const SECURITY_TOKEN = createTokenConfig(
       createERC3643Config([
           ERC20_RESOLVER_KEYS.ERC20,
           ERC20_RESOLVER_KEYS.SNAPSHOT,
           WHITELIST_RESOLVER_KEY,                    // <-- AÑADIR a config existente
           ERC3643_RESOLVER_KEYS.METADATA,
           ERC3643_RESOLVER_KEYS.FREEZE,
           ERC3643_RESOLVER_KEYS.RECOVERY,
           ERC3643_RESOLVER_KEYS.COMPLIANCE,
           ERC3643_RESOLVER_KEYS.COMPLIANCE_MAXBALANCE,
           ERC3643_RESOLVER_KEYS.COMPLIANCE_DMLIM,
       ]),
       'erc3643',
       'Security Token Standard'  // Descripción sin cambios
   );
   ```

2. **NO crear nuevas configuraciones**:
   - La extensión whitelist se activa automáticamente en todos los SECURITY_TOKEN.
   - Para ERC20/ERC721 básicos, whitelist se puede añadir vía `diamondCut` opcional.

3. Actualizar documentación:
   - Modificar entrada existente en `docs/deployments/token-configurations.md`.
   - Documentar que SECURITY_TOKEN ahora incluye whitelist por defecto.
   - Documentar cómo activar whitelist en ERC20_BASIC/ERC721_BASIC vía upgrade.

**Entregable:** `SECURITY_TOKEN` actualizado con whitelist incluido. NO se crean configuraciones nuevas.

### Fase 4: Activación en Proxies

**Escenario A: Nuevos proxies SECURITY_TOKEN**
Los clientes que creen security tokens a partir de esta versión tendrán whitelist habilitada automáticamente (incluida en configuración `SECURITY_TOKEN`).

**Escenario B: Proxies SECURITY_TOKEN existentes (upgrade)**
Security tokens ya desplegados pueden activar whitelist vía `diamondCut`.

**Escenario C: ERC20_BASIC / ERC721_BASIC (upgrade opcional)**
Tokens no-security pueden añadir whitelist si lo requieren (ej: NFT de galería privada, token de preventa).

**Procedimiento de upgrade (Escenarios B y C):**
1. Cliente solicita activación de whitelist vía Portal.
2. ISBE ejecuta `diamondCut`:
   ```javascript
   const whitelistFacetAddress = await factory.getBusinessLogicAddress(
       ethers.id('WHITELIST_RESOLVER_KEY'), 
       1
   );
   
   const cut = [{
       facetAddress: whitelistFacetAddress,
       action: 0, // Add
       functionSelectors: [
           ethers.id("addToWhitelist(address)").slice(0, 10),
           ethers.id("addToWhitelistBatch(address[])").slice(0, 10),
           ethers.id("removeFromWhitelist(address)").slice(0, 10),
           ethers.id("isWhitelisted(address)").slice(0, 10),
           ethers.id("getWhitelistedCount()").slice(0, 10),
           ethers.id("getWhitelistedAddresses(uint256,uint256)").slice(0, 10),
       ]
   }];
   
   await proxy.diamondCut(cut, whitelistFacetAddress, 
       whitelistFacetAddress.interface.encodeFunctionData("initializeWhitelist"));
   ```

3. ISBE añade inversores iniciales:
   ```javascript
   await proxy.addToWhitelistBatch([investor1, investor2, ..., investorN]);
   ```

---

## 9. Casos de Uso

### Caso 1: Security Token con KYC Obligatorio

**Requisito:** Solo inversores que hayan pasado KYC pueden poseer tokens.

**Flujo:**
1. Cliente despliega token con configuración `SECURITY_TOKEN_WHITELISTED`.
2. Sistema de KYC externo valida inversores.
3. Backend de cliente llama `addToWhitelistBatch(investoresAprobados)`.
4. Transfers solo funcionan para direcciones whitelisted.

**Código:**
```javascript
// Emisor añade inversores aprobados
await securityToken.addToWhitelistBatch([
    "0xInvestor1...", 
    "0xInvestor2...", 
    // ... hasta 100 por transacción
]);

// Transfer permitido
await securityToken.transfer("0xInvestor1...", ethers.parseEther("1000"));  // ✅

// Transfer rechazado
await securityToken.transfer("0xRandomAddress...", ethers.parseEther("1000"));  // ❌ Revert: NotWhitelisted
```

### Caso 2: Whitelist con Expiración (Accredited Investors)

**Requisito:** Inversores acreditados tienen acceso temporal (renovación anual).

**Flujo:**
```javascript
// Añadir con expiry de 1 año
const oneYear = 365 * 24 * 60 * 60;
await securityToken.addToWhitelistWithExpiry(
    "0xInvestor...", 
    Math.floor(Date.now() / 1000) + oneYear
);

// Después de 1 año, el inversor debe renovar su acreditación
// Las transferencias fallarán automáticamente si no se renueva
```

### Caso 3: Auditoría de Compliance

**Requisito:** Regulador solicita lista de inversores autorizados.

**Código:**
```javascript
// Obtener total de inversores whitelisted
const total = await securityToken.getWhitelistedCount();

// Obtener lista paginada (evita out-of-gas)
const investors = await securityToken.getWhitelistedAddresses(0, 1000);

// Exportar a CSV para auditoría
console.log("Total investors:", total);
console.log("Sample investors:", investors.slice(0, 10));
```

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Colisión de storage slots** | Baja | Crítico | Usar `keccak256` hash único para storage position. Tests exhaustivos pre-deploy. |
| **Gas cost excesivo en batch operations** | Media | Medio | Limitar batch size a 100-200 direcciones por transacción. Implementar chunking en frontend. |
| **Incompatibilidad con compliance modules existentes** | Baja | Alto | Tests de integración con `MaxBalance`, `DailyMonthLimits`. Validar orden de checks en `_beforeTokenTransfer`. |
| **Error en lógica de expiración** | Media | Alto | Tests con diferentes timestamps. Fuzzing con Echidna. |
| **Bypass accidental de whitelist** | Baja | Crítico | Auditoría de código. Verificar que **todos** los paths de transferencia pasen por `_beforeTokenTransfer`. |

---

## 11. Métricas de Éxito

| Métrica | Target | Medición |
|---------|--------|----------|
| **Gas cost por transfer (con whitelist)** | < 5,000 gas overhead | Gas profiling en tests |
| **Gas cost batch add (100 inversores)** | < 2,000,000 gas total | Gas profiling |
| **Tiempo de deployment** | < 2 meses desde aprobación | Project tracking |
| **Adopción por clientes** | 5+ tokens usando whitelist en 6 meses | Analytics dashboard |
| **Bugs críticos post-deploy** | 0 | Incident tracking |

---

## 12. Referencias

- **ADR_009:** Modularización de ICompliance en arquitectura Diamond ERC-3643.
- **ERC-3643 Specification:** [https://eips.ethereum.org/EIPS/eip-3643](https://eips.ethereum.org/EIPS/eip-3643)
- **EIP-2535 (Diamond Standard):** [https://eips.ethereum.org/EIPS/eip-2535](https://eips.ethereum.org/EIPS/eip-2535)
- **ISBE Architecture Documentation:** `docs/Diamond-pattern-guidelines.md`
- **Tokeny T-REX Implementation:** [https://github.com/TokenySolutions/T-REX](https://github.com/TokenySolutions/T-REX)

---

**Autor:** ISBE Architecture Team  
**Fecha:** 20 de Noviembre de 2025  
**Versión:** 1.0  
**Estado:** Propuesta
