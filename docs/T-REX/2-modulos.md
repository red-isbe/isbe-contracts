# Capítulo 2: Entender los Módulos de Implementación del T-REX

## Arquitectura Modular del T-REX

### Principios de Diseño Modular

La arquitectura modular del T-REX se basa en tres principios fundamentales:

1. **Separación de Responsabilidades**: Cada módulo maneja un aspecto específico del cumplimiento
2. **Interoperabilidad**: Los módulos pueden trabajar independientemente o en conjunto
3. **Extensibilidad**: Nuevos módulos pueden agregarse sin afectar los existentes

### Componentes Principales de la Implementación

#### 1. Módulo de Cumplimiento Modular (ModularCompliance)

El contrato ModularCompliance sirve como el orquestador central que coordina la ejecución de múltiples módulos de cumplimiento. Este contrato:

- Mantiene una lista de módulos activos vinculados al token
- Ejecuta hooks de validación en cada módulo durante las transferencias
- Proporciona funciones para agregar y remover módulos dinámicamente
- Asegura que todas las reglas de cumplimiento se evalúen antes de permitir una transacción

#### 2. Módulos de Identidad y Verificación

**ONCHAINID (Identidad en Cadena)**

- Sistema de gestión de identidad basado en blockchain que permite crear identidades globalmente accesibles
- Implementa estándares ERC-734 y ERC-735 para gestión de claves y reclamaciones
- Cada usuario despliega un contrato ONCHAINID una sola vez, que puede ser reutilizado en múltiples tokens

**Identity Registry (Registro de Identidades)**

- Compuesto por tres contratos principales:
    - Identity Registry Storage (IRS): Almacena datos de identidad
    - Identity Registry (IR): Lógica de validación
    - Trusted Issuers Registry (TIR): Gestiona emisores autorizados

#### 3. Módulos de Cumplimiento Específicos

La implementación T-REX incluye diversos módulos especializados que abordan diferentes aspectos regulatorios:

### Catálogo de Módulos de Cumplimiento

#### Módulos de Restricción Geográfica

**CountryAllowModule**

- Facilita control granular sobre transferencias de tokens basado en la ubicación geográfica
- Permite que las entidades de cumplimiento gestionen permisos de transacción para países específicos
- Los inversores están asociados con un único país almacenado en el registro de identidades

**CountryRestrictModule**

- Funcionalidad opuesta al CountryAllowModule
- Permite al propietario restringir transacciones de tokens a usuarios en países específicos
- Útil para cumplir con sanciones internacionales o restricciones regulatorias locales

#### Módulos de Límites y Balances

**MaxBalanceModule**

- Previene la concentración excesiva de tokens en una sola dirección
- Evita manipulación de precios y desigualdades en sistemas de votación
- Permite al propietario de la plataforma limitar la cantidad máxima de tokens que un usuario puede poseer

**SupplyLimitModule**

- Implementa un límite de suministro total para el token
- Previene la acuñación ilimitada de tokens
- Asegura que el suministro total no exceda un límite predefinido

#### Módulos de Límites Temporales

**ExchangeMonthlyLimitsModule**

- Establece límites en la cantidad de tokens que pueden transferirse mensualmente
- Útil para controlar la velocidad de circulación de tokens en el mercado
- Permite gestión de liquidez y estabilidad de precios

**TimeExchangeLimitsModule**

- Permite restricciones de transacciones a intercambios específicos dentro de marcos temporales establecidos
- Un usuario puede poseer múltiples IDs de intercambio para usar según sea necesario
- Facilita el cumplimiento con regulaciones de horarios de trading

**TimeTransfersLimitsModule**

- Permite al propietario establecer límites de tokens que pueden transferirse en un marco temporal dado
- Útil para implementar períodos de bloqueo o restricciones de vesting
- Proporciona control granular sobre la velocidad de transferencias

#### Módulos Económicos

**TransferFeesModule**

- Permite la implementación de tarifas de protocolo para la sostenibilidad de la plataforma
- Los administradores pueden establecer tarifas y designar direcciones recolectoras
- Asegura que las tarifas se cobren durante las transferencias según las tasas especificadas

**TransferRestrictModule**

- Crea funcionalidad de lista de permisos dentro del sistema
- Permite a los administradores gestionar el acceso de usuarios a transferencias
- Proporciona operaciones en lote para gestionar múltiples direcciones de usuario eficientemente

## Implementación Técnica de Módulos

### Estructura Base de un Módulo

Todos los módulos de cumplimiento heredan de la clase AbstractModuleUpgradeable, que proporciona:

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

