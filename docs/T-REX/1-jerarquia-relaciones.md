# Capítulo 1: Entender la Jerarquía y Relaciones del T-REX

## Arquitectura General del T-REX

### Componentes Fundamentales

ERC-3643 opera a través de una arquitectura modular que separa la gestión de identidad, las reglas de cumplimiento y la lógica de tokens en contratos inteligentes distintos. Esta separación permite una mayor flexibilidad, mantenimiento y escalabilidad del sistema.

La arquitectura del T-REX se basa en cuatro pilares principales que crean un **validador descentralizado**:

### 1. ONCHAINID - Sistema de Identidad Blockchain

ONCHAINID es un contrato inteligente desplegado por un usuario para interactuar con el token de seguridad o cualquier otra aplicación donde una identidad en cadena pueda ser relevante. Almacena claves y reclamaciones relacionadas con una identidad específica.

**Características principales:**

- Basado en los estándares ERC-734 y ERC-735, este contrato sirve como repositorio de claves y reclamaciones vinculadas a una identidad específica
- **Reutilizable**: A diferencia de estar vinculado a un token particular, el contrato ONCHAINID solo requiere ser desplegado una vez por cada usuario
- **Versatilidad**: Puede ser aplicado en varios escenarios donde una identidad en cadena sea ventajosa

### 2. Registro de Emisores de Confianza (Trusted Issuers Registry)

Este contrato alberga las direcciones de todos los emisores de reclamaciones de confianza asociados con un token específico.

**Funciones principales:**

- Mantiene una lista blanca de entidades autorizadas para emitir certificados de validación
- Permite la gestión centralizada de la confianza en el ecosistema
- Facilita la verificación automatizada de credenciales

### 3. Registro de Temas de Reclamaciones (Claim Topics Registry)

Este contrato mantiene una lista de todos los temas de reclamaciones de confianza relacionados con el token de seguridad.

**Características:**

- Define el conjunto de funciones y eventos utilizados para gestionar los temas de reclamaciones requeridos para tokens dentro del protocolo T-REX
- Permite agregar y remover temas de reclamaciones mediante funciones específicas
- Solo el propietario del contrato puede realizar modificaciones

### 4. Registro de Identidades (Identity Registry)

Este contrato contiene las direcciones de los contratos de identidad de todos los usuarios elegibles autorizados para poseer el token.

**Propósito:**

- Proporciona una ubicación central para verificar las identidades de los usuarios, similar a una guía telefónica
- Mantiene el registro de todas las identidades dentro del sistema
- Facilita la verificación de elegibilidad en tiempo real

## Jerarquía de Contratos

### Nivel 1: Token ERC-3643 (Contrato Principal)

El contrato de token ERC-3643 se sitúa en la parte superior de la jerarquía y actúa como el punto de entrada principal para todas las operaciones de transferencia y gestión.

**Características del token:**

- Retrocompatible con ERC-20 y ERC-173
- Las funciones transfer y transferFrom se implementan de manera condicional, permitiendo proceder con una transferencia solo si la transacción es válida
- Incorpora validación de cumplimiento automatizada

### Nivel 2: Contratos de Validación

Estos contratos proporcionan los servicios de validación y verificación:

#### Contrato de Cumplimiento (Compliance Contract)

- La función canTransfer verifica si la transferencia cumple con las reglas de cumplimiento global aplicadas al token
- Evalúa restricciones como número máximo de tenedores de tokens por país
- Verifica límites de cantidad máxima de tokens por inversor

#### Validador de Identidad

- Introduce un sistema de identidad basado en reclamaciones, donde cada usuario está vinculado a una identidad en cadena validada por usuarios autorizados
- Determina la elegibilidad para recibir o transferir tokens específicos

### Nivel 3: Contratos de Registro y Gestión

Estos contratos proporcionan la infraestructura de soporte:

- **Trusted Issuers Registry**: Gestiona los emisores autorizados
- **Claim Topics Registry**: Define los tipos de reclamaciones válidas
- **Identity Registry**: Mantiene el registro de identidades elegibles

## Relaciones e Interacciones

### Flujo de Validación de Transferencias

