# Hoja de Ruta para Integración de Facetas Personalizadas

## Propósito del Documento

Este documento proporciona una hoja de ruta completa para integrar facetas de lógica de negocio personalizadas en la red ISBE. Está diseñado como referencia futura para comprender el proceso completo desde los requisitos del cliente hasta el despliegue en producción.

ISBE opera con lógicas de negocio pre-desplegadas y creación de proxies basada en IDs de Configuración. Los clientes crean proxies pero no pueden desplegar casos de uso personalizados. Este documento aborda esa limitación permitiendo a los clientes añadir facetas personalizadas a sus proxies post-despliegue mediante `diamondCut()`.

## Fundamentos de la Arquitectura ISBE

ISBE utiliza el Patrón Diamond (EIP-2535) con una arquitectura estricta de facetas modulares:

### Patrón de Estructura de Facetas

Cada lógica de negocio en ISBE sigue esta estructura:

1. **XXXInternal.sol** (Opcional) - Estructuras de storage y funciones internas
   - Define struct de storage con posición de slot `keccak256`
   - Implementa accessor privado `_xxxStorage()` usando assembly
   - Contiene funciones auxiliares internas
   - Hereda contratos base abstractos (ej: `DidDocumentDetailedInternal`)

2. **XXX.sol** - Capa de lógica externa
   - Hereda de XXXInternal (si existe) o contratos base
   - Implementa funciones de interfaz con lógica de negocio
   - Aplica modificadores (control de acceso, pausa, validación)
   - Emite eventos

3. **XXXFacet.sol** - Faceta Diamond que expone selectores
   - Hereda de XXX.sol
   - Implementa interfaz `IEIP2535Introspection`
   - Proporciona tres funciones de introspección:
     - `interfacesIntrospection()` - Retorna IDs de interfaces soportadas
     - `businessIdIntrospection()` - Retorna resolver key (business ID)
     - `selectorsIntrospection()` - Retorna array de selectores de función
   - Usado para registro y descubrimiento en diamond

4. **IXXX.sol** - Definición de interfaz
   - Define funciones externas
   - Define eventos
   - Sigue convenciones de nomenclatura ERC/IERC

### Patrón de Storage

ISBE usa **slots de storage aislados** con accessors en assembly:

```solidity
// En XXXInternal.sol
import {_XXX_STORAGE_POSITION} from '../../constants/storagePositions.sol';

struct XXXStorage {
    // Campos de storage
    mapping(uint256 => string) customData;
    uint256 counter;
}

function _xxxStorage() private pure returns (XXXStorage storage storage_) {
    bytes32 position = _XXX_STORAGE_POSITION;
    assembly {
        storage_.slot := position
    }
}
```

Las posiciones de storage se definen en `contracts/constants/storagePositions.sol` usando `keccak256` de identificadores únicos.

### Resolver Keys (Business IDs)

Cada faceta tiene una resolver key única definida en `contracts/constants/resolverKeys.sol`:

```solidity
bytes32 constant _XXX_RESOLVER_KEY = keccak256("XXX_BUSINESS_LOGIC");
```

Estas keys se usan para:
- Generación de IDs de Configuración (algoritmo Position-Based XOR)
- Seguimiento en el registro de lógicas de negocio
- Identificación de facetas Diamond

### Patrón de Inicialización

Las facetas usan un sistema de inicialización personalizado:

```solidity
constructor() {
    _disableInitializers(_XXX_RESOLVER_KEY);
}

function initializeXxx(/* params */) 
    external 
    initializer(_XXX_RESOLVER_KEY) 
{
    _initialize(/* params */);
    emit XxxInitialized(/* params */);
}
```

Esto previene re-inicializaciones y asegura configuración única por resolver key.

## Sistema de Integración de Facetas Personalizadas

### Visión General

El sistema permite a los clientes:
1. Desarrollar facetas personalizadas siguiendo la arquitectura ISBE
2. Enviar facetas al equipo ISBE para auditoría y registro
3. Integrar facetas en sus proxies existentes mediante `diamondCut()`

### Flujo de Trabajo