abstract contract AbstractModuleUpgradeable {
    address public compliance;

    modifier onlyComplianceCall() {
        require(msg.sender == compliance, 'Only compliance contract');
        _;
    }

    // Hooks ejecutados durante las transferencias
    function moduleTransferAction(
        address _from,
        address _to,
        uint256 _value
    ) external virtual onlyComplianceCall;

    function moduleMintAction(
        address _to,
        uint256 _value
    ) external virtual onlyComplianceCall;

    function moduleBurnAction(
        address _from,
        uint256 _value
    ) external virtual onlyComplianceCall;

    // Verificación de cumplimiento
    function moduleCheck(
        address _from,
        address _to,
        uint256 _value,
        address _compliance
    ) external view virtual returns (bool);
}
```

### Ejemplo: Implementación del MaxBalanceModule

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

contract MaxBalanceModule is AbstractModuleUpgradeable {
    mapping(address => uint256) private _maxBalances;

    event MaxBalanceSet(address indexed _compliance, uint256 _maxBalance);

    function setMaxBalance(uint256 _maxBalance) external onlyComplianceOwner {
        _maxBalances[msg.sender] = _maxBalance;
        emit MaxBalanceSet(msg.sender, _maxBalance);
    }

    function getMaxBalance(
        address _compliance
    ) external view returns (uint256) {
        return _maxBalances[_compliance];
    }

    function moduleCheck(
        address _from,
        address _to,
        uint256 _value,
        address _compliance
    ) external view override returns (bool) {
        uint256 maxBalance = _maxBalances[_compliance];
        if (maxBalance == 0) return true;

        uint256 receiverBalance = IToken(_getToken(_compliance)).balanceOf(_to);
        return (receiverBalance + _value <= maxBalance);
    }

    function moduleTransferAction(
        address _from,
        address _to,
        uint256 _value
    ) external override onlyComplianceCall {
        // Lógica post-transferencia si es necesaria
    }
}
```

### Ejemplo: Implementación del CountryRestrictModule

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

contract CountryRestrictModule is AbstractModuleUpgradeable {
    mapping(address => uint16[]) private _restrictedCountries;

    event CountryRestricted(address indexed _compliance, uint16 _country);
    event CountryUnrestricted(address indexed _compliance, uint16 _country);

    function addCountryRestriction(
        uint16 _country
    ) external onlyComplianceOwner {
        uint16[] storage restrictedCountries = _restrictedCountries[msg.sender];

        for (uint256 i = 0; i < restrictedCountries.length; i++) {
            require(
                restrictedCountries[i] != _country,
                'Country already restricted'
            );
        }

        restrictedCountries.push(_country);
        emit CountryRestricted(msg.sender, _country);
    }

    function removeCountryRestriction(
        uint16 _country
    ) external onlyComplianceOwner {
        uint16[] storage restrictedCountries = _restrictedCountries[msg.sender];

        for (uint256 i = 0; i < restrictedCountries.length; i++) {
            if (restrictedCountries[i] == _country) {
                restrictedCountries[i] = restrictedCountries[
                    restrictedCountries.length - 1
                ];
                restrictedCountries.pop();
                emit CountryUnrestricted(msg.sender, _country);
                return;
            }
        }
        revert('Country not found in restrictions');
    }

    function moduleCheck(
        address _from,
        address _to,
        uint256 _value,
        address _compliance
    ) external view override returns (bool) {
        IIdentityRegistry identityRegistry = IIdentityRegistry(
            _getIdentityRegistry(_compliance)
        );

        uint16 receiverCountry = identityRegistry.investorCountry(_to);
        uint16[] memory restrictedCountries = _restrictedCountries[_compliance];

        for (uint256 i = 0; i < restrictedCountries.length; i++) {
            if (restrictedCountries[i] == receiverCountry) {
                return false; // País restringido
            }
        }

        return true; // País permitido
    }
}
```

## Gestión de Módulos en ModularCompliance

### Interfaz de ModularCompliance

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IModularCompliance {
    // Eventos
    event ModuleAdded(address indexed _module);
    event ModuleRemoved(address indexed _module);

    // Gestión de módulos
    function addModule(address _module) external;
    function removeModule(address _module) external;
    function getModules() external view returns (address[] memory);
    function isModuleBound(address _module) external view returns (bool);

    // Verificación de cumplimiento
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);

    // Hooks de notificación
    function transferred(address _from, address _to, uint256 _amount) external;

    function created(address _to, uint256 _amount) external;
    function destroyed(address _from, uint256 _amount) external;
}
```

