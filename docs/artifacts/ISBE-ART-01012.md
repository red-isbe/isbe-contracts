# ISBE-ART-01012 — Token ERC‑3643 (contracts/tokens/erc3643)

---

## 1. Identificación del Artefacto

| Campo                       | Valor                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del artefacto**    | ISBE-ART-01012 — Token ERC‑3643 (contracts/tokens/erc3643)                                                                                                        |
| **Origen**                  | Documento derivado del repositorio oficial de Smart Contracts, consolidando información técnica sobre la implementación del módulo de metadatos ERC‑3643 en ISBE. |
| **Estado**                  | Validado                                                                                                                                                          |
| **Versión del documento**   | 0.1.0                                                                                                                                                             |
| **Fecha**                   | 2025-08-26                                                                                                                                                        |
| **Repositorio (congelado)** | [https://github.com/alastria/isbe-contracts](https://github.com/alastria/isbe-contracts)                                                                          |
| **Commit**                  | `feat/token/3643`                                                                                                                                                 |

---

## 2. Propósito del Artefacto

### Objetivo funcional:

Definir las interfaces, comportamientos y mecanismos de control asociados al **módulo ERC‑3643 Metadata** en la arquitectura ISBE, garantizando gestión estandarizada de metadatos para tokens de seguridad, incluyendo nombre, símbolo, versión e identidad onchain con cumplimiento normativo.

### Beneficio para ISBE:

- **Gestión de metadatos estandarizada**: Soporte completo para información de tokens de seguridad según ERC‑3643.
- **Interoperabilidad**: Compatible con sistemas de tokens de seguridad y plataformas europeas como EBSI.
- **Cumplimiento regulatorio**: Facilita el cumplimiento de **eIDAS2**, **NIS2** y **RGPD** mediante controles de acceso, gestión de identidad onchain y trazabilidad completa.
- **Flexibilidad operativa**: Integración fluida con módulos ERC‑20 y sistema de gobernanza ISBE mediante arquitectura Diamond (EIP‑2535).

### Stakeholders clave:

- Equipos técnicos de desarrollo y operaciones.
- Auditores de seguridad y cumplimiento.
- Órganos de gobernanza técnica.
- Emisores de tokens de seguridad y entidades reguladas.
- Entidades reguladoras y organismos de control financiero.

---

## 3. Alcance y Ciclo de Vida

### Fases cubiertas:

✅ **Definición**: Descripción funcional de interfaces, eventos y gestión de metadatos.  
✅ **Desarrollo**: Especificación de flujos, permisos y validaciones implementadas.  
✅ **Validación**: Pruebas unitarias completas con 100% de cobertura.  
🟡 **Mantenimiento**: Actualización alineada con evoluciones del estándar ERC‑3643 y normativas.

### Inicio de fases y paquetes relacionados:

- Pertenece al **PT1 (Diseño y desarrollo del cliente ISBE)**, Tarea **T1.4 (Desarrollo de artefactos)**.
- Módulo base: `contracts/tokens/erc3643/token/erc3643metadata`.

### Dependencias:

- Contratos base: (AccessControl, Pausable, Context).
- Módulos ISBE: ERC‑20 (integración requerida), AccessControl, Pause.
- Estándares EVM: ERC‑3643 (Security Token), EIP‑2535 (Diamond Standard), ERC‑165 (introspección).
- Arquitectura Diamond: IsbeProxy, facetas modulares.

### Mantenimiento:

- Revisión anual o ante cambios en estándares de tokens de seguridad.
- Actualización de extensiones según necesidades regulatorias (ej. nuevos campos de metadatos).

---

## 4. Definición del Artefacto

### 4.1. Artefacto de arquitectura de referencia

El módulo ERC‑3643 Metadata en ISBE sigue un diseño modular basado en **arquitectura Diamond (EIP‑2535)** y **extensiones estandarizadas**, permitiendo una implementación segura, auditada y adaptable para tokens de seguridad.

- **Base**: `IERC3643Metadata` para funcionalidad de metadatos de tokens de seguridad.
- **Componentes principales**:
    - `ERC3643Metadata.sol`: Contrato principal con lógica de negocio.
    - `ERC3643MetadataFacet.sol`: Faceta Diamond para integración con proxy.
    - `ERC3643MetadataInternal.sol`: Funciones internas y gestión de almacenamiento.
    - `IERC3643Metadata.sol`: Definición de interfaz estándar.

> ✅ **Nota**: Implementación completa y probada con cobertura del 100% en el commit actual.

---

### 4.2. Trazabilidad

Este artefacto se alinea con:

- **ENT_1 – Evaluación de necesidades** (30/06/2025): Requisitos de trazabilidad, gobernanza y cumplimiento para tokens de seguridad.
- **ENT_2 – Análisis de requerimientos** (30/06/2025): Requisito 2.6 (actualización modular), 6.1 (control de cambios).
- **Arquitectura de Referencia de ISBE**: Epígrafe 5.6.3 (definición de proxies) y 18.2 (requisitos regulatorios).

Para trazabilidad fina, cada función está vinculada con casos de uso específicos de tokens de seguridad y cumplimiento normativo.

---

## 5. Especificación Funcional

### 5.1. Interfaces soportadas

#### IERC3643Metadata

```solidity
interface IERC3643Metadata {
    /**
     * @notice Inicializa los metadatos del token ERC3643
     * @param _onchainID Dirección de la identidad onchain del token
     * @param _version Versión del contrato del token
     */
    function initializeERC3643Metadata(
        address _onchainID,
        string memory _version
    ) external;

    /**
     * @notice Establece el nombre del token
     * @param _name Nuevo nombre del token
     */
    function setName(string memory _name) external;

    /**
     * @notice Establece el símbolo del token
     * @param _symbol Nuevo símbolo del token
     */
    function setSymbol(string memory _symbol) external;

    /**
     * @notice Establece la identidad onchain del token
     * @param _onchainID Nueva dirección de identidad onchain
     */
    function setOnchainID(address _onchainID) external;

    /**
     * @notice Obtiene la identidad onchain del token
     * @return Dirección de la identidad onchain
     */
    function onchainID() external view returns (address);

    /**
     * @notice Obtiene la versión del token
     * @return Versión del contrato del token
     */
    function version() external view returns (string memory);

    /**
     * @notice Evento emitido cuando se actualiza información del token
     * @param name Nombre del token
     * @param symbol Símbolo del token
     * @param decimals Decimales del token
     * @param version Versión del token
     * @param onchainID Identidad onchain del token
     */
    event UpdatedTokenInformation(
        string indexed name,
        string indexed symbol,
        uint8 indexed decimals,
        string version,
        address onchainID
    );
}
```

#### ID de Interfaz

```solidity
// IERC3643Metadata interface ID (calculado con 6 funciones de negocio)
bytes4 constant IERC3643_METADATA_INTERFACE_ID = 0x63f4e1b1;
```

---

### 5.2. Funciones principales

#### Funciones de gestión de metadatos

| Función                                     | Selector     | Descripción                    | Permisos            |
| ------------------------------------------- | ------------ | ------------------------------ | ------------------- |
| `initializeERC3643Metadata(address,string)` | `0x2428f215` | Inicializa metadatos del token | Solo inicialización |
| `setName(string)`                           | `0xc47f0027` | Actualiza nombre del token     | Propietario         |
| `setSymbol(string)`                         | `0xb84c8246` | Actualiza símbolo del token    | Propietario         |
| `setOnchainID(address)`                     | `0x94bc2db4` | Actualiza identidad onchain    | Propietario         |
| `onchainID()`                               | `0x7b103999` | Consulta identidad onchain     | Público             |
| `version()`                                 | `0x54fd4d50` | Consulta versión del token     | Público             |

#### Validaciones implementadas

- **Validación de cadenas vacías**: Los campos `name`, `symbol` y `version` no pueden estar vacíos.
- **Validación de inicialización**: Previene re-inicialización del contrato.
- **Validación de dirección cero**: El campo `onchainID` acepta dirección cero para operaciones de reset.
- **Control de acceso**: Solo el propietario puede realizar actualizaciones de metadatos.

---

### 5.3. Eventos

#### UpdatedTokenInformation

```solidity
event UpdatedTokenInformation(
    string indexed name,
    string indexed symbol,
    uint8 indexed decimals,
    string version,
    address onchainID
);
```

**Descripción**: Emitido cada vez que se actualiza cualquier metadato del token.

**Parámetros**:

- `name` (indexed): Nombre actual del token
- `symbol` (indexed): Símbolo actual del token
- `decimals` (indexed): Decimales del token (heredado de ERC20)
- `version`: Versión actual del contrato
- `onchainID`: Dirección de identidad onchain actual

**Casos de emisión**:

- Durante la inicialización con `initializeERC3643Metadata`
- Al actualizar nombre con `setName`
- Al actualizar símbolo con `setSymbol`
- Al actualizar identidad onchain con `setOnchainID`

---

### 5.4. Errores definidos

```solidity
// Errores heredados de ISBEContext
error EmptyString();
error ContractIsAlreadyInitialized();
error AccountHasNoRole(address account, bytes32 role);
error IsPaused();
```

**Gestión de errores**:

- `EmptyString()`: Lanzado cuando se intenta establecer campos críticos vacíos
- `ContractIsAlreadyInitialized()`: Lanzado en intentos de re-inicialización
- `AccountHasNoRole(address,bytes32)`: Lanzado cuando una cuenta sin permisos intenta operaciones restringidas
- `IsPaused()`: Lanzado cuando se intenta operar en estado de pausa

---

## 6. Consideraciones de Seguridad

### 6.1. Control de acceso

#### Roles y permisos

| Rol                | Descripción           | Funciones permitidas                          |
| ------------------ | --------------------- | --------------------------------------------- |
| `TOKEN_OWNER_ROLE` | Propietario del token | Todas las funciones de gestión de metadatos   |
| `PAUSER_ROLE`      | Pausador del sistema  | Activar/desactivar pausa (si está habilitada) |

#### Validaciones de seguridad

- **Autenticación**: Todas las funciones de escritura verifican roles antes de ejecutarse.
- **Autorización**: Control granular por función según roles específicos.
- **Auditabilidad**: Eventos completos para trazabilidad de cambios.

### 6.2. Protecciones implementadas

#### Validación de entrada

- Verificación de cadenas no vacías para campos críticos
- Manejo seguro de dirección cero en `onchainID`
- Validación de estado de inicialización

#### Protección contra ataques

- **Re-entrancy**: No aplicable (funciones sin transferencias externas)
- **Overflow/Underflow**: No aplicable (sin operaciones aritméticas)
- **DoS**: Funciones con complejidad O(1) constante

#### Integración con pausa de emergencia

- Respeto al estado de pausa global del sistema
- Bloqueo de operaciones durante emergencias
- Mantenimiento de funciones de consulta durante pausa

---

## 7. Pruebas y Validación

### 7.1. Cobertura de pruebas

#### Suite de pruebas: `test/ERC3643.spec.ts`

**Estadísticas de cobertura**:

- ✅ **Cobertura de líneas**: 100%
- ✅ **Cobertura de funciones**: 100%
- ✅ **Cobertura de declaraciones**: 100%
- ✅ **Cobertura de ramas**: 100%

#### Categorías de pruebas implementadas

| Categoría                      | Descripción                      | Pruebas           |
| ------------------------------ | -------------------------------- | ----------------- |
| **Despliegue**                 | Validación de inicialización     | 3 pruebas         |
| **Funcionalidad**              | Operaciones de metadatos         | 5 pruebas         |
| **Control de acceso**          | Validación de permisos           | 4 pruebas         |
| **Validación de casos límite** | Cadenas vacías, direcciones cero | 5 pruebas         |
| **Eventos**                    | Verificación de emisión          | 3 pruebas         |
| **Integración**                | Interacción con ERC20            | Incluido en todas |

### 7.2. Casos de prueba críticos

#### Inicialización y re-inicialización

```typescript
// Inicialización exitosa
it(
    'GIVEN ERC3643 Metadata Facet WHEN initialized THEN it should have correct initial values'
)

// Prevención de re-inicialización
it(
    'GIVEN ERC3643 Metadata Facet WHEN already initialized THEN it should reject re-initialization'
)
```

#### Validación de entrada

```typescript
// Rechazo de cadenas vacías
it(
    'GIVEN ERC3643 Metadata WHEN setName called with empty string THEN it should revert with EmptyString'
)
it(
    'GIVEN ERC3643 Metadata WHEN setSymbol called with empty string THEN it should revert with EmptyString'
)

// Aceptación de dirección cero
it(
    'GIVEN ERC3643 Metadata WHEN setOnchainID called with zero address THEN it should succeed'
)
```

#### Control de acceso

```typescript
// Validación de permisos
it(
    'GIVEN ERC3643 Metadata WHEN non-owner tries to update onchainID THEN it should revert'
)
it(
    'GIVEN ERC3643 Metadata WHEN owner updates parameters THEN it should succeed'
)
```

#### Emisión de eventos

```typescript
// Verificación completa de parámetros
it(
    'GIVEN ERC3643 Metadata WHEN onchainID is updated THEN it should emit UpdatedTokenInformation event'
)
```

---

## 8. Limitaciones y Consideraciones Futuras

### 8.1. Limitaciones actuales

#### Limitaciones funcionales

- **Campos de metadatos fijos**: Solo soporta name, symbol, version y onchainID
- **Versión inmutable**: La versión no puede actualizarse después de la inicialización
- **Dependencia ERC20**: Requiere integración completa con módulos ERC20

#### Limitaciones técnicas

- **Funciones de introspección**: No disponibles a través del proxy (comentadas en pruebas)
- **Metadatos extendidos**: No soporta campos adicionales personalizados
- **Multiidioma**: No hay soporte nativo para metadatos en múltiples idiomas

### 8.2. Mejoras futuras planificadas

#### Extensiones de funcionalidad

- **Metadatos extendidos**: Soporte para campos adicionales configurables
- **Versionado dinámico**: Capacidad de actualizar versión con validaciones
- **Metadatos multiidioma**: Soporte para nombres y descripciones en múltiples idiomas

#### Mejoras técnicas

- **Funciones de introspección**: Habilitación completa de capacidades Diamond
- **Validación avanzada**: Reglas de negocio más sofisticadas para metadatos
- **Integración IPFS**: Soporte para almacenamiento descentralizado de metadatos extendidos

#### Consideraciones regulatorias

- **Cumplimiento ampliado**: Adaptación a nuevos requisitos de tokens de seguridad
- **Auditoría mejorada**: Capacidades de reporte y monitoreo avanzadas
- **Interoperabilidad regulatoria**: Integración con sistemas de cumplimiento externos

---

## 9. Referencias y Documentación

### 9.1. Estándares y especificaciones

- **[ERC-3643](https://eips.ethereum.org/EIPS/eip-3643)**: Security Token Standard
- **[EIP-2535](https://eips.ethereum.org/EIPS/eip-2535)**: Diamond Standard para arquitectura modular
- **[ERC-165](https://eips.ethereum.org/EIPS/eip-165)**: Standard Interface Detection
- **[ERC-20](https://eips.ethereum.org/EIPS/eip-20)**: Token Standard (dependencia)

### 9.2. Implementación y código

#### Ubicaciones en el repositorio

```
contracts/tokens/erc3643/token/erc3643metadata/
├── ERC3643Metadata.sol              # Lógica principal
├── ERC3643MetadataFacet.sol         # Faceta Diamond
├── ERC3643MetadataInternal.sol      # Funciones internas
└── interfaces/
    └── IERC3643Metadata.sol         # Definición de interfaz
```

#### Archivos de prueba

```
test/
├── ERC3643.spec.ts                  # Suite de pruebas principal
├── initialization.ts               # Configuración de despliegue
└── constants.ts                     # Constantes y roles
```

### 9.3. Configuración de despliegue

#### Configuración ERC3643

```typescript
// Configuración de facetas para casos de uso ERC3643
export const CONFIGURATION_ID_ERC3643 = [
    ERC20SnapshotFacet, // Snapshot de balances
    ERC20BurnableFacet, // Quema de tokens
    ERC20CappedFacet, // Límite de suministro
    ERC20ControllerFacet, // Control de transferencias
    ERC20Facet, // Funcionalidad ERC20 base
    ERC3643MetadataFacet, // Metadatos ERC3643
]
```

#### Claves de resolución

```typescript
export const ERC3643_METADATA_RESOLVER_KEY = keccak256(
    'ERC3643_METADATA_RESOLVER_KEY'
)
export const TOKEN_OWNER_ROLE = keccak256('TOKEN_OWNER_ROLE')
```

---

## 10. Conclusiones

### 10.1. Resumen ejecutivo

El módulo ERC3643 Metadata representa una implementación completa y robusta para la gestión de metadatos de tokens de seguridad dentro de la arquitectura ISBE. La implementación:

- ✅ **Cumple completamente** con el estándar ERC-3643 para tokens de seguridad
- ✅ **Integra perfectamente** con la arquitectura Diamond (EIP-2535) de ISBE
- ✅ **Proporciona cobertura completa** de pruebas (100%) con validación exhaustiva
- ✅ **Implementa controles de seguridad** robustos con gestión de roles y validaciones

### 10.2. Impacto en la plataforma ISBE

#### Beneficios técnicos

- **Modularidad**: Arquitectura pluggable que permite actualizaciones sin afectar otros módulos
- **Interoperabilidad**: Compatibilidad nativa con estándares de tokens de seguridad
- **Mantenibilidad**: Código bien estructurado con separación clara de responsabilidades
- **Testabilidad**: Suite de pruebas exhaustiva que garantiza confiabilidad

#### Beneficios de negocio

- **Cumplimiento regulatorio**: Facilita el cumplimiento de normativas europeas (eIDAS2, NIS2)
- **Escalabilidad**: Arquitectura preparada para futuras extensiones y mejoras
- **Transparencia**: Trazabilidad completa de cambios mediante eventos auditables
- **Flexibilidad**: Soporte para diversos casos de uso de tokens de seguridad

---