```
[Desarrollador Cliente]
    ↓ (1) Desarrollar faceta personalizada
    ↓ (2) Probar localmente
    ↓ (3) Enviar para auditoría
    ↓
[Equipo ISBE]
    ↓ (4) Auditar código
    ↓ (5) Desplegar faceta
    ↓ (6) Registrar en BusinessLogicRegistry
    ↓ (7) Generar resolver key
    ↓ (8) Retornar información de despliegue
    ↓
[Cliente]
    ↓ (9) Llamar diamondCut() en proxy
    ↓ (10) Verificar integración
    ↓
[Listo para Producción]
```

## Guía de Implementación

### Parte 1: Guía para Desarrolladores Cliente

#### Paso 1.1: Comprender Requisitos

Antes de desarrollar una faceta personalizada, identificar:
- **Funcionalidad necesaria**: ¿Qué operaciones debe realizar la faceta?
- **Requisitos de storage**: ¿Qué datos necesitan persistirse?
- **Control de acceso**: ¿Quién puede llamar estas funciones?
- **Puntos de integración**: ¿Interactúa con facetas existentes?

#### Paso 1.2: Seguir el Patrón de Arquitectura ISBE

Crear cuatro archivos siguiendo el patrón exacto de ISBE:

##### Archivo 1: XXXInternal.sol (Opcional)

Crear este archivo SOLO si necesitas storage personalizado. Si tu faceta solo lee/modifica storage existente, omite este archivo.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BaseInheritance} from 'path/to/base';

// La posición de storage será proporcionada por el equipo ISBE después del registro
bytes32 constant _XXX_STORAGE_POSITION = 0x0000000000000000000000000000000000000000000000000000000000000000; // Placeholder

abstract contract XXXInternal is BaseInheritance {
    struct XXXStorage {
        // Define tus campos de storage
        mapping(uint256 => string) customData;
        uint256 counter;
    }

    function _initialize(/* params */) internal {
        XXXStorage storage $ = _xxxStorage();
        // Inicializar storage
        $.counter = 0;
    }

    // Funciones auxiliares internas
    function _internalOperation(uint256 id) internal view returns (string memory) {
        return _xxxStorage().customData[id];
    }

    function _xxxStorage() private pure returns (XXXStorage storage storage_) {
        bytes32 position = _XXX_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}
```

##### Archivo 2: XXX.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {XXXInternal} from './XXXInternal.sol'; // O contrato base si no hay Internal
import {IXXX} from './IXXX.sol';
// Importar modificadores y constantes según sea necesario

// Resolver key será proporcionada por el equipo ISBE
bytes32 constant _XXX_RESOLVER_KEY = 0x0000000000000000000000000000000000000000000000000000000000000000; // Placeholder

abstract contract XXX is IXXX, XXXInternal {
    constructor() {
        _disableInitializers(_XXX_RESOLVER_KEY);
    }

    function initializeXxx(/* params */) 
        external 
        override 
        initializer(_XXX_RESOLVER_KEY) 
    {
        _initialize(/* params */);
        emit XxxInitialized(/* params */);
    }

    // Funciones externas implementando interfaz IXXX
    function publicOperation(uint256 id) 
        external 
        override
        whenNotPaused // Aplicar modificadores según sea necesario
        returns (string memory) 
    {
        // Lógica de negocio
        return _internalOperation(id);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IXXX).interfaceId;
    }
}
```

##### Archivo 3: XXXFacet.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_XXX_RESOLVER_KEY} from 'path/to/resolverKeys'; // Será añadido por ISBE
import {XXX} from './XXX.sol';
import {IEIP2535Introspection} from 'path/to/introspection';

contract XXXFacet is XXX, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _XXX_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        // Contar total de selectores (initialize + funciones externas)
        uint256 selectorsLength = 2; // Ajustar según tus funciones
        selectors_ = new bytes4[](selectorsLength);
        
        // Añadir selectores en orden inverso
        selectors_[--selectorsLength] = this.initializeXxx.selector;
        selectors_[--selectorsLength] = this.publicOperation.selector;
    }
}
```

##### Archivo 4: IXXX.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IXXX {
    // Eventos
    event XxxInitialized(/* params */);
    event OperationExecuted(uint256 indexed id, string data);

    // Funciones
    function initializeXxx(/* params */) external;
    function publicOperation(uint256 id) external returns (string memory);
}
```

#### Paso 1.3: Requisitos de Testing