1. **Iniciación**: Cuando se inicia una transferencia de tokens ERC-3643, el validador descentralizado se involucra para realizar verificaciones de cumplimiento y elegibilidad

2. **Verificación de Identidad**: El sistema consulta el Identity Registry para verificar que tanto el emisor como el receptor tienen identidades válidas

3. **Validación de Reclamaciones**: Se verifican las reclamaciones asociadas con las identidades contra los temas de reclamaciones permitidos

4. **Verificación de Emisores**: Se confirma que las reclamaciones fueron emitidas por entidades de confianza registradas

5. **Cumplimiento Global**: Se verifica el cumplimiento con reglas globales como límites de tenedores o restricciones por país

6. **Ejecución o Rechazo**: Si la transferencia cumple con los requisitos de cumplimiento, se permite la transferencia de tokens; de lo contrario, la transferencia es rechazada

### Interoperabilidad

ERC-3643 comparte la misma interfaz que el estándar ERC-20 ubicuo, lo que implica que cualquier aplicación que soporte tokens ERC-20 también puede soportar tokens ERC-3643 sin requerir desarrollo adicional. Esta compatibilidad permite:

- Integración con carteras existentes
- Compatibilidad con exchanges descentralizados
- Interoperabilidad con protocolos DeFi

## Beneficios de la Arquitectura Modular

### Escalabilidad

La separación de responsabilidades permite actualizaciones independientes de cada componente sin afectar el sistema completo.

### Flexibilidad

Las funciones están estandarizadas para proporcionar una interfaz uniforme para varios sistemas automatizados que interactúan con diferentes tokens ERC-3643.

### Seguridad

[La implementación T-REX ha sido auditada externamente por la firma de ciberseguridad Kaspersky, garantizando la robustez del sistema.](https://tokeny.com/kaspersky-gives-the-t-rex-security-token-protocol-green-light/#:~:text=Luxembourg%2C%207th%20July%202020:%20Cybersecurity,issues%20as%20they%20are%20discovered.)

### Cumplimiento Automático

El framework de identidad descentralizado incorporado, ONCHAINID, asegura que solo los usuarios que cumplen con condiciones predefinidas puedan convertirse en tenedores de tokens, incluso en blockchains sin permisos.

### Código ejemplos

1. Interfaz del Token ERC-3643

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IERC3643 {
    // Eventos principales
    event UpdatedTokenInformation(
        string indexed _newName,
        string indexed _newSymbol,
        uint8 _newDecimals,
        string _newVersion,
        address indexed _newOnchainID
    );

    event IdentityRegistryAdded(address indexed _identityRegistry);
    event ComplianceAdded(address indexed _compliance);

    // Funciones de gestión del token
    function setName(string calldata _name) external;
    function setSymbol(string calldata _symbol) external;
    function setOnchainID(address _onchainID) external;

    // Funciones de cumplimiento
    function setIdentityRegistry(address _identityRegistry) external;
    function setCompliance(address _compliance) external;

    // Funciones de transferencia condicional
    function transfer(address _to, uint256 _amount) external returns (bool);
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    // Funciones de verificación
    function isVerified(address _userAddress) external view returns (bool);
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);

    // Funciones de gestión de agentes
    function pause() external;
    function unpause() external;
    function mint(address _to, uint256 _amount) external;
    function burn(address _from, uint256 _amount) external;

    // Recuperación de tokens
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external returns (bool);
}
```

2. Registro de Identidades (Identity Registry)

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IIdentityRegistry {
    // Eventos
    event IdentityStored(
        address indexed investorAddress,
        address indexed identity
    );
    event IdentityUnstored(
        address indexed investorAddress,
        address indexed identity
    );
    event IdentityModified(
        address indexed oldIdentity,
        address indexed newIdentity
    );

    // Gestión de identidades
    function registerIdentity(
        address _userAddress,
        address _identity,
        uint16 _country
    ) external;

    function deleteIdentity(address _userAddress) external;

    function updateIdentity(address _userAddress, address _identity) external;

    function updateCountry(address _userAddress, uint16 _country) external;

    // Verificaciones
    function isVerified(address _userAddress) external view returns (bool);
    function identity(address _userAddress) external view returns (address);
    function investorCountry(
        address _userAddress
    ) external view returns (uint16);

    // Gestión de registros confiables
    function addTrustedIssuer(address _trustedIssuer) external;
    function removeTrustedIssuer(address _trustedIssuer) external;
    function isTrustedIssuer(address _issuer) external view returns (bool);
}
```

