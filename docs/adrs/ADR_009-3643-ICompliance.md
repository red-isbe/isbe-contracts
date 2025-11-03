# ADR_YYY: Modularización de ICompliance en arquitectura Diamond ERC-3643

## Tabla de contenidos
1. Status
2. Contexto y visión Tokeny
3. Decisión ISBE Diamond
    3.1. Arquitectura y orquestación interna
    3.2. Modularidad y gestión de features
    3.3. Roles y control
    3.4. Métodos expuestos
4. Ejemplo de inicialización de features
5. Beneficios

---

## 1. Status

Finished

## 2. Contexto y visión Tokeny

El estándar ERC-3643 define la interfaz ICompliance para la gestión de cumplimiento regulatorio. Tokeny ofrece dos enfoques principales:
- **Legacy**: Contrato monolítico, binding a un token, gestión de agentes y features por herencia.
- **Modular**: Contrato principal + módulos independientes, owner añade/quita módulos dinámicamente, validación recorre todos los módulos activos.

Ambos modelos dependen de binding externo y gestión de features por herencia o composición.

## 3. Decisión ISBE Diamond

### 3.1. Arquitectura y orquestación interna

- El contrato `ERC3643ComplianceInternal` es el núcleo que organiza y orquesta la lógica de compliance.
- Cada feature de compliance está implementada como un contrato interno (`FeatureInternal`) que gestiona su propio almacenamiento, lógica y hooks de validación.
- `ERC3643ComplianceInternal` mantiene los flags de activación y llama a los métodos de cada `FeatureInternal` según corresponda.
- El contrato común (`ERC203643InternalCommon`) implementa los hooks de transferencia, mint y burn, y delega la validación de compliance a `ERC3643ComplianceInternal`.
- Para inicialización y administración, cada feature puede tener contratos externos (por ejemplo, facets Diamond) que exponen la API pública y los métodos de inicialización, pero la lógica y el estado viven en los contratos internos.
- El flujo es:
    1. `ERC203643InternalCommon` llama a los hooks internos en cada operación (`_beforeTokenTransfer`, `_handleMintOperation`, `_handleBurnOperation`, `_handleTransferOperation`).
    2. Dentro de estos hooks, delega las validaciones de compliance a los métodos (`_canTransfer`, `_created`, `_destroyed`, `_transferred`) definidos en `ERC3643ComplianceInternal`.
    3. `ERC3643ComplianceInternal` consulta los flags de activación y ejecuta las validaciones de cada `FeatureInternal` activa (MaxBalance, DailyMonthLimits, etc.).
- Así, la lógica de compliance está centralizada y orquestada en `ERC3643ComplianceInternal`, mientras que el contrato común solo asegura que se invoquen los hooks en el momento correcto.

#### Pseudocódigo del proceso
```solidity
// En ERC203643InternalCommon
function _handleTransferOperation(_from, _to, _amount) internal {
    // ...actualizaciones de snapshot y freeze...
    if (!_hasRole(_COMPLIANCE_ROLE, msg.sender)) {
        require(_canTransfer(_from, _to, _amount), ...);
        _transferred(_from, _to, _amount);
    }
    // ...lógica de freeze y forced transfer...
}

// En ERC3643ComplianceInternal
function _canTransfer(_from, _to, _amount) internal view returns (bool) {
    if (_isMaxBalanceEnabled() && !_complianceCheckOnMaxBalance(_to, _amount)) return false;
    if (_isDailyMonthLimitsEnabled() && !_complianceCheckOnDayMonthLimits(_from, _amount)) return false;
    return true;
}
```

### 3.2. Modularidad y gestión de features

- La arquitectura Diamond permite añadir tantos módulos de compliance como se requiera, cada uno controlado por flags.
- Actualmente están implementados:
    - **MaxBalance**: Limita el balance máximo por usuario. Activable/desactivable por el compliance role.
    - **DailyMonthLimits**: Limita el volumen diario y mensual de transferencias por usuario. Activable/desactivable por el compliance role.
- Cada feature de compliance en ISBE Diamond se compone de:
    - Un contrato interno (`Internal`), que gestiona el almacenamiento, lógica y hooks de validación.
    - Un facet externo, que expone la API pública y la inicialización protegida por clave de resolución.
- Ejemplo:
    - **MaxBalance**
        - `ERC3643ComplianceMaxBalInternal`: gestiona el storage y la lógica de validación del balance máximo.
        - `ERC3643ComplianceMaxBalanceFacet`: expone la inicialización (`initializeERC3643ComplianceMaxBalance`) y métodos administrativos.
    - **DailyMonthLimits**
        - `ERC3643ComplianceDMLimInternal`: gestiona storage, contadores y lógica de límites diarios/mensuales.
        - `ERC3643ComplianceDMLimFacet`: expone la inicialización (`initializeERC3643ComplianceDMLim`) y métodos administrativos.
- Cada módulo expone su propia interfaz administrativa y de consulta, y puede ser extendido o desactivado sin afectar al resto del sistema. Para añadir un nuevo módulo, basta con crear los contratos correspondientes y su flag de activación.

### 3.3. Roles y control

- El rol **COMPLIANCE_ROLE** permite a los operadores autorizados:
    - Activar/desactivar cualquier módulo de compliance.
    - Modificar los parámetros de los módulos (ejemplo: cambiar el max balance, los límites diarios/mensuales, etc.).
    - Bypassear todas las validaciones de compliance: cualquier operación realizada por una cuenta con COMPLIANCE_ROLE no está sujeta a los checks de los módulos activos.
- Este diseño permite una gestión granular y flexible, asegurando que los administradores puedan intervenir en situaciones excepcionales o de mantenimiento sin restricciones operativas.

### 3.4. Métodos expuestos

- El método `canTransfer` sí se expone externamente para permitir a integradores y usuarios consultar si una operación cumpliría las reglas de compliance antes de ejecutarla.
- El resto de métodos de validación (`transferred`, `created`, `destroyed`) se utilizan internamente en el core y los contratos internos de compliance, como parte del flujo de validación y orquestación.
- La interacción externa para inicialización y administración de parámetros se realiza a través de los contratos externos/facets específicos de cada feature, pero la lógica de compliance y los hooks permanecen encapsulados en los contratos internos.
- Añadir una nueva regla solo requiere crear una nueva feature interna y su flag de activación, integrándola en el flujo de validación centralizado.
- No es necesario el binding on-chain tradicional ni contratos externos para reglas. Todo el estado y lógica viven dentro del Diamond, lo que simplifica la gestión y evita colisiones de selectors.

## 4. Ejemplo de inicialización de features

```solidity
// Inicialización de MaxBalance
function initializeERC3643ComplianceMaxBalance(uint256 _maxBalance)
    external
    initializer(_ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY)
{
    _initializeMaxBalance(_maxBalance);
    emit MaxBalanceSet(_maxBalance);
}

// Inicialización de DailyMonthLimits
function initializeERC3643ComplianceDMLim(uint256 _dailyLimit, uint256 _monthlyLimit)
    external
    initializer(_ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY)
{
    _initializeDMLim(_dailyLimit, _monthlyLimit);
    emit DayMonthLimitsSet(_dailyLimit, _monthlyLimit);
}
```

De este modo, cada módulo puede ser inicializado y gestionado de forma independiente, manteniendo la modularidad y la extensibilidad del sistema.

## 5. Beneficios
- Centralización y simplificación de la lógica de compliance.
- Activación dinámica de features sin redeploy ni binding externo.
- Mayor granularidad y control por roles.
- Compatibilidad total con Diamond y ERC-3643.

