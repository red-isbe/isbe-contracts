# PDR — Smart Contract “Catálogo de Redes” (Revisión con Resources genérico)

**Estado:** Propuesta  
**Fecha:** 21/10/2025  
**Stakeholders:** Producto, Arquitectura Blockchain, Backend, QA, DevOps

---

## 1) Contexto y problema

Actualmente no existe un mecanismo unificado ni auditable para registrar y consultar redes blockchain dentro de los entornos gestionados por la organización.  
Cada entorno (dev, pre, prod) mantiene información en documentos o repositorios independientes, sin trazabilidad ni validación técnica.

El objetivo es crear un **smart contract on-chain** que funcione como **fuente única de verdad** para el registro de redes y sus atributos técnicos (algoritmo, endpoints, participantes, recursos, etc.), permitiendo **lecturas públicas** y **operaciones administrativas seguras** mediante permisos controlados.

---

## 2) Objetivo

Diseñar e implementar un **smart contract** que gestione un **catálogo de redes** y un **conjunto de recursos genéricos por red**, con operaciones de alta, baja, modificación y consulta, además de **gestión dinámica de recursos** mediante pares `key → resource`.
El contrato debe permitir:

1. **Agregar** nuevas redes.
2. **Listar** todas las redes registradas.
3. **Filtrar** redes según su algoritmo criptográfico.
4. **Eliminar** redes obsoletas o duplicadas.
5. **Actualizar** datos existentes con información complementaria.
6. **Agregar nuevos recursos** nuevos recursos.
7. **Listar claves de recusos** todas las claves registradas.
8. **Eliminar recursos** recursos obsoletos o duplicados.

Todas las operaciones deben quedar registradas mediante **eventos on-chain** que faciliten auditoría y sincronización con sistemas off-chain.

---

## 3) Alcance (v1)

### Incluye

- Implementación del contrato inteligente `NetworkDirectory` en Solidity.
- Definición del modelo de datos y estructura `Network`.
- Gestión de **recursos genéricos** por red (`Resource { bytes32 key; string resource; }`).
- Validaciones de unicidad (`chainId`) y control de permisos (owner).
- Emisión de eventos para auditoría.
- Despliegues iniciales en `dev`, `pre`, `prod`.

### Excluye

- API/GUI off-chain (podrán consumirse eventos y funciones de lectura).
- Indexador dedicado (The Graph) — se valorará en v2.
- Migraciones automáticas entre versiones de contrato.

---

## 4) Decisión

Se implementará un **único contrato** denominado `NetworkDirectory` que utilizará un mapping basado en `chainId (uint256)` para garantizar unicidad.

Adoptar un modelo **genérico de recursos** por red para maximizar flexibilidad y minimizar cambios de esquema:

```solidity
struct Resource {
    bytes32 key; // Identificador lógico del recurso (p.ej., "RPC", "EXPLORER", "DOC")
    string resource; // Valor libre: URL, DID, texto corto, etc.
}
```

Los recursos se almacenarán por red con gestión de claves y soporte para listar **todas las keys** de forma eficiente.

Cada transacción emitirá **eventos on-chain** (`NetworkCreated`, `NetworkUpdated`, `NetworkDeleted`) que actuarán como mecanismo de notificación y auditoría inmutable.

El diseño prioriza:

- **Simplicidad:** estructura compacta y legible.
- **Gas efficiency:** minimizar almacenamiento y loops.
- **Transparencia:** todas las operaciones visibles públicamente.
- **Extensibilidad:** permitir nuevas propiedades sin romper compatibilidad.

---

## 5) Modelo de datos (struct)

```text
 enum Stage { DEV, PRE, PROD } // Más seguro y barato que string para stage

Network {
  uint256 chainId          // UNIQUE
  bytes32 name             // Nombre corto de la red (<= 32 bytes)
  bytes32 alg              // "secp256r1" | "secp256k1" (<= 32 bytes)
  bytes32 symbol           // Moneda/símbolo (<= 32 bytes)
  Stage   stage            // Enum: DEV | PRE | PROD
  Resource[] resources     // Lista genérica de recursos (key → resource)
}

Resource {
  bytes32 key;             // Identificador del recurso (p.ej. "RPC","EXPLORER","DOC","GAS","STATUS")
  string  resource;        // Contenido del recurso (normalmente URL o identificador)
}
```

---

## 6) Funciones del Smart Contract

### 6.1 CRUD de redes

