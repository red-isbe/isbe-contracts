# Guía de Desarrollo de Facetas Personalizadas para Clientes ISBE

## Introducción

Esta guía está dirigida a desarrolladores que deseen extender la funcionalidad de sus proxies en la red ISBE. La arquitectura de ISBE se basa en el **Patrón Diamond (EIP-2535)**, lo que permite una modularidad y actualizabilidad sin precedentes.

Para integrar su propia lógica de negocio (por ejemplo, una gestión de metadatos personalizada, un sistema de royalties único, o lógica de validación específica), debe seguir estrictamente los patrones de diseño de ISBE.

## Estándar de Desarrollo ISBE

A diferencia de los contratos inteligentes monolíticos tradicionales, en ISBE cada funcionalidad se divide en cuatro componentes distintos. Esto asegura que el almacenamiento no colisione y que la lógica sea actualizable.

### Estructura de Archivos Requerida

Para cada nueva funcionalidad (llamémosla `MiFuncionalidad`), debe crear:

1.  **`IMiFuncionalidad.sol`**: La interfaz pública.
2.  **`MiFuncionalidadInternal.sol`**: El manejo del almacenamiento y funciones internas.
3.  **`MiFuncionalidad.sol`**: La lógica externa (implementación).
4.  **`MiFuncionalidadFacet.sol`**: El punto de entrada para el Diamond (selectores e introspección).

---

## Template de Implementación

A continuación, se presentan las plantillas que debe utilizar. Copie y adapte este código.

### 1. La Interfaz (`IMiFuncionalidad.sol`)

Defina aquí los eventos y las funciones externas.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IMiFuncionalidad {
    event MiFuncionalidadInicializada(uint256 valorInicial);
    event DatosActualizados(string nuevoDato);

    function inicializarMiFuncionalidad(uint256 valor) external;
    function obtenerDato() external view returns (string memory);
    function actualizarDato(string memory nuevoDato) external;
}
```

### 2. El Contrato Interno (`MiFuncionalidadInternal.sol`)

**CRÍTICO:** Este archivo maneja el almacenamiento. Debe definir una posición de almacenamiento única para evitar corromper los datos de otros módulos (como ERC20 o ERC721).

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Defina una constante única. Use keccak256 con un string único para su proyecto.
bytes32 constant _MI_FUNCIONALIDAD_STORAGE_POSITION = keccak256("cliente.storage.MiFuncionalidad");

abstract contract MiFuncionalidadInternal {
    struct MiFuncionalidadStorage {
        string dato;
        uint256 valor;
        bool inicializado;
    }

    function _miFuncionalidadStorage() private pure returns (MiFuncionalidadStorage storage storage_) {
        bytes32 position = _MI_FUNCIONALIDAD_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }

    function _inicializarInterno(uint256 valor) internal {
        MiFuncionalidadStorage storage $ = _miFuncionalidadStorage();
        $.valor = valor;
        $.inicializado = true;
    }

    function _obtenerDatoInterno() internal view returns (string memory) {
        return _miFuncionalidadStorage().dato;
    }

    function _actualizarDatoInterno(string memory nuevoDato) internal {
        _miFuncionalidadStorage().dato = nuevoDato;
    }
}
```

### 3. La Lógica (`MiFuncionalidad.sol`)

Aquí reside la implementación de la interfaz. Hereda del contrato interno.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MiFuncionalidadInternal} from "./MiFuncionalidadInternal.sol";
import {IMiFuncionalidad} from "./IMiFuncionalidad.sol";

// Clave única para el inicializador.
bytes32 constant _MI_FUNCIONALIDAD_RESOLVER_KEY = keccak256("cliente.resolver.MiFuncionalidad");

abstract contract MiFuncionalidad is IMiFuncionalidad, MiFuncionalidadInternal {
    
    // Constructor para deshabilitar inicializadores en el contrato de implementación
    constructor() {
        // Nota: _disableInitializers es una función que debe importar de sus utilidades o implementar
        // Si no dispone de ella, asegúrese de que el contrato no se pueda inicializar directamente.
    }

    // Función de inicialización protegida
    function inicializarMiFuncionalidad(uint256 valor) external override {
        // Aquí debería ir un modificador 'initializer(_MI_FUNCIONALIDAD_RESOLVER_KEY)'
        _inicializarInterno(valor);
        emit MiFuncionalidadInicializada(valor);
    }

    function obtenerDato() external view override returns (string memory) {
        return _obtenerDatoInterno();
    }

    function actualizarDato(string memory nuevoDato) external override {
        // Puede añadir modificadores de acceso aquí (ej: onlyRole)
        _actualizarDatoInterno(nuevoDato);
        emit DatosActualizados(nuevoDato);
    }
    
    // Función auxiliar para la introspección
    function _implementedInterfaces() internal pure virtual returns (bytes4[] memory interfaces_) {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IMiFuncionalidad).interfaceId;
    }
}
```

### 4. La Faceta (`MiFuncionalidadFacet.sol`)

Este es el contrato que se despliega. Conecta su lógica con el sistema Diamond de ISBE.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MiFuncionalidad} from "./MiFuncionalidad.sol";
// Importar IEIP2535Introspection proporcionada por ISBE
import {IEIP2535Introspection} from "../../proxies/eip2535/interfaces/IEIP2535Introspection.sol";

contract MiFuncionalidadFacet is MiFuncionalidad, IEIP2535Introspection {
    
    function interfacesIntrospection() external pure override returns (bytes4[] memory interfaces_) {
        return _implementedInterfaces();
    }

    function businessIdIntrospection() external pure override returns (bytes32 businessId_) {
        // Retorna la misma clave definida en la Lógica
        businessId_ = keccak256("cliente.resolver.MiFuncionalidad");
    }

    function selectorsIntrospection() external pure override returns (bytes4[] memory selectors_) {
        // Liste TODOS los selectores públicos de su faceta
        selectors_ = new bytes4[](3);
        selectors_[0] = this.inicializarMiFuncionalidad.selector;
        selectors_[1] = this.obtenerDato.selector;
        selectors_[2] = this.actualizarDato.selector;
    }
}
```

