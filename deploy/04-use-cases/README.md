# Use Cases Deployment

Módulo para despliegue de Use Cases (proxies Diamond configurados).

## Qué son

Los Use Cases son instancias de IsbeProxy (Diamond proxies) configuradas con facets específicos según su propósito.

## Presets Disponibles

### Minimal (~10 use cases)

Configuraciones básicas para testing rápido:
- ERC20 Base
- ERC721 Base
- Hash Timestamp
- Public Resolver

**Uso:**
```bash
npx hardhat deploy:full --network hardhat --preset minimal
```

### Essentials (~30 use cases)

Configuraciones más utilizadas:
- ERC20: Base, Burnable, Snapshot, Burnable+Snapshot
- ERC721: Base, Burnable, Enumerable, Burnable+Enumerable
- Utility: Hash Timestamp, Ownable
- ENS: Public Resolver

**Uso:**
```bash
npx hardhat deploy:full --network mvp --preset essentials
```

### Complete (~150 use cases)

Todas las configuraciones posibles.

**Uso:**
```bash
npx hardhat deploy:full --network mvp --preset complete
```

## Despliegue Selectivo

### Por Categoría

```bash
# Solo ERC20
npx hardhat deploy:selective --network mvp --categories erc20

# Solo ERC721
npx hardhat deploy:selective --network mvp --categories erc721

# ERC20 y Utility
npx hardhat deploy:selective --network mvp --categories erc20,utility
```

### Por Extensión

```bash
# Todos los tokens con Burnable
npx hardhat deploy:selective --network mvp --extensions burnable

# Tokens con Burnable y Snapshot
npx hardhat deploy:selective --network mvp --extensions burnable,snapshot
```

### Combinado

```bash
# ERC20 con extensiones específicas
npx hardhat deploy:selective \
  --network mvp \
  --categories erc20 \
  --extensions burnable,snapshot
```

## Sin Desplegar Use Cases

Para solo registrar configuraciones sin crear proxies:

```bash
npx hardhat deploy:full --network mvp --no-use-cases
```

Esto es útil cuando:
- Solo quieres configurar la infraestructura
- Los use cases se desplegarán bajo demanda
- Estás en una red "bare" (solo governance)

## Implementación

Este módulo **reutiliza completamente** el código existente en:

- `tasks/deployment/deployers/CleanUseCaseDeployer.ts`
- `tasks/deployment/constants/DeploymentConstants.ts`

El comando `deploy:selective` genera un archivo JSON de configuración y llama a `deployAllClean`:

```typescript
// deploy/commands/deploy-selective.ts
await hre.run('deployAllClean', {
    configFile,
    logLevel: taskArgs.logLevel,
})
```

## Estructura de Use Case

Cada use case desplegado incluye:

1. **IsbeProxy** - Diamond proxy principal
2. **Facets configurados** - Según la configuración seleccionada
3. **Roles asignados** - DEFAULT_ADMIN_ROLE al deployer
4. **Estado inicializado** - Pause desactivado por defecto

## Configuración Custom

Para crear configuraciones personalizadas:

```json
// deployment-configs/my-custom.json
{
  "description": "Mi configuración custom",
  "version": "1.0.0",
  "includeAllBusinessLogics": true,
  "useCaseFilters": {
    "enabled": true,
    "categories": ["erc20"],
    "includePatterns": ["w/Burnable", "w/Snapshot"]
  }
}
```

**Uso:**
```bash
npx hardhat deploy:full --network mvp --config-file my-custom
```

## Referencias

- **Código fuente**: `tasks/deployment/deployers/CleanUseCaseDeployer.ts`
- **Constantes**: `tasks/deployment/constants/DeploymentConstants.ts`
- **ADR-003**: `docs/adrs/ADR_003-CustomConfigurationIDs.md` (Sistema de configuration IDs)
- **Selective Deployment**: `../examples/README.md` (Ejemplos)