### Lógica de Ejecución de Módulos

```solidity
function canTransfer(
    address _from,
    address _to,
    uint256 _amount
) external view override returns (bool) {
    address[] memory modules = _modules;

    for (uint256 i = 0; i < modules.length; i++) {
        if (
            !IModule(modules[i]).moduleCheck(_from, _to, _amount, address(this))
        ) {
            return false;
        }
    }

    return true;
}

function transferred(
    address _from,
    address _to,
    uint256 _amount
) external override onlyToken {
    address[] memory modules = _modules;

    for (uint256 i = 0; i < modules.length; i++) {
        IModule(modules[i]).moduleTransferAction(_from, _to, _amount);
    }
}
```

## Proceso de Despliegue de Módulos

### Utilizando TREXFactory

El TREXFactory automatiza el despliegue de la suite completa de contratos T-REX:

```solidity
struct TokenDetails {
    address owner;
    string name;
    string symbol;
    uint8 decimals;
    address onchainID;
    string version;
}

struct ClaimDetails {
    uint256[] claimTopics;
    address[] trustedIssuers;
    uint256[] issuerClaims;
}

function deployTREXSuite(
    TokenDetails calldata _tokenDetails,
    ClaimDetails calldata _claimDetails
)
    external
    returns (
        address token,
        address identityRegistry,
        address compliance,
        address claimTopicsRegistry,
        address trustedIssuersRegistry
    )
{
    // Despliegue de contratos base
    claimTopicsRegistry = _deployClaimTopicsRegistry(_claimDetails);
    trustedIssuersRegistry = _deployTrustedIssuersRegistry(_claimDetails);
    identityRegistry = _deployIdentityRegistry(
        trustedIssuersRegistry,
        claimTopicsRegistry
    );
    compliance = _deployModularCompliance();
    token = _deployToken(_tokenDetails, identityRegistry, compliance);

    // Configuración de módulos predeterminados
    _setupDefaultModules(compliance);

    return (
        token,
        identityRegistry,
        compliance,
        claimTopicsRegistry,
        trustedIssuersRegistry
    );
}
```

## Ventajas del Sistema Modular

### Flexibilidad Regulatoria

- **Adaptabilidad Jurisdiccional**: Los módulos pueden configurarse para cumplir con regulaciones específicas de diferentes países
- **Evolución Regulatoria**: Nuevas regulaciones pueden implementarse agregando módulos sin modificar el token principal
- **Personalización por Activo**: Diferentes tipos de activos pueden usar combinaciones específicas de módulos

### Eficiencia Operacional

- **Reutilización de Código**: Los módulos pueden reutilizarse entre diferentes tokens
- **Mantenimiento Simplificado**: Los bugs se pueden corregir actualizando módulos específicos
- **Testing Granular**: Cada módulo puede probarse independientemente

### Escalabilidad

- **Carga Distribución**: La validación se distribuye entre múltiples módulos especializados
- **Optimización de Gas**: Solo se ejecutan los módulos relevantes para cada transacción
- **Paralelización**: Los módulos pueden ejecutarse en paralelo en implementaciones futuras

## Casos de Uso Prácticos

### Tokenización de Bienes Raíces

```solidity
// Configuración de módulos para un token de bienes raíces
address[] memory modules = new address[](4);
modules[0] = countryAllowModule; // Solo inversores de países específicos
modules[1] = maxBalanceModule;   // Límite máximo por inversor
modules[2] = transferFeesModule; // Tarifas de transferencia
modules[3] = timeTransfersLimitsModule; // Períodos de bloqueo
```

### Tokenización de Valores Privados

```solidity
// Configuración para un fondo de inversión privado
address[] memory modules = new address[](3);
modules[0] = transferRestrictModule; // Lista blanca de inversores
modules[1] = supplyLimitModule;      // Límite de suministro total
modules[2] = exchangeMonthlyLimitsModule; // Límites mensuales de trading
```

## Consideraciones de Seguridad

### Validación de Módulos

- **Auditorías**: Cada módulo debe ser auditado independientemente antes del despliegue
- **Pruebas de Integración**: Los módulos deben probarse en conjunto para evitar conflictos
- **Actualizabilidad**: El sistema proxy permite actualizar módulos manteniendo el estado

### Gobernanza de Módulos

- **Control de Acceso**: Solo los propietarios autorizados pueden agregar/remover módulos
- **Timelock**: Cambios críticos pueden requerir períodos de espera
- **Transparencia**: Todos los cambios de módulos son registrados en eventos on-chain
