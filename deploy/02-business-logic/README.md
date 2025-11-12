# Business Logic Deployment

Módulo para despliegue de Business Logic Facets (implementaciones).

## Qué son

Los Business Logic Facets son las implementaciones de contratos que se despliegan una vez y se reutilizan por múltiples use cases via delegatecall.

## Categorías

### Core (4 facets)
- IsbeCutFacet - Gestión de cortes diamond
- IsbeLoupeFacet - Introspección diamond
- AccessControlFacet - Control de acceso RBAC
- ISBEPauseFacet - Sistema de pausa

### Tokens (13 facets)

**ERC20 (5):**
- ERC20Facet
- ERC20BurnableFacet
- ERC20CappedFacet
- ERC20ControllerFacet
- ERC20SnapshotFacet

**ERC721 (8):**
- ERC721Facet
- ERC721BurnableFacet
- ERC721EnumerableFacet
- ERC721CappedFacet
- ERC721ControllerFacet
- ERC721SnapshotFacet
- ERC721RoyaltyFacet
- ERC721ConsecutiveFacet

### Utility (3 facets)
- HashTimestampFacet
- OwnableFacet
- AssetEventTrackerFacet

### Client (3 facets)
- ClientFilteringFacet
- BesuNodeManagerFacet
- TimeStampingRegistryFacet

## Uso

Los business logic se despliegan automáticamente como parte de `deploy:full`:

```bash
npx hardhat deploy:full --network mvp
```

## Implementación

Este módulo **reutiliza completamente** el código existente en:

- `tasks/deployment/deployers/CleanBusinessLogicDeployer.ts`
- `tasks/deployment/constants/DeploymentConstants.ts`

## Constantes Reutilizadas

Todas las constantes de business logic están en:

```typescript
// tasks/deployment/constants/DeploymentConstants.ts
export const DEFAULT_BUSINESS_LOGICS = [
    // Core facets
    ISBE_CUT_DEFINITION,
    ISBE_LOUPE_DEFINITION,
    ACCESS_CONTROL_DEFINITION,
    PAUSE_DEFINITION,

    // Token facets
    ...ERC20_DEFINITIONS,
    ...ERC721_DEFINITIONS,

    // Utility facets
    ...UTILITY_DEFINITIONS,

    // Client facets
    ...CLIENT_DEFINITIONS,
]
```

## Referencias

- **Código fuente**: `tasks/deployment/deployers/CleanBusinessLogicDeployer.ts`
- **Constantes**: `tasks/deployment/constants/`
- **Contratos**: `contracts/` 