| Funcionalidad  | Firma propuesta                                      | Descripción                                                            |
| -------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Crear red      | `createNetwork(Network calldata n)`                  | Alta de red con validaciones de unicidad. Emite `NetworkCreated`.      |
| Consultar red  | `getNetwork(uint256 chainId)`                        | Devuelve la red. Lectura `view`.                                       |
| Listar redes   | `getAllNetworks()`                                   | Devuelve todas las redes (se recomienda paginación o indexador en v2). |
| Actualizar red | `updateNetwork(uint256 chainId, Network calldata n)` | Modifica campos de red. Emite `NetworkUpdated`.                        |
| Eliminar red   | `deleteNetwork(uint256 chainId)`                     | Borra la red. Emite `NetworkDeleted`.                                  |

### 6.2 Gestión de recursos genéricos por red

> Basado en `struct Resource { bytes32 key; string resource; }`

| Funcionalidad                 | Firma propuesta                                                       | Descripción                                                                          |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Añadir/actualizar recurso** | `setResource(uint256 chainId, bytes32 key, string calldata resource)` | Crea o actualiza el recurso identificado por `key` para la red. Emite `ResourceSet`. |
| **Eliminar recurso**          | `deleteResource(uint256 chainId, bytes32 key)`                        | Elimina el recurso asociado a `key`. Emite `ResourceDeleted`.                        |
| **Listar claves de recursos** | `listResourceKeys(uint256 chainId) view returns (bytes32[] memory)`   | Devuelve todas las keys disponibles para esa red.                                    |

---

## 7) Eventos

- `event NetworkCreated(uint256 chainId)`
- `event NetworkUpdated(uint256 chainId)`
- `event NetworkDeleted(uint256 chainId)`
- `event ResourceSet(uint256 chainId, bytes32 key, string resource)`
- `event ResourceDeleted(uint256 chainId, bytes32 key)`

---

## 8) Reglas de negocio y validaciones

- `chainId` **único** (> 0) para creación.
- `name`, `alg`, `symbol` no vacíos (cuando aplique).
- `stage` ∈ {DEV, PRE, PROD}.
- En recursos, `key` no vacía; `resource` puede ser string vacío **sólo** para forzar “clear” si se prefiere, aunque se recomienda `deleteResource`.

---

## 9) Permisos y seguridad

- **Owner/Editor**: responsables de crear, actualizar o eliminar redes.
- **Viewer**:
    - Leer
        - Un elemento pasandole le chainID
    - Listar
        - Obtención de la lista completa
    - Filtrar
        - Por Algoritmo
- Control de acceso mediante `Ownable` (OpenZeppelin).
- Los eventos proporcionan trazabilidad sin exponer información sensible.
- En versiones futuras podrá incluirse `AccessControl` para granularidad por rol.

---

## 10) Consideraciones no funcionales

- **Gas:** uso de `bytes32` para identificadores cortos; strings solo donde aportan valor (URLs).
- **Compatibilidad:** Solidity ^0.8.x; EVM-compatible chains.
- **Observabilidad:** eventos consumibles por indexadores (The Graph).
- **Mantenibilidad:** claridad del modelo y funciones atómicas.

---

## 11) Alternativas consideradas

1. **Recursos fijos en el struct** (antes): menos flexibles, requieren migraciones.
2. **Sólo hashes (`bytes32`)**: más barato, pero obliga a resolver off-chain; se descarta para v1 por usabilidad.
3. **URI/IPFS por recurso**: viable; se puede combinar en futuros recursos si el payload crece.

---

## 12) Riesgos y mitigaciones

| Riesgo                        | Impacto | Mitigación                                                          |
| ----------------------------- | ------- | ------------------------------------------------------------------- |
| Explosión de recursos por red | Medio   | Listado de keys y paginación off-chain; políticas de uso en cliente |
| Coste de almacenamiento       | Medio   | `bytes32` para keys; evitar duplicados (upsert)                     |
| Gestión de permisos           | Medio   | `Ownable`/`AccessControl`, tests de seguridad                       |

### (Anexo) Interfaz de contrato — boceto

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INetworkDirectory {
    enum Stage {
        DEV,
        PRE,
        PROD
    }

    struct Resource {
        bytes32 key; // p.ej. "RPC","EXPLORER","DOC","GAS","STATUS"
        string resource; // URL/ID/DID/etc.
    }

    struct Network {
        uint256 chainId;
        bytes32 name;
        bytes32 alg;
        bytes32 symbol;
        Stage stage;
        Resource[] resources; // Nota: para lecturas completas; en storage se usará mapping
    }

    // Redes
    function createNetwork(Network calldata n) external;
    function updateNetwork(uint256 chainId, Network calldata n) external;
    function deleteNetwork(uint256 chainId) external;
    function getNetwork(uint256 chainId) external view returns (Network memory);
    function getAllNetworks() external view returns (Network[] memory);

    // Recursos
    function setResource(
        uint256 chainId,
        bytes32 key,
        string calldata resource
    ) external;
    function deleteResource(uint256 chainId, bytes32 key) external;
    function listResourceKeys(
        uint256 chainId
    ) external view returns (bytes32[] memory);
}
```
