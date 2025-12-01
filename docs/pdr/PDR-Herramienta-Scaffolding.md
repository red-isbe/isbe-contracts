# PDR — Herramienta de Scaffolding para Facetas ISBE

**Estado:** Propuesta  
**Fecha:** 20/11/2025  
**Stakeholders:** Arquitectura Blockchain, Desarrollo, DevOps, Clientes ISBE

---

## 1) Contexto y problema

La arquitectura de contratos inteligentes de ISBE sigue un patrón estricto basado en EIP-2535 (Diamond) que separa cada módulo funcional en cuatro capas distintas:

1.  **Interfaz (`I*.sol`)**: Definiciones externas (eventos, errores, structs públicos, firmas de funciones).
2.  **Interno (`*Internal.sol`)**: Gestión de almacenamiento mediante slots de assembly y lógica privada.
3.  **Abstract Core (`*.sol`)**: Implementación de funciones externas con control de acceso (roles, modifiers).
4.  **Faceta (`*Facet.sol`)**: Capa de exposición para el Diamond, implementando `IEIP2535Introspection`.

Adicionalmente, ISBE no utiliza librerías enlazadas externamente (external linked libraries) para evitar complicaciones en el `delegatecall` y el despliegue.

**Problema:** Desarrollar bajo este estándar manualmente es lento, repetitivo y propenso a errores críticos, tales como:

- Colisiones de almacenamiento por mala definición de slots.
- Errores en la lista de selectores de introspección (olvidar un selector rompe la integración).
- Dificultad para integrar lógica estándar (como OpenZeppelin) sin reescribirla completamente.

---

## 2) Objetivo

Diseñar e implementar una herramienta de automatización integrada en el flujo de trabajo de desarrollo (Hardhat Plugin) que permita:

1.  **Generar** la estructura de 4 capas de ISBE (Interface, Internal, Abstract Core, Facet) de forma guiada.
2.  **Automatizar** la generación de almacenamiento seguro (Assembly Storage Pattern) con namespaces únicos.
3.  **Configurar** automáticamente la implementación de `IEIP2535Introspection` con selectores correctos.
4.  **Facilitar** la adopción de ISBE por parte de desarrolladores externos reduciendo la curva de aprendizaje mediante un flujo interactivo.

---

## 3) Alcance (v1)

### Incluye

- Desarrollo de un **Hardhat Plugin** (`hardhat-isbe-scaffold`).
- Comando `npx hardhat isbe:scaffold` para generación interactiva de facetas.
- Flujo de preguntas guiado para configurar la arquitectura de la faceta.
- Generación automática de los 4 archivos requeridos (`Interface`, `Internal`, `Abstract Core`, `Facet`) con templates pre-configurados.
- Actualización automática de archivos de constantes (`storagePositions.sol`, `roles.sol`, `resolverKeys.sol`).
- Soporte para features comunes: Access Control, Pausable, Storage complejo (EnumerableSet).

### Excluye

- Transpilación automática de código Solidity existente a la arquitectura ISBE (v1 se enfoca en generación desde cero).
- Migración automática de contratos desplegados previamente.
- Auditoría automática de seguridad (esto se cubre en el PDR de Protocolo de Auditoría).

---

## 4) Decisión

Se implementará la herramienta como un **Plugin de Hardhat con Scaffolding Interactivo**, descartando el enfoque de transpilación automática.

### Comparación: Scaffolding vs Transpiler

