# Blockscout Verification Tasks

Tareas de Hardhat para preparar la verificación de contratos en Blockscout.

## `blockscout:generate`

Exporta el **Solidity Standard JSON Input** de **un** contrato, copiado tal cual
(`buildInfo.input`) del `build-info` que realmente lo compiló. Ese archivo se
sube en Blockscout con el método **"Solidity (Standard JSON input)"**.

La tarea es offline: no compila, no usa RPC, ni AWS KMS, ni la API de Blockscout.

### Parámetros

| Parámetro      | Obligatorio | Descripción                                                                                                                                                                    |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--contract`   | Sí          | Fully Qualified Name (`path/Contract.sol:Contract`, recomendado) o nombre de contrato si es único.                                                                             |
| `--build-info` | No          | Compilación concreta a usar en lugar de la del artefacto actual: ruta a un archivo, `<id>` o `<id>.json` dentro de `artifacts/build-info`. Útil para compilaciones históricas. |
| `--output`     | No          | Archivo de salida, fuera de `artifacts/`. Por defecto: `verify/<Contract>.<buildInfoId>.standard-input.json` en la raíz del proyecto.                                          |

### Cómo elige la compilación

1. Resuelve `--contract` a un FQN contra los artefactos actuales (o contra
   `output.contracts` del `--build-info` indicado).
2. Sin `--build-info`, usa `hre.artifacts.getBuildInfo(fqn)`: el `build-info`
   referenciado por el `.dbg.json` del contrato. Nunca elige archivos por orden
   alfabético.
3. Valida que el contrato está en `buildInfo.output.contracts`, que su archivo
   fuente está en `buildInfo.input.sources` y que tiene bytecode desplegable
   (rechaza contratos abstractos e interfaces).
4. Compara el bytecode con el artefacto actual: si no coincide y no se pasó
   `--build-info`, falla (artefactos inconsistentes); con `--build-info` solo
   avisa (es lo esperable en una compilación histórica).
5. Escribe `buildInfo.input` completo y sin modificar (mismo orden de claves,
   sin añadir `compiler` ni `compilationTarget`, sin quitar campos).

Muestra el contrato, el `build-info` elegido, la versión real de `solc`, los
ajustes del compilador (optimizer, `evmVersion`, `viaIR`, `metadata`,
`libraries`, `remappings`) y la ruta del archivo generado.

### Dónde se escribe el archivo

La salida va a `verify/` en la raíz del proyecto (ignorado por git), **nunca**
dentro de `artifacts/`. Hardhat trata cualquier `.json` de `artifacts/` como un
artefacto de contrato: rompe las tareas que listan artefactos (por ejemplo
`facets:report`) y lo borra en el siguiente `compile`, `test` o `run`. Por eso
la tarea rechaza un `--output` dentro de `artifacts/`, también con rutas
relativas como `verify/../artifacts/x.json` o a través de symlinks. Los
archivos de `verify/` sobreviven a `compile` y a `npx hardhat clean`.

## Ejemplos

### `EvidenceRegistryFacet`

```bash
npx hardhat blockscout:generate \
  --contract contracts/evidenceregistry/EvidenceRegistryFacet.sol:EvidenceRegistryFacet
```

```
=== Blockscout: Solidity Standard JSON Input ===

Contract:        contracts/evidenceregistry/EvidenceRegistryFacet.sol:EvidenceRegistryFacet
Build-info:      846e142bfe28d573a80973e823b80aa4 (from artifact)
Build-info file: .../artifacts/build-info/846e142bfe28d573a80973e823b80aa4.json
Solidity:        v0.8.28+commit.7893614a
Optimizer:       {"enabled":true,"runs":1000}
EVM version:     istanbul
viaIR:           false
...
✅ Written: .../verify/EvidenceRegistryFacet.846e142bfe28d573a80973e823b80aa4.standard-input.json (1.66 MB)
```

Es exactamente el `jq '.input'` del `build-info` con el que se verificó
`0xFD6940b8794CD51CDa59580C0DF24467A486a3f4` en Blockscout DEV.

### `IsbeProxy`

```bash
npx hardhat blockscout:generate \
  --contract contracts/proxies/isbeproxy/IsbeProxy.sol:IsbeProxy \
  --output verify/IsbeProxy.json
```

### Diamonds

En este repositorio el Diamond es un `IsbeProxy`: la dirección del Diamond se
verifica como `IsbeProxy` y **cada facet se verifica por separado** en su propia
dirección (con un archivo por facet):

```bash
# El proxy (dirección del Diamond)
npx hardhat blockscout:generate --contract contracts/proxies/isbeproxy/IsbeProxy.sol:IsbeProxy