Crear tests comprehensivos siguiendo la estructura de tests de ISBE:

```solidity
// test/tokens/xxx/XXX.test.ts
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

describe("XXX Custom Facet", function () {
    // Probar inicialización
    it("Should initialize correctly", async function () {
        // Código de test
    });

    // Probar lógica de negocio
    it("Should execute custom operation", async function () {
        // Código de test
    });

    // Probar control de acceso
    it("Should enforce role restrictions", async function () {
        // Código de test
    });

    // Probar aislamiento de storage
    it("Should not conflict with existing storage", async function () {
        // Código de test
    });
});
```

#### Paso 1.4: Paquete de Envío

Preparar y enviar:

1. **Código Fuente**
   - Los cuatro archivos de contrato (Internal, Logic, Facet, Interface)
   - Archivos de test con >90% de cobertura
   - README explicando funcionalidad

2. **Documentación**
   - Especificaciones de funciones
   - Diagrama de layout de storage
   - Requisitos de integración
   - Consideraciones de seguridad

3. **Configuración de Despliegue**
   - Parámetros del constructor
   - Parámetros de inicialización
   - Roles/permisos requeridos

### Parte 2: Tareas del Equipo ISBE

#### Paso 2.1: Proceso de Auditoría

Revisar el envío para:

1. **Cumplimiento de Arquitectura**
   - Sigue el patrón de facetas ISBE (Internal/Logic/Facet/Interface)
   - Implementación correcta de introspección
   - Aislamiento apropiado de storage
   - Cumplimiento del patrón de inicialización

2. **Seguridad**
   - Implementación de control de acceso
   - Protección contra reentrada
   - Verificaciones de overflow/underflow
   - Prevención de colisiones de storage

3. **Optimización de Gas**
   - Uso eficiente de storage
   - Llamadas externas mínimas
   - Loops y operaciones optimizados

4. **Calidad de Código**
   - Mejores prácticas de Solidity
   - Documentación clara
   - Tests comprehensivos

#### Paso 2.2: Generar Constantes

Después de la aprobación, generar constantes únicas:

##### Posición de Storage (si existe storage personalizado)

```bash
# Generar posición de storage
cast keccak "isbe.storage.CustomFacetName"
# Resultado: 0xabcd...1234

# Añadir a contracts/constants/storagePositions.sol
bytes32 constant _CUSTOM_FACET_STORAGE_POSITION = 0xabcd...1234;
```

##### Resolver Key

```bash
# Generar resolver key
cast keccak "CUSTOM_FACET_BUSINESS_LOGIC"
# Resultado: 0xef12...5678

# Añadir a contracts/constants/resolverKeys.sol
bytes32 constant _CUSTOM_FACET_RESOLVER_KEY = 0xef12...5678;
```

#### Paso 2.3: Actualizar Contratos del Cliente

1. Reemplazar constantes placeholder en contratos del cliente:
   ```solidity
   // En XXXInternal.sol (si existe)
   import {_CUSTOM_FACET_STORAGE_POSITION} from '../../constants/storagePositions.sol';
   
   // En XXX.sol
   import {_CUSTOM_FACET_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
   
   // En XXXFacet.sol
   import {_CUSTOM_FACET_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
   ```

2. Actualizar imports para usar rutas ISBE

3. Ejecutar tests para verificar integración

#### Paso 2.4: Desplegar Faceta

Crear script de despliegue:

```typescript
// scripts/custom/deploy-custom-facet.ts
import { ethers } from "hardhat";
import { updateBusinessLogicRegistry } from "../utils/registry";

async function main() {
    const CustomFacet = await ethers.getContractFactory("CustomFacetName");
    const customFacet = await CustomFacet.deploy();
    await customFacet.waitForDeployment();
    
    const address = await customFacet.getAddress();
    console.log(`CustomFacet deployed to: ${address}`);
    
    // Obtener datos de introspección
    const businessId = await customFacet.businessIdIntrospection();
    const selectors = await customFacet.selectorsIntrospection();
    
    console.log(`Business ID: ${businessId}`);
    console.log(`Selectors: ${selectors}`);
    
    return { address, businessId, selectors };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

Ejecutar despliegue:

```bash
npx hardhat run scripts/custom/deploy-custom-facet.ts --network <network-name>
```

#### Paso 2.5: Registrar en BusinessLogicRegistry

Crear tarea de registro:

```typescript
// tasks/custom/registerCustomFacet.ts
import { task } from "hardhat/config";

