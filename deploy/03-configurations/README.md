# Configuraciones ISBE

Este módulo gestiona las configuraciones (combinaciones de business logic facets) que pueden ser desplegadas como use cases.

## Estructura

```
03-configurations/
├── config/
│   ├── minimal/         # Configuraciones mínimas (~10 configs)
│   ├── essentials/      # Configuraciones esenciales (~30 configs)
│   ├── complete/        # Todas las configuraciones (~150 configs)
│   └── custom/          # Configuraciones personalizadas
└── README.md (este archivo)
```

## Configuraciones Disponibles

Las configuraciones están organizadas por categoría:

### ERC20 (17 configuraciones)

- **Base**: ERC20 básico
- **Extensiones individuales**: Burnable, Capped, Controller, Snapshot
- **Combinaciones de 2**: Burnable+Snapshot, Burnable+Capped, etc.
- **Combinaciones de 3**: Burnable+Snapshot+Capped, etc.
- **Complete**: Todas las extensiones

### ERC721 (130+ configuraciones)

- **Base**: ERC721 básico
- **Extensiones individuales**: Burnable, Enumerable, Capped, Controller, Snapshot, Royalty, Consecutive
- **Todas las combinaciones posibles** de 2, 3, 4, 5, 6 extensiones
- **Complete**: Todas las extensiones

### Utility (2 configuraciones)

- Hash Timestamp
- Ownable

### ENS (1 configuración)

- Public Resolver

## Presets

### Minimal (~10 configs)

Configuraciones básicas más utilizadas:
- ERC20 Base
- ERC721 Base
- Hash Timestamp
- Public Resolver

### Essentials (~30 configs)

Configuraciones esenciales:
- ERC20: Base, Burnable, Snapshot, Burnable+Snapshot
- ERC721: Base, Burnable, Enumerable, Burnable+Enumerable
- Utility: Hash Timestamp, Ownable
- ENS: Public Resolver

### Complete (~150 configs)

Todas las configuraciones disponibles.

## Uso

### Desplegar con preset

```bash
# Preset minimal
npx hardhat deploy:full --network mvp --preset minimal

# Preset essentials
npx hardhat deploy:full --network mvp --preset essentials

# Preset complete (todas)
npx hardhat deploy:full --network mvp --preset complete
```

### Despliegue selectivo

```bash
# Solo ERC20
npx hardhat deploy:selective --network mvp --categories erc20

# Solo tokens con Burnable
npx hardhat deploy:selective --network mvp --extensions burnable

# ERC20 con Burnable y Snapshot
npx hardhat deploy:selective --network mvp --categories erc20 --extensions burnable,snapshot
```

### Sin desplegar use cases

Para solo registrar las configuraciones sin crear proxies:

```bash
npx hardhat deploy:full --network mvp --no-use-cases
```

## Configuración Custom

Para crear configuraciones personalizadas, ver:
- [ADR-003: Custom Configuration IDs](../../docs/adrs/ADR_003-CustomConfigurationIDs.md)

## Constantes Reutilizadas

Este módulo reutiliza completamente las constantes existentes en:
- `tasks/deployment/constants/DeploymentConstants.ts`
- `tasks/deployment/constants/erc20.ts`
- `tasks/deployment/constants/erc721.ts`
- `tasks/deployment/constants/utility.ts`
- `tasks/deployment/constants/ens.ts`
- `tasks/deployment/constants/client.ts`

## Algoritmo de Configuration ID

Cada configuración tiene un ID único calculado con el algoritmo de [ADR-003: Custom Configuration IDs](../../docs/adrs/ADR_003-CustomConfigurationIDs.md):

```typescript
function buildConfigurationId(
    seed: string,
    resolverKeys: string[]
): string {
    // XOR de resolver keys en posiciones específicas
    // Ver: ADR-003 para detalles completos
}
```

## Referencias

- **Código fuente**: `tasks/deployment/constants/`
- **ADR-003**: `docs/adrs/ADR_003-CustomConfigurationIDs.md`
- **Deployment Guide**: `docs/Production-Deployment-Guide.md`