| Aspecto                         | **Transpiler** (Descartado)                                       | **Scaffolding** (Seleccionado)                                |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| **Concepto**                    | Convertir código Solidity estándar a ISBE automáticamente         | Generar código ISBE desde cero mediante templates y preguntas |
| **Complejidad técnica**         | Alta (parsing AST, reescritura de referencias)                    | Media (templates + CLI interactivo)                           |
| **Curva de aprendizaje**        | Alta (requiere entender entrada Y salida)                         | Baja (guiado paso a paso)                                     |
| **Flexibilidad**                | Limitada (output fijo basado en reglas)                           | Alta (templates configurables, código editable con TODOs)     |
| **Mantenibilidad**              | Compleja (mantener parser compatible con Solidity)                | Simple (actualizar templates cuando cambie arquitectura)      |
| **Control del desarrollador**   | Opaco (caja negra, difícil debuggear)                             | Transparente (código generado es código fuente editable)      |
| **Gestión de roles y permisos** | Difícil inferir automáticamente qué funciones necesitan qué roles | Pregunta explícita al desarrollador durante scaffolding       |
| **Errores y debugging**         | Difíciles de rastrear (¿error en input o en transpiler?)          | TODOs claros, errores de compilación estándar                 |
| **Casos de uso**                | Migración masiva de contratos legacy                              | Desarrollo greenfield de nuevas facetas                       |

### Justificación de la Decisión

**El transpiler presenta las siguientes limitaciones críticas:**

1. **Ambigüedad semántica:** No puede decidir automáticamente:
    - ¿Qué funciones requieren `onlyRole()` y con qué rol?
    - ¿El storage necesita `EnumerableSet` o basta con `mapping`?
    - ¿Qué hereda: `Common` o `DidDocumentDetailedInternal`?

2. **Complejidad de mantenimiento:** Cada actualización en la arquitectura ISBE (nuevos modifiers, cambios en storage pattern) requiere actualizar el parser AST.

3. **Pérdida de contexto:** Convertir código OpenZeppelin a ISBE pierde optimizaciones específicas del contexto Diamond.

**El scaffolding resuelve estos problemas:**

1. **Interacción humana:** Las preguntas guían al desarrollador para tomar decisiones arquitectónicas correctas.
2. **Educación progresiva:** El código generado con TODOs sirve como material de aprendizaje.
3. **Flexibilidad:** El desarrollador puede modificar los templates generados según necesidades específicas.

### Estrategia de Implementación

El scaffolding seguirá un flujo de **preguntas → configuración → generación de templates**:

1. **Configuración Interactiva:** CLI pregunta nombre, tipo de funcionalidad, features necesarios (access control, pausable, etc.).
2. **Generación de Templates:** Sistema de templates (Handlebars/Jinja2) rellena los 4 archivos con la configuración.
3. **Actualización de Constantes:** Automáticamente añade entradas en `storagePositions.sol`, `roles.sol`, `resolverKeys.sol`.
4. **Output con TODOs:** Código generado incluye comentarios `// TODO: Implementar lógica aquí` en puntos críticos.

El diseño prioriza:

- **Seguridad:** Eliminación de errores humanos en storage positions y selectores mediante generación automática.
- **Velocidad:** Generación instantánea de estructura completa lista para compilar.
- **Estándar:** Garantía de que todo el código generado cumple 100% con la arquitectura ISBE.
- **Aprendizaje:** Código generado sirve como referencia educativa para el desarrollador.

---

## 5) Diseño Técnico (Scaffolding)

### Flujo de Trabajo del Usuario

```bash
npx hardhat isbe:scaffold

? Nombre de tu faceta: TokenRoyalty
? Tipo de funcionalidad:
  ❯ Gestión de metadata
    Control de acceso custom
    Lógica de negocio
    Extensión de token (ERC20/ERC721)

? Contrato base:
  ❯ Common (funcionalidad genérica)
    DidDocumentDetailedInternal (relacionado con identidad)

? Características necesarias: (Selecciona con espacio)
  ❯ ◉ Access Control (roles)
    ◉ Pausable
    ◯ Storage complejo (EnumerableSet/Arrays)
    ◉ Eventos personalizados

? Nombre del rol principal: ROYALTY_MANAGER

✅ Generando estructura...
   contracts/client/tokenroyalty/
   ├── ITokenRoyalty.sol
   ├── TokenRoyaltyInternal.sol
   ├── TokenRoyalty.sol (Abstract Core)
   └── TokenRoyaltyFacet.sol

✅ Actualizando constantes...
   ├── constants/storagePositions.sol (+1 constante)
   ├── constants/roles.sol (+1 rol)
   └── constants/resolverKeys.sol (+1 resolver key)

✅ Archivos creados con TODOs marcados
```

### Arquitectura de Templates