task("register:custom-facet", "Register custom facet in BusinessLogicRegistry")
    .addParam("facet", "Facet contract address")
    .addParam("businessId", "Business ID (resolver key)")
    .setAction(async (taskArgs, hre) => {
        const { facet, businessId } = taskArgs;
        
        const registry = await hre.ethers.getContractAt(
            "BusinessLogicRegistry",
            process.env.BUSINESS_LOGIC_REGISTRY_ADDRESS
        );
        
        const facetContract = await hre.ethers.getContractAt(
            "IEIP2535Introspection",
            facet
        );
        
        const selectors = await facetContract.selectorsIntrospection();
        
        const tx = await registry.registerBusinessLogic(
            businessId,
            facet,
            selectors
        );
        
        await tx.wait();
        
        console.log(`Custom facet registered:`);
        console.log(`  Business ID: ${businessId}`);
        console.log(`  Facet Address: ${facet}`);
        console.log(`  Selectors: ${selectors.length}`);
    });
```

Ejecutar registro:

```bash
npx hardhat register:custom-facet \
    --facet <deployed-facet-address> \
    --business-id <resolver-key> \
    --network <network-name>
```

#### Paso 2.6: Proporcionar Información de Integración al Cliente

Enviar al cliente el paquete de despliegue:

```json
{
    "facetName": "CustomFacet",
    "facetAddress": "0xABCD...1234",
    "businessId": "0xef12...5678",
    "selectors": [
        "0x12345678",
        "0x9abcdef0"
    ],
    "initializeSelector": "0x12345678",
    "initializeParams": {
        "types": ["string", "uint256"],
        "description": "Initialize custom facet with name and counter"
    },
    "networkDeployedOn": "isbe-mainnet",
    "deploymentDate": "2024-01-15"
}
```

### Parte 3: Proceso de Integración del Cliente

#### Paso 3.1: Verificar Despliegue de Faceta

El cliente debe verificar que la faceta está correctamente desplegada y registrada:

```typescript
// scripts/client/verify-facet.ts
import { ethers } from "hardhat";

async function verifyFacet(facetAddress: string, expectedBusinessId: string) {
    const facet = await ethers.getContractAt("IEIP2535Introspection", facetAddress);
    
    // Verificar business ID
    const businessId = await facet.businessIdIntrospection();
    console.log(`Business ID: ${businessId}`);
    console.log(`Expected: ${expectedBusinessId}`);
    console.log(`Match: ${businessId === expectedBusinessId}`);
    
    // Obtener selectores
    const selectors = await facet.selectorsIntrospection();
    console.log(`Selectors (${selectors.length}):`);
    selectors.forEach((sel, idx) => console.log(`  [${idx}] ${sel}`));
    
    // Verificar interfaces
    const interfaces = await facet.interfacesIntrospection();
    console.log(`Interfaces: ${interfaces}`);
}

// Uso
verifyFacet("0xABCD...1234", "0xef12...5678");
```

#### Paso 3.2: Preparar Datos de DiamondCut

Crear script de integración:

```typescript
// scripts/client/integrate-custom-facet.ts
import { ethers } from "hardhat";

interface FacetCut {
    facetAddress: string;
    action: 0 | 1 | 2; // Add=0, Replace=1, Remove=2
    functionSelectors: string[];
}

async function integrateFacet(
    proxyAddress: string,
    facetAddress: string,
    selectors: string[],
    initializeCalldata?: string
) {
    const proxy = await ethers.getContractAt("IDiamondCut", proxyAddress);
    
    // Preparar facet cut
    const facetCut: FacetCut = {
        facetAddress: facetAddress,
        action: 0, // Add
        functionSelectors: selectors
    };
    
    // Ejecutar diamond cut
    const tx = await proxy.diamondCut(
        [facetCut],
        facetAddress, // init contract (usar la faceta misma si tiene inicializador)
        initializeCalldata || "0x" // init calldata
    );
    
    await tx.wait();
    console.log(`Facet integrated successfully!`);
    console.log(`Transaction: ${tx.hash}`);
}

