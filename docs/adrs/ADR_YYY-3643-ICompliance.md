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
    function transferred(address _from, address _to, uint256 _value) external onlyToken override {
        _transferActionOnCountryRestrictions(_from, _to, _value);
        _transferActionOnMaxBalance(_from, _to, _value);
    }

    function created(address _to, uint256 _value) external onlyToken override {
        _creationActionOnCountryRestrictions(_to, _value);
        _creationActionOnMaxBalance(_to, _value);
    }

    function destroyed(address _from, uint256 _value) external onlyToken override {
        _destructionActionOnCountryRestrictions(_from, _value);
        _destructionActionOnMaxBalance(_from, _value);
    }

    function canTransfer(address _from, address _to, uint256 _value) external view override returns (bool) {
        bool countryOk = complianceCheckOnCountryRestrictions(_from, _to, _value);
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
   - *(Y así para el resto de módulos de muestra: ApproveTransferModule, CountryWhitelistingModule, etc.)*

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

    function canTransfer(address from, address to, uint256 value) external view override returns (bool) {
        for (uint256 i = 0; i < _modules.length; i++) {
            if (!_modules[i].moduleCheck(from, to, value, address(this))) {
                return false;
            }
        }
        return true;
    }

    function transferred(address from, address to, uint256 value) external onlyToken override {
        for (uint256 i = 0; i < _modules.length; i++) {
            _modules[i].moduleTransferAction(from, to, value);
        }
    }

    function created(address to, uint256 value) external onlyToken override {
        for (uint256 i = 0; i < _modules.length; i++) {
            _modules[i].moduleMintAction(to, value);
        }
    }

    function destroyed(address from, uint256 value) external onlyToken override {
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

En el contexto de ISBE, donde se utiliza el patrón Diamond (EIP-2535), la arquitectura recomendada es:

- **Un único Diamond** que integra tanto la lógica del token (IERC3643) como la de compliance (ICompliance) y cualquier otra funcionalidad relevante.
- Al migrar desde los modelos legacy o modular, los conceptos de features (legacy) y módulos (modular) se traducen directamente a **facetas** en el Diamond.
- Cada regla de compliance se implementa como una faceta independiente (por ejemplo, `CountryRestrictionsFacet`, `MaxBalanceFacet`, etc.).
- Puede existir una faceta principal (`ComplianceOrchestratorFacet`) que coordine la ejecución de las reglas, similar al contrato principal de compliance en los modelos anteriores.
- Tanto la lógica del token como la de compliance residen en el mismo Diamond, eliminando la necesidad de binding explícito.
- Los métodos `canTransfer`, `transferred`, `created`, `destroyed` se implementan como funciones en las facetas correspondientes y pueden ser orquestados desde la faceta principal.
- Añadir nuevas reglas solo requiere desplegar una nueva faceta y actualizar el Diamond, sin redeploy ni migraciones complejas.

> **Nota sobre la exposición de métodos en facetas:**  
> En la arquitectura Diamond, las facetas de compliance solo exponen externamente los métodos necesarios para la administración y actualización de las reglas (por ejemplo, añadir/quitar países, modificar límites, etc.).  
> Los métodos de validación y hooks (`canTransfer`, `transferred`, `created`, `destroyed`) no son llamados directamente por usuarios externos, sino que son invocados internamente por la faceta principal del token (`IERC3643Facet`) durante la ejecución de operaciones relevantes (transfer, mint, burn, etc.).  
> Así, el usuario o integrador solo interactúa con el Diamond a través de las funciones estándar del token, y la coordinación de compliance se realiza de forma interna y orquestada.

**Ejemplo de estructura:**
- `IERC3643Facet` (lógica principal del token)
- `ComplianceOrchestratorFacet` (coordina la ejecución de reglas de compliance)
- `CountryRestrictionsFacet` (regla específica)
- `MaxBalanceFacet` (regla específica)
- ...

### Mapeo funcional detallado

| Feature/Módulo Legacy/Modular      | Faceta Diamond equivalente         | Función principal                |
|------------------------------------|------------------------------------|----------------------------------|
| ApproveTransfer                    | ApproveTransferFacet               | Validación de transferencias     |
| CountryRestrictions                | CountryRestrictionsFacet           | Restricción por país (blacklist) |
| CountryWhitelisting                | CountryWhitelistingFacet           | Whitelist de países              |
| DayMonthLimits                     | DayMonthLimitsFacet                | Límites diarios/mensuales        |
| ExchangeMonthlyLimits              | ExchangeMonthlyLimitsFacet         | Límites en exchanges             |
| MaxBalance                         | MaxBalanceFacet                    | Límite de balance                |
| SupplyLimit                        | SupplyLimitFacet                   | Límite de supply                 |

**Ventajas de la aproximación Diamond:**
1. **Despliegue simplificado**: Un solo contrato Diamond integra token y compliance, sin necesidad de binding ni contratos externos.
2. **Upgradeabilidad granular**: Se pueden actualizar o añadir reglas de compliance sin redeploy del sistema completo.
3. **Coordinación eficiente**: Todas las facetas comparten storage y contexto, permitiendo lógica compleja y eficiente entre token y compliance.
4. **Extensibilidad**: Añadir nuevas reglas es tan sencillo como desplegar una nueva faceta y actualizar el Diamond.
5. **Reducción de riesgos**: Menos contratos y menos dependencias externas reducen la superficie de ataque y los errores de integración.
6. **Gestión centralizada de roles y permisos**: El control de acceso y upgrades se gestiona desde el Diamond, simplificando la administración.
## Beneficios

*(Por completar)*

## Fases de implementación

*(Por completar)*

---