3. Registro de Temas de Reclamaciones (Claim Topics Registry)

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IClaimTopicsRegistry {
    // Eventos
    event ClaimTopicAdded(uint256 indexed claimTopic);
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    // Gestión de temas de reclamaciones
    function addClaimTopic(uint256 _claimTopic) external;
    function removeClaimTopic(uint256 _claimTopic) external;

    // Consultas
    function getClaimTopics() external view returns (uint256[] memory);
    function isClaimTopicRequired(
        uint256 _claimTopic
    ) external view returns (bool);
}
```

4. Validación de Transferencias

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

contract ERC3643Token {
    IIdentityRegistry public identityRegistry;
    ICompliance public compliance;

    modifier onlyVerified(address _address) {
        require(identityRegistry.isVerified(_address), 'Address not verified');
        _;
    }

    // Transferencia condicional
    function transfer(
        address _to,
        uint256 _amount
    ) external onlyVerified(msg.sender) onlyVerified(_to) returns (bool) {
        // Verificación de cumplimiento
        require(
            compliance.canTransfer(msg.sender, _to, _amount),
            'Transfer not compliant'
        );

        // Ejecutar transferencia ERC-20 estándar
        return _transfer(msg.sender, _to, _amount);
    }

    // Verificación de elegibilidad
    function isVerified(address _userAddress) external view returns (bool) {
        return identityRegistry.isVerified(_userAddress);
    }

    // Verificación de transferencia sin ejecutar
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool) {
        if (
            !identityRegistry.isVerified(_from) ||
            !identityRegistry.isVerified(_to)
        ) {
            return false;
        }

        return compliance.canTransfer(_from, _to, _amount);
    }
}
```

5. Contrato de Cumplimiento (Compliance)

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface ICompliance {
    // Verificación de transferencia
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool);

    // Verificación específica después de transferencia
    function transferred(address _from, address _to, uint256 _amount) external;

    // Verificación específica después de creación
    function created(address _to, uint256 _amount) external;

    // Verificación específica después de destrucción
    function destroyed(address _from, uint256 _amount) external;

    // Gestión de módulos de cumplimiento
    function addModule(address _module) external;
    function removeModule(address _module) external;
    function isModuleBound(address _module) external view returns (bool);
    function getModules() external view returns (address[] memory);
}
```

6. Ejemplo de Verificación ONCHAINID

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

contract IdentityVerification {
    IClaimTopicsRegistry public claimTopicsRegistry;
    ITrustedIssuersRegistry public trustedIssuersRegistry;

    function verifyIdentityClaims(
        address _identity
    ) external view returns (bool) {
        uint256[] memory requiredClaims = claimTopicsRegistry.getClaimTopics();

        for (uint256 i = 0; i < requiredClaims.length; i++) {
            uint256 claimTopic = requiredClaims[i];

            // Verificar si la identidad tiene la reclamación requerida
            bytes32[] memory claimIds = IIdentity(_identity).getClaimIdsByTopic(
                claimTopic
            );

            if (claimIds.length == 0) {
                return false; // Reclamación requerida faltante
            }

            bool validClaimFound = false;

            for (uint256 j = 0; j < claimIds.length; j++) {
                (, uint256 topic, , address issuer, , ) = IIdentity(_identity)
                    .getClaim(claimIds[j]);

                if (
                    topic == claimTopic &&
                    trustedIssuersRegistry.isTrustedIssuer(issuer)
                ) {
                    validClaimFound = true;
                    break;
                }
            }

            if (!validClaimFound) {
                return false; // No se encontró una reclamación válida
            }
        }

        return true; // Todas las reclamaciones verificadas correctamente
    }
}
```

7. Ejemplo de Configuración de Factory

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

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

interface ITREXFactory {
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
        );
}
```