// Ejemplo de uso
const facetAddress = "0xABCD...1234";
const selectors = ["0x12345678", "0x9abcdef0"];

// Codificar llamada de inicialización
const initCalldata = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "uint256"],
    ["MyToken", 100]
);

integrateFacet(
    "0xPROXY...ADDRESS",
    facetAddress,
    selectors,
    initCalldata
);
```

#### Paso 3.3: Ejecutar Diamond Cut

Ejecutar script de integración:

```bash
npx hardhat run scripts/client/integrate-custom-facet.ts --network <network-name>
```

La función `diamondCut()` hará:
1. Validar los datos de facet cut
2. Añadir selectores de función al diamond
3. Mapear selectores a dirección de faceta
4. Ejecutar inicialización si se proporciona
5. Emitir evento `DiamondCut`

#### Paso 3.4: Verificar Integración

Probar la faceta integrada:

```typescript
// scripts/client/test-integration.ts
import { ethers } from "hardhat";

async function testIntegration(proxyAddress: string) {
    // Obtener proxy con ABI de faceta personalizada
    const customInterface = new ethers.Interface([
        "function publicOperation(uint256 id) returns (string)",
        "function customFunction() view returns (uint256)"
    ]);
    
    const proxy = new ethers.Contract(
        proxyAddress,
        customInterface,
        ethers.provider
    );
    
    // Probar funciones personalizadas
    const result = await proxy.publicOperation(1);
    console.log(`Operation result: ${result}`);
    
    const value = await proxy.customFunction();
    console.log(`Custom value: ${value}`);
}

testIntegration("0xPROXY...ADDRESS");
```

#### Paso 3.5: Actualizar Documentación del Cliente

Documentar la integración en un archivo README:

**Ejemplo de documentación:**

- **Faceta**: CustomFacet
- **Dirección**: 0xABCD...1234
- **Business ID**: 0xef12...5678
- **Red**: isbe-mainnet
- **Integrada el**: 2024-01-15

**Funciones Disponibles:**
- `initializeXxx(string name, uint256 counter)` - Inicializar faceta
- `publicOperation(uint256 id) returns (string)` - Ejecutar operación
- `customFunction() view returns (uint256)` - Ver datos personalizados

**Ejemplo de Uso:**
```javascript
const proxy = await ethers.getContractAt("CustomFacet", proxyAddress);
const result = await proxy.publicOperation(1);
```

**Transacción de Integración:**
- TX Hash: 0xTX...HASH
- Bloque: 123456

## Ejemplo Concreto: Faceta Personalizada ERC721 TokenURI

Este ejemplo demuestra cómo añadir funcionalidad personalizada de tokenURI a un token ERC721.

### Caso de Uso

El cliente ha desplegado un proxy ERC721 usando configuración estándar ISBE. Necesitan:
1. Establecer URI base personalizada para metadatos
2. Establecer URIs individuales para NFTs específicos
3. Sobrescribir comportamiento por defecto de tokenURI

### Arquitectura

Siguiendo el patrón ISBE exactamente:

```
contracts/tokens/erc721/extensions/customuri/
├── ERC721CustomURIInternal.sol    (Storage + internos)
├── ERC721CustomURI.sol             (Lógica externa)
├── ERC721CustomURIFacet.sol        (Faceta Diamond)
└── IERC721CustomURI.sol            (Interfaz)
```

### Archivos de Implementación

#### IERC721CustomURI.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC721CustomURI {
    // Eventos
    event CustomURIInitialized(string baseURI);
    event BaseURIUpdated(string newBaseURI);
    event TokenURIUpdated(uint256 indexed tokenId, string tokenURI);
    
    // Funciones
    function initializeCustomURI(string memory baseURI_) external;
    function setBaseURI(string memory newBaseURI) external;
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
```

