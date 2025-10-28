# ADR_004: Modularización de ICompliance Interface en arquitectura 3643

# Tabla de contenidos

- [Status](#status)
- [Contexto](#contexto)
- [Análisis de implementaciones Tokeny](#análisis-de-implementaciones-tokeny)
    - [Legacy Implementation](#legacy-implementation)
    - [Features de muestra](#features-de-muestra)
    - [Métodos internos comunes y flujo de validación](#métodos-internos-comunes-y-flujo-de-validación)
    - [Ejemplo de implementación de compliance](#ejemplo-de-implementación-de-compliance)
- [Decisión](#decisión)
- [Beneficios](#beneficios)
- [Fases de implementación](#fases-de-implementación)

## Status

En progreso

## Contexto

El estándar ERC-3643 define la interfaz **ICompliance** para gestión de cumplimiento regulatorio. Tokeny proporciona dos implementaciones:

- **Legacy**: Monolítica usando herencia tradicional
- **Modular**: Basada en módulos independientes y composición

Nuestra arquitectura Diamond (EIP-2535) requiere una aproximación diferente que combine la funcionalidad de ambas implementaciones pero adaptada a facetas.

## Análisis de implementaciones Tokeny

### 1. Legacy Implementation

#### ICompliance (interfaz principal)

- Define los métodos obligatorios para cualquier contrato de compliance:
    - `canTransfer(address from, address to, uint256 value)`: Valida si una transferencia está permitida.
    - `transferred(address from, address to, uint256 value)`: Hook llamado tras una transferencia.
    - `created(address to, uint256 value)`: Hook llamado tras un mint.
    - `destroyed(address from, uint256 value)`: Hook llamado tras un burn.
    - Otros métodos auxiliares para gestión de binding, agentes, etc.

#### Implementaciones principales

##### BasicCompliance (abstracta)

- Hereda de `ICompliance` y de `AgentRole`.
- Permite vincular un único token al contrato de compliance (`IToken public tokenBound`).
- Binding seguro: solo el owner o el propio token pueden llamar a `bindToken` si no hay token vinculado.
- `unbindToken` solo puede ser llamado por el owner o el token vinculado.
- Incluye gestión de agentes mediante un mapping privado (`_tokenAgentsList`), aunque estos métodos están deprecados y la gestión de agentes se delega preferentemente al propio token usando el rol `AgentRole`.
- Modificadores de acceso:
    - `onlyToken()`: Solo el token vinculado puede llamar ciertas funciones.
    - `onlyAdmin()`: Solo el owner del compliance o agentes del token pueden llamar ciertas funciones.
- Helpers internos:
    - `_getIdentity(address)`: Obtiene la identidad on-chain del usuario desde el IdentityRegistry del token vinculado.
    - `_getCountry(address)`: Obtiene el país del usuario desde el IdentityRegistry del token vinculado.
- Los métodos de hooks (`transferred`, `created`, `destroyed`) y validación (`canTransfer`) están definidos en la interfaz pero no implementan lógica en esta clase abstracta.

##### DefaultCompliance

- Extiende `BasicCompliance` y proporciona una implementación permisiva.
- Los métodos `transferred`, `created`, y `destroyed` están definidos pero no ejecutan ninguna lógica (funciones vacías).
- El método `canTransfer` siempre devuelve `true`, permitiendo cualquier transferencia sin restricciones.
- Sirve como plantilla base para despliegues iniciales, pruebas, o tokens que no requieren reglas regulatorias estrictas.
- En la práctica, `DefaultCompliance` suele ser sustituido por contratos concretos de compliance que heredan y combinan features específicas, como los ejemplos de features listados a continuación.

##### FeatureCompliance

1. **Features de muestra:**  
   Las principales features de compliance legacy que Tokeny proporciona como ejemplo son:
    - **ApproveTransfer**: Requiere aprobación previa para cada transferencia.
    - **CountryRestrictions**: Bloquea transferencias a países restringidos (blacklist).
    - **CountryWhitelisting**: Solo permite transferencias a países permitidos (whitelist).
    - **DayMonthLimits**: Limita el volumen de transferencias diarias y mensuales por usuario.
    - **ExchangeMonthlyLimits**: Limita el volumen mensual de depósitos en exchanges específicos.
    - **MaxBalance**: Limita el balance máximo que puede tener un usuario.
    - **SupplyLimit**: Limita el suministro total de tokens.

2. **Lógica interna de features:**  
   Cada feature implementa:
    - Un método de validación principal, típicamente llamado `complianceCheckOnFeature`, que se utiliza en la implementación de `canTransfer` del contrato de compliance concreto. Este método solo realiza la comprobación de la regla específica y no actualiza el estado.
    - Métodos internos de acción, invocados por los hooks del contrato principal de compliance:
        - `_transferActionOnFeature(address from, address to, uint256 value)`: Acción tras transferencia.
        - `_creationActionOnFeature(address to, uint256 value)`: Acción tras mint.
        - `_destructionActionOnFeature(address from, uint256 value)`: Acción tras burn.
    - Estos métodos internos pueden estar vacíos si la feature no requiere actualizar estado tras el evento.

    **Ejemplo de lógica interna:**
    - **CountryRestrictions**
        - `complianceCheckOnCountryRestrictions`: Devuelve `false` si el país del destinatario está en la blacklist, `true` en caso contrario.
        - Métodos internos de acción: Vacíos, no realizan ninguna acción tras transfer, mint o burn.

    - **MaxBalance**
        - `complianceCheckOnMaxBalance`: Devuelve `false` si el destinatario supera el balance máximo tras la transferencia o mint, `true` en caso contrario.
        - Métodos internos de acción:
            - `_transferActionOnMaxBalance`: Actualiza el balance ONCHAINID de ambos usuarios tras la transferencia.
            - `_creationActionOnMaxBalance`: Suma el balance ONCHAINID del destinatario tras el mint.
            - `_destructionActionOnMaxBalance`: Resta el balance ONCHAINID del usuario tras el burn.

#### Ejemplo de implementación de compliance

Para desplegar un contrato de compliance concreto, se heredan las features deseadas y se sobrescriben los métodos de la interfaz principal (`canTransfer`, `transferred`, `created`, `destroyed`) para coordinar la lógica de todas las features.

```solidity
contract CustomCompliance is CountryRestrictions, MaxBalance {
    function transferred(
        address _from,
        address _to,
        uint256 _value
    ) external override onlyToken {
        _transferActionOnCountryRestrictions(_from, _to, _value);
        _transferActionOnMaxBalance(_from, _to, _value);
    }

    function created(address _to, uint256 _value) external override onlyToken {
        _creationActionOnCountryRestrictions(_to, _value);
        _creationActionOnMaxBalance(_to, _value);
    }

    function destroyed(
        address _from,
        uint256 _value
    ) external override onlyToken {
        _destructionActionOnCountryRestrictions(_from, _value);
        _destructionActionOnMaxBalance(_from, _value);
    }

    function canTransfer(
        address _from,
        address _to,
        uint256 _value
    ) external view override returns (bool) {
        bool countryOk = complianceCheckOnCountryRestrictions(
            _from,
            _to,
            _value
        );
        bool balanceOk = complianceCheckOnMaxBalance(_from, _to, _value);
        return countryOk && balanceOk;
    }
}
```

De esta forma, el compliance concreto puede combinar varias reglas y features, y los métodos internos permiten que cada feature gestione su propio estado y lógica sin interferir con las demás.

#### Despliegue y dependencias

**Legacy Implementation**

- Solo es necesario desplegar **un contrato de compliance** (por ejemplo, `CustomCompliance`), que hereda de las features deseadas.
- El contrato de compliance se vincula a un único token mediante binding explícito (`bindToken`).
- No requiere contratos adicionales para las reglas: todo se compone por herencia en un solo contrato.

---

### 2. Modular Implementation

#### IModularCompliance (interfaz principal)

- Define los métodos obligatorios para cualquier contrato de compliance modular:
    - `canTransfer(address from, address to, uint256 value)`
    - `transferred(address from, address to, uint256 value)`
    - `created(address to, uint256 value)`
    - `destroyed(address from, uint256 value)`
    - Métodos para añadir y quitar módulos (`addModule`, `removeModule`), y otras utilidades de administración.

#### IModule (interfaz de módulo)

- Define la interfaz que deben implementar todos los módulos:
    - `moduleCheck(address from, address to, uint256 value, address compliance)`
    - `moduleTransferAction(address from, address to, uint256 value)`
    - `moduleMintAction(address to, uint256 value)`
    - `moduleBurnAction(address from, uint256 value)`
    - `isPlugAndPlay()`
    - `canComplianceBind(address compliance)`

#### Implementaciones principales

##### ModularCompliance (implementación principal)

- Implementa `IModularCompliance` y gestiona la lista de módulos activos.
- Permite vincular un único token al contrato de compliance mediante `bindToken`.
- El owner puede añadir y quitar módulos dinámicamente (`addModule`, `removeModule`), hasta un máximo de 25 módulos.
- No existe el rol de agent; la gestión de permisos se realiza únicamente con `Ownable`.
- Los hooks y la validación recorren automáticamente todos los módulos y llaman a sus métodos correspondientes.
- Permite administración avanzada de módulos mediante `callModuleFunction`.

##### Implementaciones de módulos (features de muestra)

1. **Módulos de muestra:**
    - **CountryRestrictionsModule**
    - **MaxBalanceModule**
    - _(Y así para el resto de módulos de muestra: ApproveTransferModule, CountryWhitelistingModule, etc.)_

2. **Lógica interna de módulos:**  
   Cada módulo implementa:
    - Un método de validación principal, típicamente llamado `moduleCheck`, que se utiliza en la implementación de `canTransfer` del contrato de compliance concreto. Este método solo realiza la comprobación de la regla específica y no actualiza el estado.
    - Métodos internos de acción, invocados por los hooks del contrato principal de compliance:
        - `moduleTransferAction(address from, address to, uint256 value)`: Acción tras transferencia.
        - `moduleMintAction(address to, uint256 value)`: Acción tras mint.
        - `moduleBurnAction(address from, uint256 value)`: Acción tras burn.
    - Estos métodos internos pueden estar vacíos si el módulo no requiere actualizar estado tras el evento.

    **Ejemplo de lógica interna:**
    - **CountryRestrictionsModule**
        - `moduleCheck`: Devuelve `false` si el país del destinatario está en la blacklist, `true` en caso contrario.
        - Métodos internos de acción: Vacíos, no realizan ninguna acción tras transfer, mint o burn.

    - **MaxBalanceModule**
        - `moduleCheck`: Devuelve `false` si el destinatario supera el balance máximo tras la transferencia o mint, `true` en caso contrario.
        - Métodos internos de acción:
            - `moduleTransferAction`: Actualiza el balance ONCHAINID de ambos usuarios tras la transferencia.
            - `moduleMintAction`: Suma el balance ONCHAINID del destinatario tras el mint.
            - `moduleBurnAction`: Resta el balance ONCHAINID del usuario tras el burn.

#### Ejemplo de implementación de compliance modular

En el modelo modular, el owner añade los módulos deseados y el compliance recorre automáticamente todos los módulos activos en los hooks y la validación:

```solidity
contract ModularCompliance is IModularCompliance, OwnableUpgradeable {
    IModule[] private _modules;

    function canTransfer(
        address from,
        address to,
        uint256 value
    ) external view override returns (bool) {
        for (uint256 i = 0; i < _modules.length; i++) {
            if (!_modules[i].moduleCheck(from, to, value, address(this))) {
                return false;
            }
        }
        return true;
    }

    function transferred(
        address from,
        address to,
        uint256 value
    ) external override onlyToken {
        for (uint256 i = 0; i < _modules.length; i++) {
            _modules[i].moduleTransferAction(from, to, value);
        }
    }

    function created(address to, uint256 value) external override onlyToken {
        for (uint256 i = 0; i < _modules.length; i++) {
            _modules[i].moduleMintAction(to, value);
        }
    }

    function destroyed(
        address from,
        uint256 value
    ) external override onlyToken {
        for (uint256 i = 0; i < _modules.length; i++) {
            _modules[i].moduleBurnAction(from, value);
        }
    }

    // Métodos para añadir y quitar módulos, gestión de owner, etc.
}
```

De esta forma, el compliance modular permite combinar varias reglas y módulos, y los métodos internos permiten que cada módulo gestione su propio estado y lógica sin interferir con los demás.

#### Despliegue y dependencias

**Modular Implementation**

- Es necesario desplegar **al menos dos contratos**:
    1. El contrato principal de compliance (`ModularCompliance`).
    2. Cada uno de los **módulos** (`CountryRestrictionsModule`, `MaxBalanceModule`, etc.) que se quieran usar.
- El owner del compliance añade los módulos desplegados mediante `addModule`.
- El contrato de compliance se vincula a un único token mediante binding explícito (`bindToken`).
- Permite añadir o quitar módulos en cualquier momento, sin redeploy del contrato principal.

**FALTA!!!!!!!!!!!!** aqui el modulo no se re aprovecha pq tiene storage el propio contrato?

### 3. Comparación de arquitecturas

*(Por completar)*

## Decisión

En la arquitectura ISBE basada en Diamond (EIP-2535) para ERC-3643, el modelo de compliance se estructura de forma estricta y clara en dos niveles principales:

### 1. Contrato Core de Compliance

- El **contrato core** es el único que implementa la interfaz estándar `ICompliance`.
- Expone únicamente los métodos de la interfaz (`canTransfer`, `transferred`, `created`, `destroyed`).
- No contiene lógica de reglas; su única responsabilidad es orquestar y delegar las llamadas a los contratos de features correspondientes.

### 2. Contratos de Features de Compliance

- Cada **feature** de compliance (ejemplo: CountryRestrictions, CountryWhitelisting, MaxBalance, etc.) se implementa como un contrato independiente.
- Cada feature define:
  - Su propia interfaz administrativa y de consulta (por ejemplo, `ICountryRestrictionsAdmin`, `ICountryWhitelistingAdmin`).
  - Un contrato interno con la lógica de la regla y su propio diamond storage.
  - Un contrato externo para exponer los métodos administrativos y de consulta.
- Las features **no implementan `ICompliance`** ni exponen métodos de la interfaz estándar.
- Las features pueden ser habilitadas/deshabilitadas dinámicamente mediante flags o configuración administrativa.

### 3. Orquestación

- El contrato core delega la ejecución de los métodos de `ICompliance` a los features activos.
- La coordinación entre features se realiza de forma explícita:
  - Si alguna feature activa rechaza la operación (`_canTransfer` devuelve `false`), la operación se bloquea.
  - Los hooks (`_transferred`, `_created`, `_destroyed`) se ejecutan en todas las features activas.

### 4. Interfaces

- **Solo el contrato core implementa `ICompliance`.**
- **Cada feature implementa únicamente su propia interfaz administrativa y de consulta.**
- No existe mezcla de interfaces ni lógica entre el core y las features.

### 5. Compatibilidad con ERC-3643 clásico (binding)

En este modelo, el token y el compliance están co-alojados dentro del mismo contrato, por lo que **no es necesario el binding on-chain** tradicional (`bindToken`, `unbindToken`, `getTokenBound`). La lógica de compliance accede directamente al estado del token y viceversa.

Si se requiere compatibilidad binaria con herramientas, SDKs o UIs que esperan la interfaz `ICompliance` clásica de Tokeny, se puede incluir una **feature adaptadora opcional** que exponga estos métodos:

- `getTokenBound()` devuelve `address(this)` o una constante simbólica.
- `bindToken` y `unbindToken` son no-op (no hacen nada relevante), pero pueden emitir los eventos estándar (`TokenBound`, `TokenUnbound`) para no romper integraciones que los escuchen.
- Opcionalmente, pueden escribir un flag interno para trazabilidad.

Si no se requiere compatibilidad binaria, se recomienda **documentar este desvío** en el ADR, explicando que el binding no es necesario en el modelo Diamond y que la integración se realiza de forma nativa y directa.

### 6. Ventajas

- **Separación estricta de responsabilidades:** El core solo expone la interfaz estándar y orquesta; las features solo gestionan su propia lógica y administración.
- **Sin colisión de selectors:** Solo el core implementa la interfaz estándar.
- **Extensible y mantenible:** Añadir una nueva regla solo requiere crear una nueva feature y su interfaz administrativa.
- **Sin binding ni contratos externos:** Todo el estado y lógica viven dentro del Diamond.

### 7. Consideraciones sobre activación y comportamiento por defecto

- Las features pueden estar habilitadas/deshabilitadas dinámicamente mediante flags.
- Por defecto, las features no bloquean operaciones si no están configuradas o habilitadas.
- Se recomienda que todas las features sigan el patrón de inercia por defecto (no bloquear si no hay configuración), para evitar bloqueos inesperados y facilitar la gestión.


---

## Beneficios

_(Por completar)_

## Fases de implementación

_(Por completar)_

---

## Propuesta Fernando: Enfoque Pragmático con Orquestador Dedicado

### Análisis del Problema

La propuesta original de la ADR plantea que `ERC203643InternalCommon` herede directamente de todos los contratos de reglas de compliance y orqueste manualmente los métodos mediante `override`. Si bien esta aproximación es funcional, presenta algunos desafíos:

1. **Responsabilidad mezclada:** `ERC203643InternalCommon` debe gestionar tanto la orquestación de compliance como la coordinación de otros módulos ERC3643 (Freeze, Metadata, Regulatory, Recovery).
2. **Complejidad de overrides:** Cada vez que se añade una nueva regla, se deben actualizar múltiples métodos `override` en `ERC203643InternalCommon`.
3. **Dificultad de testing:** La orquestación de compliance está entrelazada con la lógica general del token, complicando los tests unitarios de reglas individuales.
4. **Extensibilidad limitada:** Añadir o quitar reglas requiere modificar el contrato principal.

### Propuesta: Contrato Orquestador por Fernando

Se propone introducir un **contrato intermedio `ComplianceInternal`** que actúe como orquestador exclusivo de todas las reglas de compliance, separando esta responsabilidad de `ERC203643InternalCommon`.

#### Estructura Propuesta

```
ERC203643InternalCommon
    ↓ hereda
ComplianceInternal (ORQUESTADOR)
    ↓ hereda múltiple
┌─────────────────────────────────────────────────────┐
│ CountryRestrictionsInternal                         │
│ CountryWhitelistingInternal                         │
│ MaxBalanceInternal                                  │
│ SupplyLimitInternal                                 │
│ DayMonthLimitsInternal                              │
│ ... (futuras reglas)                                │
└─────────────────────────────────────────────────────┘
```

#### Implementación del Orquestador

```solidity
/**
 * @title ComplianceInternal
 * @notice Orquestador central de todas las reglas de compliance
 * @dev Hereda de todas las reglas *Internal y coordina su ejecución.
 *      Proporciona un punto único de acceso para validación y hooks de compliance.
 */
abstract contract ComplianceInternal is
    CountryRestrictionsInternal,
    CountryWhitelistingInternal,
    MaxBalanceInternal,
    SupplyLimitInternal
{
    // ============================================================
    // SISTEMA DE ACTIVACIÓN DE REGLAS
    // ============================================================

    /**
     * @dev Flags de activación por regla
     * Cada regla está desactivada por defecto y debe activarse explícitamente
     */
    bool private _countryRestrictionsEnabled;
    bool private _countryWhitelistingEnabled;
    bool private _maxBalanceEnabled;
    bool private _supplyLimitEnabled;

    /**
     * @notice Event emitido cuando se activa/desactiva una regla
     */
    event ComplianceRuleToggled(string ruleName, bool enabled);

    // ============================================================
    // ORQUESTACIÓN DE VALIDACIÓN
    // ============================================================

    /**
     * @notice Valida si una transferencia cumple con todas las reglas de compliance activas
     * @dev Itera sobre todas las reglas habilitadas. Si alguna falla, retorna false.
     * @param _from Dirección origen
     * @param _to Dirección destino
     * @param _amount Cantidad a transferir
     * @return bool True si todas las reglas activas permiten la transferencia
     */
    function _canTransferCompliance(
        address _from,
        address _to,
        uint256 _amount
    ) internal view returns (bool) {
        // Validar CountryRestrictions si está activa
        if (_countryRestrictionsEnabled) {
            if (!_canTransferCountryRestrictions(_from, _to, _amount)) {
                return false;
            }
        }

        // Validar CountryWhitelisting si está activa
        if (_countryWhitelistingEnabled) {
            if (!_canTransferCountryWhitelisting(_from, _to, _amount)) {
                return false;
            }
        }

        // Validar MaxBalance si está activa
        if (_maxBalanceEnabled) {
            if (!_canTransferMaxBalance(_from, _to, _amount)) {
                return false;
            }
        }

        // Validar SupplyLimit si está activa
        if (_supplyLimitEnabled) {
            if (!_canTransferSupplyLimit(_from, _to, _amount)) {
                return false;
            }
        }

        return true;
    }

    // ============================================================
    // ORQUESTACIÓN DE HOOKS
    // ============================================================

    /**
     * @notice Hook ejecutado después de una transferencia exitosa
     * @dev Llama a los hooks de todas las reglas activas para actualizar su estado
     * @param _from Dirección origen
     * @param _to Dirección destino
     * @param _amount Cantidad transferida
     */
    function _transferredCompliance(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        if (_countryRestrictionsEnabled) {
            _transferredCountryRestrictions(_from, _to, _amount);
        }
        if (_countryWhitelistingEnabled) {
            _transferredCountryWhitelisting(_from, _to, _amount);
        }
        if (_maxBalanceEnabled) {
            _transferredMaxBalance(_from, _to, _amount);
        }
        if (_supplyLimitEnabled) {
            _transferredSupplyLimit(_from, _to, _amount);
        }
    }

    /**
     * @notice Hook ejecutado después de un mint exitoso
     * @param _to Dirección destino
     * @param _amount Cantidad creada
     */
    function _createdCompliance(address _to, uint256 _amount) internal {
        if (_countryRestrictionsEnabled) {
            _createdCountryRestrictions(_to, _amount);
        }
        if (_countryWhitelistingEnabled) {
            _createdCountryWhitelisting(_to, _amount);
        }
        if (_maxBalanceEnabled) {
            _createdMaxBalance(_to, _amount);
        }
        if (_supplyLimitEnabled) {
            _createdSupplyLimit(_to, _amount);
        }
    }

    /**
     * @notice Hook ejecutado después de un burn exitoso
     * @param _from Dirección origen
     * @param _amount Cantidad destruida
     */
    function _destroyedCompliance(address _from, uint256 _amount) internal {
        if (_countryRestrictionsEnabled) {
            _destroyedCountryRestrictions(_from, _amount);
        }
        if (_countryWhitelistingEnabled) {
            _destroyedCountryWhitelisting(_from, _amount);
        }
        if (_maxBalanceEnabled) {
            _destroyedMaxBalance(_from, _amount);
        }
        if (_supplyLimitEnabled) {
            _destroyedSupplyLimit(_from, _amount);
        }
    }

    // ============================================================
    // GESTIÓN DE ACTIVACIÓN DE REGLAS
    // ============================================================

    /**
     * @notice Activa o desactiva CountryRestrictions
     * @dev Solo llamable internamente (expuesto por facet externa)
     * @param _enable True para activar, false para desactivar
     */
    function _setCountryRestrictionsEnabled(bool _enable) internal {
        _countryRestrictionsEnabled = _enable;
        emit ComplianceRuleToggled('CountryRestrictions', _enable);
    }

    /**
     * @notice Activa o desactiva CountryWhitelisting
     * @param _enable True para activar, false para desactivar
     */
    function _setCountryWhitelistingEnabled(bool _enable) internal {
        _countryWhitelistingEnabled = _enable;
        emit ComplianceRuleToggled('CountryWhitelisting', _enable);
    }

    /**
     * @notice Activa o desactiva MaxBalance
     * @param _enable True para activar, false para desactivar
     */
    function _setMaxBalanceEnabled(bool _enable) internal {
        _maxBalanceEnabled = _enable;
        emit ComplianceRuleToggled('MaxBalance', _enable);
    }

    /**
     * @notice Activa o desactiva SupplyLimit
     * @param _enable True para activar, false para desactivar
     */
    function _setSupplyLimitEnabled(bool _enable) internal {
        _supplyLimitEnabled = _enable;
        emit ComplianceRuleToggled('SupplyLimit', _enable);
    }

    /**
     * @notice Verifica si una regla específica está activa
     * @param _ruleName Nombre de la regla (por ejemplo, "CountryRestrictions")
     * @return bool True si la regla está activa
     */
    function _isComplianceRuleEnabled(
        string memory _ruleName
    ) internal view returns (bool) {
        bytes32 ruleHash = keccak256(bytes(_ruleName));

        if (ruleHash == keccak256('CountryRestrictions')) {
            return _countryRestrictionsEnabled;
        }
        if (ruleHash == keccak256('CountryWhitelisting')) {
            return _countryWhitelistingEnabled;
        }
        if (ruleHash == keccak256('MaxBalance')) {
            return _maxBalanceEnabled;
        }
        if (ruleHash == keccak256('SupplyLimit')) {
            return _supplyLimitEnabled;
        }

        return false;
    }
}
```

#### Integración en ERC203643InternalCommon

```solidity
/**
 * @title ERC203643InternalCommon
 * @notice Contrato agregador de toda la funcionalidad interna ERC3643
 * @dev Hereda de ComplianceInternal y otros módulos internos.
 *      Delega la orquestación de compliance a ComplianceInternal.
 */
abstract contract ERC203643InternalCommon is
    ComplianceInternal,
    ERC3643FreezeInternal,
    ERC3643MetadataInternal,
    ERC3643RegulatoryInternal,
    ERC3643RecoveryInternal
{
    /**
     * @notice Hook ejecutado antes de cada transferencia/mint/burn
     * @dev Valida compliance y otras reglas del token
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual {
        // Validar compliance (delegado a ComplianceInternal)
        require(
            _canTransferCompliance(_from, _to, _amount),
            'Transfer blocked by compliance rules'
        );

        // Validar otras reglas (freeze, regulatory, etc.)
        // ...
    }

    /**
     * @notice Hook ejecutado después de cada transferencia/mint/burn
     * @dev Ejecuta hooks de compliance y otros módulos
     */
    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual {
        // Hooks de compliance (delegado a ComplianceInternal)
        if (_from == address(0)) {
            // Mint
            _createdCompliance(_to, _amount);
        } else if (_to == address(0)) {
            // Burn
            _destroyedCompliance(_from, _amount);
        } else {
            // Transfer
            _transferredCompliance(_from, _to, _amount);
        }

        // Hooks de otros módulos
        // ...
    }
}
```

#### Facetas de Administración

Cada regla de compliance tiene su facet para administración y activación:

```solidity
/**
 * @title ComplianceCountryRestrictionsFacet
 * @notice Facet para gestionar la regla CountryRestrictions
 */
contract ComplianceCountryRestrictionsFacet is ComplianceInternal {
    /**
     * @notice Activa o desactiva la regla CountryRestrictions
     * @param _enable True para activar, false para desactivar
     */
    function setCountryRestrictionsEnabled(
        bool _enable
    ) external onlyRole(COMPLIANCE_MANAGER_ROLE) {
        _setCountryRestrictionsEnabled(_enable);
    }

    /**
     * @notice Añade un país a la blacklist de restricciones
     * @param _country Código de país
     */
    function addRestrictedCountry(
        uint16 _country
    ) external onlyRole(COMPLIANCE_MANAGER_ROLE) {
        _addRestrictedCountry(_country);
    }

    /**
     * @notice Elimina un país de la blacklist de restricciones
     * @param _country Código de país
     */
    function removeRestrictedCountry(
        uint16 _country
    ) external onlyRole(COMPLIANCE_MANAGER_ROLE) {
        _removeRestrictedCountry(_country);
    }

    /**
     * @notice Verifica si CountryRestrictions está activa
     * @return bool True si está activa
     */
    function isCountryRestrictionsEnabled() external view returns (bool) {
        return _isComplianceRuleEnabled('CountryRestrictions');
    }

    /**
     * @notice Obtiene la lista de países restringidos
     * @return uint16[] Lista de códigos de país
     */
    function getRestrictedCountries() external view returns (uint16[] memory) {
        return _getRestrictedCountries();
    }
}
```

### Ventajas de la Propuesta

#### 1. **Separación Clara de Responsabilidades**

- `ComplianceInternal`: Orquestador exclusivo de reglas de compliance
- `ERC203643InternalCommon`: Coordinador general de módulos ERC3643
- Cada regla `*Internal`: Implementación aislada de su lógica específica

#### 2. **Facilidad de Testing**

```solidity
// Test unitario de una regla específica
contract CountryRestrictionsTest is CountryRestrictionsInternal {
    // Testear solo esta regla sin otras dependencias
}

// Test de integración del orquestador
contract ComplianceInternalTest is ComplianceInternal {
    // Testear la orquestación sin dependencias del token
}

// Test E2E del token completo
contract ERC3643TokenTest is ERC203643InternalCommon {
    // Testear el flujo completo
}
```

#### 3. **Extensibilidad Simplificada**

Para añadir una nueva regla (por ejemplo, `TimeLocksInternal`):

1. Crear el contrato `TimeLocksInternal.sol`
2. Añadir herencia en `ComplianceInternal`:
    ```solidity
    abstract contract ComplianceInternal is
        CountryRestrictionsInternal,
        CountryWhitelistingInternal,
        MaxBalanceInternal,
        SupplyLimitInternal,
        TimeLocksInternal  // ← Nueva regla
    {
    ```
3. Añadir flag y métodos de activación:

    ```solidity
    bool private _timeLocksEnabled;

    function _setTimeLocksEnabled(bool _enable) internal {
        _timeLocksEnabled = _enable;
        emit ComplianceRuleToggled("TimeLocks", _enable);
    }
    ```

4. Añadir llamadas en los métodos de orquestación:
    ```solidity
    function _canTransferCompliance(...) internal view returns (bool) {
        // ... reglas existentes

        if (_timeLocksEnabled) {
            if (!_canTransferTimeLocks(_from, _to, _amount)) {
                return false;
            }
        }

        return true;
    }
    ```
5. Crear `ComplianceTimeLocksFacet.sol` para exposición externa

**No es necesario modificar `ERC203643InternalCommon`** ✅

#### 4. **Comportamiento Consistente por Defecto**

Todas las reglas están **desactivadas** hasta activarse explícitamente:

```solidity
// Despliegue inicial: todas las reglas desactivadas
// El token funciona sin restricciones de compliance

// Activar solo las reglas necesarias
await complianceCountryRestrictionsFacet.setCountryRestrictionsEnabled(true);
await complianceCountryRestrictionsFacet.addRestrictedCountry(850); // Cuba

// Ahora CountryRestrictions está activa, resto sigue desactivado
```

Esto resuelve el problema identificado en la ADR donde `CountryWhitelisting` bloqueaba todo por defecto.

#### 5. **Menor Complejidad de Overrides**

- **Sin propuesta**: `ERC203643InternalCommon` necesita `override` por cada combinación de reglas
- **Con propuesta**: Solo `ComplianceInternal` maneja los `override` (si son necesarios)
- `ERC203643InternalCommon` solo hace llamadas simples a métodos del orquestador

#### 6. **Debugging Simplificado**

```solidity
// Si una transferencia falla por compliance, el error es claro:
// "Transfer blocked by compliance rules"

// Se puede debuggear específicamente el orquestador:
function _canTransferCompliance(...) internal view returns (bool) {
    if (_countryRestrictionsEnabled) {
        if (!_canTransferCountryRestrictions(_from, _to, _amount)) {
            // Breakpoint aquí para ver qué regla falla
            return false;
        }
    }
    // ...
}
```

### Comparación con Propuesta Original

| Aspecto                  | Propuesta Original ADR                 | Propuesta Fernando                           |
| ------------------------ | -------------------------------------- | -------------------------------------------- |
| **Orquestación**         | En `ERC203643InternalCommon`           | En `ComplianceInternal` dedicado             |
| **Overrides**            | Múltiples en `ERC203643InternalCommon` | Solo en `ComplianceInternal` (si necesarios) |
| **Extensibilidad**       | Modificar `ERC203643InternalCommon`    | Modificar solo `ComplianceInternal`          |
| **Testabilidad**         | Media (todo acoplado)                  | Alta (capas independientes)                  |
| **Claridad**             | Media                                  | Alta (responsabilidad única)                 |
| **Activación de reglas** | No resuelto                            | Sistema de flags booleanos                   |
| **Debugging**            | Complejo                               | Simplificado (punto central)                 |
| **Mantenibilidad**       | Media                                  | Alta (cambios localizados)                   |

### Plan de Implementación Propuesto

#### **Fase 1:**

1. Crear estructura base de `ComplianceInternal`
2. Implementar sistema de activación de reglas
3. Definir interfaces para métodos de reglas (`_canTransfer*`, `_transferred*`, etc.)
4. Tests unitarios del sistema de activación

#### **Fase 2:**

1. Implementar `CountryRestrictionsInternal`:
    - Storage para blacklist
    - Métodos `_canTransferCountryRestrictions`, `_addRestrictedCountry`, etc.
    - Tests unitarios
2. Implementar `CountryWhitelistingInternal`:
    - Storage para whitelist
    - Métodos similares
    - Tests unitarios
3. Integrar ambas en `ComplianceInternal`
4. Crear facets correspondientes:
    - `ComplianceCountryRestrictionsFacet`
    - `ComplianceCountryWhitelistingFacet`
5. Tests de integración de orquestación

#### **Fase 3: Integración con Token**

1. Integrar `ComplianceInternal` en `ERC203643InternalCommon`
2. Añadir llamadas a `_canTransferCompliance` en `_beforeTokenTransfer`
3. Añadir llamadas a hooks de compliance en `_afterTokenTransfer`
4. Tests E2E con token completo
5. Verificar coverage 100%

#### **Fase 4: Reglas Avanzadas**

1. Implementar `MaxBalanceInternal`
2. Implementar `SupplyLimitInternal`
3. Implementar `DayMonthLimitsInternal`
4. Crear facets y tests correspondientes
5. Validación de integración completa

#### **Fase 5: Documentación y Optimización**

1. Documentar arquitectura final
2. Optimización de gas
3. Auditoría interna de seguridad
4. Preparar ejemplos de uso

### Ejemplo de Uso Completo

```solidity
// 1. Deploy del Diamond con ComplianceInternal integrado
const diamond = await deployDiamond();

// 2. Todas las reglas están desactivadas por defecto
const canTransfer = await diamond.canTransfer(alice, bob, 1000);
// → true (sin restricciones)

// 3. Activar CountryRestrictions
await diamond.setCountryRestrictionsEnabled(true);
await diamond.addRestrictedCountry(850); // Bloquear Cuba

// 4. Ahora las transferencias a Cuba fallan
await diamond.transfer(cubanAddress, 1000);
// → Revert: "Transfer blocked by compliance rules"

// 5. Activar MaxBalance
await diamond.setMaxBalanceEnabled(true);
await diamond.setMaxBalance(10000);

// 6. Ahora se validan AMBAS reglas
await diamond.transfer(alice, 15000);
// → Revert: "Transfer blocked by compliance rules" (MaxBalance)

// 7. Desactivar CountryRestrictions temporalmente
await diamond.setCountryRestrictionsEnabled(false);
// Ahora solo MaxBalance está activa

// 8. Verificar estado de reglas
const isCountryRestrictionsActive = await diamond.isCountryRestrictionsEnabled();
// → false
const isMaxBalanceActive = await diamond.isComplianceRuleEnabled("MaxBalance");
// → true
```

### Conclusión

La propuesta de introducir `ComplianceInternal` como orquestador dedicado ofrece:

✅ **Mejor separación de concerns**  
✅ **Mayor testabilidad**  
✅ **Extensibilidad simplificada**  
✅ **Comportamiento predecible por defecto**  
✅ **Debugging más sencillo**  
✅ **Mantenibilidad a largo plazo**

Si bien requiere un nivel adicional de abstracción, los beneficios en claridad, mantenibilidad y escalabilidad me parecen claros.

### Propuesta de Fernando.