---

## Ejemplo Práctico: TokenURI Personalizado (ERC721)

Si desea personalizar la metadata de sus NFTs, implemente este módulo.

**Caso de uso:** Usted quiere que cada token tenga una URI base diferente o lógica dinámica, en lugar de la estándar de ISBE.

### 1. Interfaz
```solidity
interface IERC721CustomURI {
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
```

### 2. Internal (Storage)
```solidity
abstract contract ERC721CustomURIInternal {
    bytes32 constant _STORAGE_POSITION = keccak256("cliente.erc721.custom.uri");
    
    struct CustomURIStorage {
        mapping(uint256 => string) tokenURIs;
    }

    function _customURIStorage() private pure returns (CustomURIStorage storage s) {
        bytes32 position = _STORAGE_POSITION;
        assembly { s.slot := position }
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _customURIStorage().tokenURIs[tokenId] = uri;
    }

    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        return _customURIStorage().tokenURIs[tokenId];
    }
}
```

### 3. Lógica y Faceta
Implemente la lógica heredando de `ERC721CustomURIInternal` y cree la Faceta exponiendo `tokenURI` y `setTokenURI` en `selectorsIntrospection`.

---

## Integración en su Proxy

### Custom-ID

En ISBE, el **Custom-ID** (o `businessId`) es el identificador lógico y permanente de su funcionalidad en el registro de la red. Sin embargo, el estándar **Diamond (EIP-2535)** opera a bajo nivel y requiere la **dirección física del contrato** (`facetAddress`) para enrutar las llamadas.

Por tanto, el flujo de integración siempre tiene dos pasos:
1.  **Resolución:** Consultar al registro de ISBE (`BusinessLogicFactory`) qué dirección de contrato corresponde a su `Custom-ID`.
2.  **Integración:** Usar esa dirección para ejecutar el `diamondCut` en su proxy.

### Ejemplo Paso a Paso: De Cero a Custom

Supongamos que usted es un cliente que quiere desplegar un token ERC721 y luego añadirle su funcionalidad personalizada de `TokenURI`.

#### Paso 1: Obtener su Proxy (Caso de Uso Estándar)

Primero, usted solicita a la factoría de ISBE que le despliegue un proxy base con la configuración estándar de ERC721.

*   **Configuration ID:** `ERC721_BASIC` (Proporcionado por ISBE)
*   **Resultado:** Usted recibe la dirección de su nuevo proxy: `0xMyProxyAddress`.

#### Paso 2: Resolver su Faceta Personalizada

Usted ya ha registrado su faceta personalizada con el ID `keccak256("cliente.miempresa.customUri")`. Ahora necesita su dirección actual.

```javascript
// Dirección del contrato BusinessLogicFactory de ISBE (pública)
const factoryAddress = "0xFactoryAddress..."; 
const factory = await ethers.getContractAt("IBusinessLogicFactory", factoryAddress);

// Su Custom-ID
const customId = ethers.id("cliente.miempresa.customUri"); 

// Consultar la dirección de la última versión
const facetAddress = await factory.getBusinessLogicAddress(customId, 1); // Versión 1
console.log("Dirección de la faceta:", facetAddress);
```

#### Paso 3: Ejecutar Diamond Cut

ISBE administra su proxy, deberá solicitar la activación a través de los canales de soporte o el Portal, y **ISBE** ejecutará la transacción por usted.

A continuación se muestra el código:

```javascript
const proxy = await ethers.getContractAt("IDiamondCut", "0xMyProxyAddress");

// Definir el corte (Cut)
const cut = [{
    facetAddress: facetAddress, // La dirección obtenida en el Paso 2
    action: 1, // 1 = Replace (Sobrescribir tokenURI existente)
    functionSelectors: [
        ethers.id("tokenURI(uint256)").substring(0, 10),
        ethers.id("setTokenURI(uint256,string)").substring(0, 10)
    ]
}];

// Ejecutar transacción
await proxy.diamondCut(
    cut,
    ethers.ZeroAddress, // Sin inicializador adicional (o dirección de faceta si requiere init)
    "0x" // Calldata vacío
);

console.log("¡Faceta integrada exitosamente!");
```