#### ERC721CustomURIInternal.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../../ERC721Internal.sol';
import {_ERC721_CUSTOM_URI_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

abstract contract ERC721CustomURIInternal is ERC721Internal {
    struct ERC721CustomURIStorage {
        string baseURI;
        mapping(uint256 => string) tokenURIs;
    }
    
    function _initializeCustomURI(string memory baseURI_) internal {
        ERC721CustomURIStorage storage $ = _erc721CustomURIStorage();
        $.baseURI = baseURI_;
    }
    
    function _setBaseURI(string memory newBaseURI) internal {
        _erc721CustomURIStorage().baseURI = newBaseURI;
    }
    
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal {
        _erc721CustomURIStorage().tokenURIs[tokenId] = tokenURI_;
    }
    
    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        ERC721CustomURIStorage storage $ = _erc721CustomURIStorage();
        
        string memory _tokenURIValue = $.tokenURIs[tokenId];
        string memory base = $.baseURI;
        
        // Si el token tiene URI específica, retornarla
        if (bytes(_tokenURIValue).length > 0) {
            return _tokenURIValue;
        }
        
        // De lo contrario retornar baseURI + tokenId
        if (bytes(base).length > 0) {
            return string(abi.encodePacked(base, _toString(tokenId)));
        }
        
        return "";
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _erc721CustomURIStorage() 
        private 
        pure 
        returns (ERC721CustomURIStorage storage storage_) 
    {
        bytes32 position = _ERC721_CUSTOM_URI_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}
```

#### ERC721CustomURI.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721CustomURIInternal} from './ERC721CustomURIInternal.sol';
import {IERC721CustomURI} from './IERC721CustomURI.sol';
import {_ERC721_CUSTOM_URI_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {_METADATA_ROLE} from '../../../../constants/roles.sol';

abstract contract ERC721CustomURI is IERC721CustomURI, ERC721CustomURIInternal {
    constructor() {
        _disableInitializers(_ERC721_CUSTOM_URI_RESOLVER_KEY);
    }
    
    function initializeCustomURI(string memory baseURI_) 
        external 
        override 
        initializer(_ERC721_CUSTOM_URI_RESOLVER_KEY) 
    {
        _initializeCustomURI(baseURI_);
        emit CustomURIInitialized(baseURI_);
    }
    
    function setBaseURI(string memory newBaseURI) 
        external 
        override 
        onlyRole(_METADATA_ROLE) 
        whenNotPaused 
    {
        _setBaseURI(newBaseURI);
        emit BaseURIUpdated(newBaseURI);
    }
    
    function setTokenURI(uint256 tokenId, string memory tokenURI_) 
        external 
        override 
        onlyRole(_METADATA_ROLE) 
        whenNotPaused 
    {
        _checkTokenOwned(tokenId);
        _setTokenURI(tokenId, tokenURI_);
        emit TokenURIUpdated(tokenId, tokenURI_);
    }
    
    function tokenURI(uint256 tokenId) 
        external 
        view 
        override 
        returns (string memory) 
    {
        _checkTokenOwned(tokenId);
        return _tokenURI(tokenId);
    }
    
    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC721CustomURI).interfaceId;
    }
}
```

#### ERC721CustomURIFacet.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC721_CUSTOM_URI_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721CustomURI} from './ERC721CustomURI.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC721CustomURIFacet is ERC721CustomURI, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC721_CUSTOM_URI_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeCustomURI.selector;
        selectors_[--selectorsLength] = this.setBaseURI.selector;
        selectors_[--selectorsLength] = this.setTokenURI.selector;
        selectors_[--selectorsLength] = this.tokenURI.selector;
    }
}
```

### Constantes Requeridas

#### contracts/constants/storagePositions.sol

```solidity
// Añadir esta línea
bytes32 constant _ERC721_CUSTOM_URI_STORAGE_POSITION = keccak256("isbe.storage.ERC721CustomURI");
```

#### contracts/constants/resolverKeys.sol

```solidity
// Añadir esta línea
bytes32 constant _ERC721_CUSTOM_URI_RESOLVER_KEY = keccak256("ERC721_CUSTOM_URI_BUSINESS_LOGIC");
```

### Ejemplo de Integración del Cliente

#### Paso 1: Verificar Despliegue

```typescript
const facetAddress = "0xABCD...1234"; // Proporcionada por equipo ISBE
const facet = await ethers.getContractAt("IEIP2535Introspection", facetAddress);

const businessId = await facet.businessIdIntrospection();
console.log(`Business ID: ${businessId}`);

