# PDR — Herramienta de Automatización de Facetas (ISBE Transpiler)

**Estado:** Propuesta  
**Fecha:** 20/11/2025  
**Stakeholders:** Arquitectura Blockchain, Desarrollo, DevOps, Clientes ISBE

---

## 1) Contexto y problema

La arquitectura de contratos inteligentes de ISBE sigue un patrón estricto basado en EIP-2535 (Diamond) que separa cada módulo funcional en cuatro capas distintas:
1.  **Interfaz (`I*.sol`)**: Definiciones externas.
2.  **Interno (`*Internal.sol`)**: Gestión de almacenamiento mediante slots de assembly y lógica privada.
3.  **Lógica (`*.sol`)**: Implementación de funciones externas heredando del interno.
4.  **Faceta (`*Facet.sol`)**: Capa de exposición para el Diamond, implementando `IEIP2535Introspection`.

Adicionalmente, ISBE no utiliza librerías enlazadas externamente (external linked libraries) para evitar complicaciones en el `delegatecall` y el despliegue.

**Problema:** Desarrollar bajo este estándar manualmente es lento, repetitivo y propenso a errores críticos, tales como:
*   Colisiones de almacenamiento por mala definición de slots.
*   Errores en la lista de selectores de introspección (olvidar un selector rompe la integración).
*   Dificultad para integrar lógica estándar (como OpenZeppelin) sin reescribirla completamente.

---

## 2) Objetivo

Diseñar e implementar una herramienta de automatización (**ISBE Transpiler**) integrada en el flujo de trabajo de desarrollo (Hardhat Plugin) que permita:

1.  **Transpilar** contratos Solidity estándar a la arquitectura de 4 capas de ISBE automáticamente.
2.  **Automatizar** la generación de almacenamiento seguro (Assembly Storage Pattern).
3.  **Generar** automáticamente la implementación de `IEIP2535Introspection`.
4.  **Facilitar** la adopción de ISBE por parte de desarrolladores externos reduciendo la curva de aprendizaje.

---

## 3) Alcance (v1)

### Incluye

- Desarrollo de un **Hardhat Plugin** (`hardhat-isbe`).
- Comando `npx hardhat isbe:transpile` para conversión manual.
- Hook de compilación opcional para conversión automática.
- Soporte para variables de estado simples y mappings.
- Generación de los 4 archivos requeridos (`Internal`, `Logic`, `Facet`, `Interface`).
- Inyección automática de dependencias de introspección.

### Excluye

- Soporte para herencia compleja de múltiples niveles en la v1 (se aplanará la lógica o se requerirá input simplificado).
- Migración automática de lógica de actualización (upgradability) compleja más allá del patrón estándar de ISBE.

---

## 4) Decisión

Se implementará la herramienta como un **Plugin de Hardhat** para integrarse nativamente en el entorno de desarrollo existente.

La herramienta utilizará análisis sintáctico de Solidity (AST Parsing) para deconstruir el contrato original y reconstruirlo siguiendo los patrones de ISBE.

**Estrategia de Transformación:**

1.  **Storage:** Mover todas las variables de estado del contrato original a un `struct` en el archivo `*Internal.sol`, accediendo vía puntero de assembly (`keccak256` del namespace).
2.  **Lógica:** Reescribir las referencias a variables de estado para usar el puntero de almacenamiento (`$.variable`).
3.  **Introspección:** Calcular los selectores de función (`bytes4(keccak256(...))`) durante la transpilarción e inyectarlos en el array de retorno de `selectorsIntrospection`.

El diseño prioriza:
- **Seguridad:** Eliminación de errores humanos en storage y selectores.
- **Velocidad:** Conversión instantánea de código estándar a código ISBE.
- **Estándar:** Garantía de que todo el código generado cumple 100% con la arquitectura.

---

## 5) Diseño Técnico (Transformación)

### Input (Contrato Estándar)
```solidity
contract MyToken {
    uint256 public totalSupply;
    function mint(uint256 amount) external {
        totalSupply += amount;
    }
}
```

### Output Generado (Arquitectura ISBE)

**1. MyTokenInternal.sol**
```solidity
bytes32 constant _MYTOKEN_STORAGE_POSITION = keccak256("isbe.storage.MyToken");
abstract contract MyTokenInternal {
    struct MyTokenStorage { uint256 totalSupply; }
    function _myTokenStorage() private pure returns (MyTokenStorage storage $) {
        bytes32 position = _MYTOKEN_STORAGE_POSITION;
        assembly { $.slot := position }
    }
}
```

**2. MyToken.sol**
```solidity
abstract contract MyToken is MyTokenInternal {
    function mint(uint256 amount) external {
        MyTokenStorage storage $ = _myTokenStorage();
        $.totalSupply += amount;
    }
}
```

**3. MyTokenFacet.sol**
```solidity
contract MyTokenFacet is MyToken, IEIP2535Introspection {
    function selectorsIntrospection() external pure returns (bytes4[] memory s) {
        s = new bytes4[](1);
        s[0] = this.mint.selector;
    }
    // ... businessIdIntrospection, interfacesIntrospection
}
```

---

## 6) Plan de Trabajo

1.  **Prototipo (Semana 1-2):** Script TypeScript independiente que parsea un contrato simple y genera los archivos.
2.  **Integración Hardhat (Semana 3):** Empaquetado como plugin y configuración en `hardhat.config.ts`.
3.  **Soporte OpenZeppelin (Semana 4):** Lógica para "internalizar" contratos estándar de OZ.
4.  **Testing y Documentación (Semana 5):** Pruebas con contratos reales de ISBE y guía de uso.