# Cada facet registrado en el Diamond (dirección de cada facet)
npx hardhat blockscout:generate --contract contracts/proxies/eip2535/facets/DiamondLoupeFacet.sol:DiamondLoupeFacet
npx hardhat blockscout:generate --contract contracts/factory/proxyfactory/ProxyFactoryFacet.sol:ProxyFactoryFacet
```

Las direcciones de los facets desplegados están en los
`facet-addresses-<network>-<timestamp>.json` que genera el despliegue.

### Use Cases

Los proxies de Use Case los despliega `ProxyFactoryFacet` mediante
`new IsbeProxy(...)`, así que el código de creación de `IsbeProxy` va embebido
en el `ProxyFactoryFacet` desplegado. Hay que usar **la misma compilación que
produjo ese `ProxyFactoryFacet`**:

```bash
# Id del build-info del ProxyFactoryFacet actualmente compilado
jq -r .buildInfo artifacts/contracts/factory/proxyfactory/ProxyFactoryFacet.sol/ProxyFactoryFacet.dbg.json

npx hardhat blockscout:generate \
  --contract contracts/proxies/isbeproxy/IsbeProxy.sol:IsbeProxy \
  --build-info <id-del-build-info-de-ProxyFactoryFacet>
```

Los facets de lógica de negocio del Use Case (p. ej. `EvidenceRegistryFacet`)
se verifican igual que cualquier facet.

### Compilaciones históricas

Si el contrato desplegado se compiló con un estado anterior del código y ese
`build-info` sigue disponible (en `artifacts/build-info`, una copia guardada o
un artefacto de CI):

```bash
npx hardhat blockscout:generate \
  --contract contracts/proxies/isbeproxy/IsbeProxy.sol:IsbeProxy \
  --build-info 5241fa444b1feab247723e676788c9db
# o bien --build-info ./backups/build-info/5241fa444b1feab247723e676788c9db.json
```

La tarea avisará si el bytecode de esa compilación difiere del artefacto actual.

## Verificación en Blockscout

1. Compilar (si hace falta; la tarea no lo hace por ti): `npx hardhat compile`.
2. Generar el JSON del contrato con `blockscout:generate`.
3. En Blockscout: `https://<blockscout>/address/0xCONTRACT` → "Verify & Publish".
4. Método: **"Solidity (Standard JSON input)"**.
5. Compiler: la versión que imprime la tarea (`Solidity: v0.8.28+commit.7893614a`).
6. Contract name: el que imprime la tarea (si se pide).
7. Subir el archivo generado y verificar.

Optimizer, `evmVersion`, etc. van dentro del JSON; no hay que copiarlos a mano.

## Cambios respecto a la versión anterior

| Antes                                                                                                              | Ahora                                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Sin parámetros; un único archivo para "todos" los facets.                                                          | `--contract` obligatorio; un archivo por contrato.                                                 |
| Elegía el `build-info` con `.sort().pop()` (el último por nombre, arbitrario).                                     | Usa `hre.artifacts.getBuildInfo(fqn)` o el `--build-info` indicado.                                |
| Reconstruía el JSON: `compiler` y versión fijos, solo `optimizer`/`evmVersion`.                                    | Exporta `buildInfo.input` íntegro (incluye `outputSelection`, `metadata`, `remappings`, …).        |
| Añadía `compilationTarget` con contratos de `find contracts`, aunque no estuvieran compilados en ese `build-info`. | No añade `compilationTarget`; valida que el contrato está en la compilación.                       |
| Ejecutaba `find`/`grep` con `execSync`.                                                                            | Solo lee archivos de `artifacts/`.                                                                 |
| Salida fija `artifacts/verify/ALL-FACETS-unified.json`, dentro de `artifacts/`.                                    | `verify/<Contract>.<buildInfoId>.standard-input.json` (fuera de `artifacts/`) o `--output`.        |
| No detectaba interfaces/abstractos ni nombres ambiguos.                                                            | Error claro en contratos abstractos, nombres ambiguos, artefactos ausentes y build-info inválidos. |

`ALL-FACETS-unified.json` ya no se genera. Los scripts que lo esperen deben
llamar a la tarea una vez por contrato.

## Errores habituales

- **`Contract name "X" is ambiguous`**: hay varios contratos con ese nombre;
  usar uno de los FQN que lista el error.
- **`Contract "X" not found`**: no está en los artefactos (o en el
  `--build-info`). Compilar o elegir otra compilación.
- **`has empty bytecode`**: es una interfaz o un contrato abstracto; verificar
  el contrato concreto que lo hereda.
- **`No build-info for ...`**: el `.dbg.json` apunta a un `build-info` borrado.
  Ejecutar `npx hardhat compile` o pasar `--build-info`.
- **`Artifacts are inconsistent`**: el artefacto y su `build-info` no
  coinciden. Ejecutar `npx hardhat compile`.
- **Blockscout "No contract could be verified" / "Partial Match"**: el
  bytecode desplegado no corresponde a esa compilación (o solo difiere el hash
  de metadatos). Usar `--build-info` con la compilación exacta del despliegue.

## Limitaciones

- Si el `build-info` usado en el despliegue ya no existe (p. ej. tras
  `hardhat clean` o `compile --force`), no se puede reconstruir: hay que
  recuperarlo o recompilar el commit desplegado con la misma configuración.
- Las librerías enlazadas externamente se detectan y se avisa, pero sus
  direcciones hay que indicarlas en Blockscout.
- El archivo incluye todas las fuentes de la compilación (no solo las del
  contrato); su tamaño es el del `input` original.