const selectors = await facet.selectorsIntrospection();
console.log(`Selectors: ${selectors}`);
```

#### Paso 2: Preparar Diamond Cut

```typescript
const proxyAddress = "0xPROXY...ADDRESS";
const proxy = await ethers.getContractAt("IDiamondCut", proxyAddress);

const facetCut = {
    facetAddress: facetAddress,
    action: 0, // Add
    functionSelectors: selectors
};

// Codificar inicialización
const initCalldata = ethers.AbiCoder.defaultAbiCoder().encodeFunctionCall(
    {
        name: "initializeCustomURI",
        type: "function",
        inputs: [{ type: "string", name: "baseURI_" }]
    },
    ["https://api.mynft.com/metadata/"]
);
```

#### Paso 3: Ejecutar Integración

```typescript
const tx = await proxy.diamondCut(
    [facetCut],
    facetAddress,
    initCalldata
);

await tx.wait();
console.log(`Custom URI facet integrated! TX: ${tx.hash}`);
```

#### Paso 4: Usar Funcionalidad Personalizada

```typescript
const customURIFacet = await ethers.getContractAt("IERC721CustomURI", proxyAddress);

// Establecer URI específica para token
await customURIFacet.setTokenURI(1, "https://special.com/token/1");

// Obtener URI del token
const uri = await customURIFacet.tokenURI(1);
console.log(`Token URI: ${uri}`); // "https://special.com/token/1"

// Token sin URI específica usa baseURI + tokenId
const uri2 = await customURIFacet.tokenURI(2);
console.log(`Token URI: ${uri2}`); // "https://api.mynft.com/metadata/2"
```

### Manejo de Conflictos de Selectores

Si el proxy ya tiene una función `tokenURI(uint256)` del ERC721Facet base, la nueva faceta personalizada la SOBRESCRIBIRÁ ya que `diamondCut()` con acción `Replace` (action=1) puede reemplazar selectores existentes.

Para reemplazar en lugar de añadir:

```typescript
const facetCut = {
    facetAddress: facetAddress,
    action: 1, // Replace en lugar de Add
    functionSelectors: [
        "0x...", // selector de tokenURI
        // Solo incluir selectores que necesitan reemplazo
    ]
};
```

## Consideraciones Importantes

### Prevención de Colisión de Storage

Siempre usar posiciones de storage únicas generadas mediante `keccak256`. Nunca reutilizar posiciones de otras facetas.

### Conflictos de Selectores

Antes de la integración, verificar que los selectores no entran en conflicto:

```typescript
const diamondLoupe = await ethers.getContractAt("IDiamondLoupe", proxyAddress);
const existingFacets = await diamondLoupe.facets();

for (const selector of newSelectors) {
    for (const facet of existingFacets) {
        if (facet.functionSelectors.includes(selector)) {
            console.warn(`Selector ${selector} already exists in facet ${facet.facetAddress}`);
        }
    }
}
```

### Orden de Inicialización

Si la faceta personalizada depende de otras facetas, asegurar que se inicialicen primero:

```typescript
// Inicializar dependencias primero
await proxy.initializeErc721("MyNFT", "MNFT");

// Luego inicializar faceta personalizada
await proxy.initializeCustomURI("https://api.mynft.com/metadata/");
```

### Control de Acceso

Las facetas personalizadas heredan el control de acceso basado en roles de ISBE. Asegurar asignaciones de roles apropiadas:

```typescript
const accessControl = await ethers.getContractAt("IAccessControl", proxyAddress);

// Otorgar METADATA_ROLE al admin
await accessControl.grantRole(METADATA_ROLE, adminAddress);
```

### Actualizabilidad

Las facetas personalizadas pueden actualizarse mediante `diamondCut()` con acción `Replace`:

```typescript
const facetCut = {
    facetAddress: newFacetAddress,
    action: 1, // Replace
    functionSelectors: selectors
};

await proxy.diamondCut([facetCut], ethers.ZeroAddress, "0x");
```

### Consideraciones de Gas

Cada operación `diamondCut()` cuesta gas. Agrupar múltiples adiciones de facetas cuando sea posible:

```typescript
const facetCuts = [
    { facetAddress: customURI, action: 0, functionSelectors: uriSelectors },
    { facetAddress: customRoyalty, action: 0, functionSelectors: royaltySelectors }
];

