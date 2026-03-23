# Blockscout Verification Tasks

Tareas de Hardhat para generar archivos de verificación de Blockscout.

## Tareas Disponibles

### `blockscout:generate`

Genera un archivo JSON unificado para verificación en Blockscout de todos los contratos Facet, EIP2535AccessControl e IsbeProxy.

**Uso:**

```bash
npx hardhat blockscout:generate
```

**Output:**

- `artifacts/verify/ALL-FACETS-unified.json` (1.60 MB)
- Incluye 65 contratos de producción
- Excluye: testwrappers, mocks, interfaces

**Ejemplo de salida:**

```
=== GENERANDO JSON UNIFICADO - TODOS LOS CONTRATOS PRINCIPALES ===

Found 65 production contract source files
Total sources: 359
Contracts to verify: 65

✅ Created: artifacts/verify/ALL-FACETS-unified.json
Size: 1.60 MB

📋 File ready to use for Blockscout verification!
```

## Verificación en Blockscout

1. **Compilar contratos:**

    ```bash
    npx hardhat compile
    ```

2. **Generar JSON unificado:**

    ```bash
    npx hardhat blockscout:generate
    ```

3. **Verificar en Blockscout UI:**
    - Ir a: `https://blockscout.<network>/address/0xCONTRACT`
    - Click en "Verify & Publish"
    - Seleccionar: "Solidity (Standard-Input-Json)"
    - Subir: `artifacts/verify/ALL-FACETS-unified.json`
    - Settings:
        - Compiler: `v0.8.28+commit.7893614a`
        - Optimization: `YES` (1000 runs)
        - EVM Version: `istanbul`
    - Click "Verify"

## Contratos Incluidos

El archivo generado incluye 65 contratos organizados por categoría:

- **Diamond Facets** (5): DiamondLoupe, DiamondCutAccessControl, etc.
- **Access Control** (7): AccessControlFacet, OwnableFacet, etc.
- **Business Logic** (1): BusinessLogicFactoryFacet
- **Configuration** (1): ConfigurationManagementFacet
- **DID Registry** (5): DidDocumentDetailedFacet, DidControllerFacet, etc.
- **Identity/ENS** (6): EnsRegistryFacet, EnsResolverFacet, etc.
- **Client/Network** (5): NetworkDirectoryFacet, BesuNodeManagerFacet, etc.
- **Token Facets** (22): ERC20Facet, ERC721Facet, ERC3643 facets, etc.
- **Proxies** (5): ProxyFactoryFacet, IsbeCutFacet, IsbeLoupeFacet, etc.
- **Pause** (2): GlobalIsbePauseFacet, ISBEPauseFacet
- **Others** (6): EntryPointFacet, SmartAccountFacet, etc.

## Notas Importantes

1. **Rutas relativas**: El JSON usa rutas relativas desde `contracts/` que deben coincidir exactamente con la estructura de archivos fuente.

2. **Exclusiones**: No se incluyen:
    - Contratos con `testwrapper` o `TestWrapper` en el nombre
    - Contratos `Mock`
    - Interfaces (archivos que empiezan con `I`)

3. **Build Info**: El script usa el archivo `artifacts/build-info/d320292993698903cdca21756fb65d53.json` generado durante la compilación.

4. **Tamaño**: El archivo generado (1.60 MB) está dentro del límite de ~5 MB de Blockscout.

## Troubleshooting

### Error: "No contract could be verified"

**Causa**: El bytecode compilado no coincide con el bytecode on-chain.

**Solución**:

- Asegurar que el contrato fue desplegado con la misma versión del código
- Verificar compiler version: `v0.8.28+commit.7893614a`
- Verificar optimizer settings: `enabled: true, runs: 1000`
- Verificar EVM version: `istanbul`

### Error: "File not found"

**Causa**: Las rutas en `compilationTarget` no coinciden con los source files.

**Solución**:

- Las rutas deben ser relativas desde `contracts/`
- Ejemplo: `contracts/factory/proxyfactory/ProxyFactoryFacet.sol`