Los templates podrían seguir la convención de nombres de Handlebars/Mustache con variables dinámicas:

**Estructura de directorios:**

```
hardhat-isbe-scaffold/
├── templates/
│   ├── Interface.sol.hbs
│   ├── Internal.sol.hbs
│   ├── AbstractCore.sol.hbs
│   └── Facet.sol.hbs
├── generators/
│   ├── facet-generator.ts
│   └── constants-updater.ts
└── cli/
    └── interactive-prompt.ts
```

### Ejemplo de Template (Conceptual)

**Internal.sol.hbs (simplificado):**

```handlebars
// SPDX-License-Identifier: UNLICENSED pragma solidity ^0.8.28; import {
{{baseContract}}
} from "{{baseContractPath}}"; import {_{{constantCase name}}_STORAGE_POSITION}
from "../../constants/storagePositions.sol"; abstract contract
{{name}}Internal is
{{baseContract}}
{ struct
{{name}}Storage { // TODO: Definir campos de storage aquí
{{#if includesComplexStorage}}
    // Ejemplo con EnumerableSet: // EnumerableSet.UintSet itemIds;
{{/if}}
} function _{{camelCase name}}Storage() internal pure returns ({{name}}Storage
storage storage_) { bytes32 position = _{{constantCase name}}_STORAGE_POSITION;
assembly { storage_.slot := position } } // TODO: Implementar funciones internas
}
```

### Configuración Generada

El sistema calculará automáticamente:

1. **Storage Position:**

    ```typescript
    const storagePosition = ethers.keccak256(
        ethers.toUtf8Bytes(
            `isbe.contracts.client.${facetName.toLowerCase()}.storage`
        )
    )
    ```

2. **Resolver Key:**

    ```typescript
    const resolverKey = ethers.keccak256(
        ethers.toUtf8Bytes(`client.${facetName.toLowerCase()}.resolver`)
    )
    ```

3. **Role Constant:**
    ```typescript
    const roleName = `_${customRole.toUpperCase()}_ROLE`
    const roleHash = ethers.keccak256(
        ethers.toUtf8Bytes(customRole.toUpperCase())
    )
    ```

### Output con TODOs Estratégicos

El código generado incluirá comentarios guía en puntos críticos:

```solidity
// TokenRoyaltyInternal.sol (generado)
struct TokenRoyaltyStorage {
    // TODO: Definir estructura de datos
    // Ejemplos comunes:
    // mapping(uint256 tokenId => uint256 percentage) royalties;
    // mapping(address => bool) approvedReceivers;
}

function _setRoyalty(uint256 tokenId, uint256 percentage) internal {
    TokenRoyaltyStorage storage $ = _tokenRoyaltyStorage();
    // TODO: Validaciones necesarias
    // require(percentage <= 10000, "Royalty exceeds 100%");

    // TODO: Implementar lógica
    $.royalties[tokenId] = percentage;
}
```

---

## 6) Plan de Trabajo

### Fase 1: Prototipo CLI

- Implementar sistema de preguntas interactivas usando `inquirer`.
- Crear templates básicos para los 4 archivos de arquitectura.
- Script independiente de generación que prueba el flujo end-to-end.

### Fase 2: Generación de Templates

- Sistema de templates con Handlebars.
- Lógica de transformación de nombres (camelCase, PascalCase, CONSTANT_CASE).
- Generación de storage positions y resolver keys con keccak256.

### Fase 3: Actualización de Constantes

- Parser para `storagePositions.sol`, `roles.sol`, `resolverKeys.sol`.
- Inyección automática de nuevas constantes sin romper el formato existente.
- Validación de colisiones de nombres.

### Fase 4: Integración Hardhat

- Empaquetado como plugin Hardhat (`hardhat-isbe-scaffold`).
- Configuración en `hardhat.config.ts`.
- Testing con casos reales del proyecto.

### Fase 5: Documentación y Testing

- Guía de uso del comando `isbe:scaffold`.
- Ejemplos de flujos comunes (ERC20 extension, metadata custom, etc.).
- Testing end-to-end con generación y compilación de código.