await proxy.diamondCut(facetCuts, ethers.ZeroAddress, "0x");
```

## Estrategia de Testing

### Tests Unitarios

Probar faceta de forma aislada:

```solidity
import { ERC721CustomURIFacet } from "contracts/tokens/erc721/extensions/customuri/ERC721CustomURIFacet.sol";

describe("ERC721CustomURIFacet", function () {
    it("Should set and get base URI", async function () {
        // Desplegar faceta
        const CustomURI = await ethers.getContractFactory("ERC721CustomURIFacet");
        const customURI = await CustomURI.deploy();
        
        // Inicializar
        await customURI.initializeCustomURI("https://base.com/");
        
        // Probar funcionalidad
        await customURI.setTokenURI(1, "https://special.com/1");
        expect(await customURI.tokenURI(1)).to.equal("https://special.com/1");
    });
});
```

### Tests de Integración

Probar con proxy diamond:

```solidity
describe("Diamond Integration", function () {
    it("Should integrate custom URI facet", async function () {
        // Desplegar diamond base
        const diamond = await deployDiamond();
        
        // Desplegar faceta personalizada
        const CustomURI = await ethers.getContractFactory("ERC721CustomURIFacet");
        const customURI = await CustomURI.deploy();
        
        // Integrar mediante diamondCut
        const selectors = await customURI.selectorsIntrospection();
        await diamond.diamondCut(
            [{ facetAddress: customURI.address, action: 0, functionSelectors: selectors }],
            customURI.address,
            customURI.interface.encodeFunctionData("initializeCustomURI", ["https://base.com/"])
        );
        
        // Verificar integración
        const uri = await ethers.getContractAt("IERC721CustomURI", diamond.address);
        await uri.setTokenURI(1, "test");
        expect(await uri.tokenURI(1)).to.equal("test");
    });
});
```

### Tests End-to-End

Probar flujo completo:

```typescript
describe("Custom Facet E2E", function () {
    it("Should complete full integration workflow", async function () {
        // 1. Cliente crea proxy
        const proxy = await createERC721Proxy();
        
        // 2. ISBE despliega faceta personalizada
        const customFacet = await deployCustomFacet();
        
        // 3. Cliente integra faceta
        await integrateCustomFacet(proxy, customFacet);
        
        // 4. Cliente usa funcionalidad personalizada
        const result = await useCustomFunctionality(proxy);
        
        expect(result).to.be.valid;
    });
});
```

## Mejoras Futuras

### Portal Web para Facetas Personalizadas

Una implementación futura podría incluir:

1. **Interfaz de Envío**
   - Subir contratos mediante formulario web
   - Validación básica automatizada
   - Envío de resultados de tests

2. **Panel de Auditoría**
   - Revisar facetas enviadas
   - Aprobar/rechazar con comentarios
   - Seguimiento de estado de auditoría

3. **Automatización de Despliegue**
   - Despliegue con un clic después de aprobación
   - Registro automático en registry
   - Generar paquetes de integración

4. **Ayudante de Integración para Cliente**
   - Interfaz web para generar scripts de integración
   - Datos de transacción pre-rellenados
   - Herramientas de verificación

### Marketplace de Facetas

Considerar construir un marketplace donde:
- Se listen facetas aprobadas por ISBE
- Los clientes puedan navegar y seleccionar facetas
- Integración con un clic en proxies desplegados
- Valoraciones y reseñas de la comunidad

## Resumen

Esta hoja de ruta proporciona una guía completa para implementar integración de facetas personalizadas en la red ISBE:

1. **Clientes** desarrollan facetas siguiendo exactamente los patrones de arquitectura ISBE
2. **Equipo ISBE** audita, despliega y registra facetas con constantes únicas
3. **Clientes** integran facetas en sus proxies mediante `diamondCut()`
4. **Producción** los proxies ganan funcionalidad personalizada sin redespliegue

El principio clave es mantener adhesión estricta a los patrones arquitectónicos de ISBE:
- Aislamiento de storage mediante accessors en assembly
- Identificación por resolver key
- Estructura de cuatro archivos (Internal/Logic/Facet/Interface)
- Implementación de introspección
- Patrón de inicialización

Esto asegura consistencia, seguridad y mantenibilidad en todas las facetas personalizadas del ecosistema ISBE.
