# Governance Deployment

Módulo para despliegue del Governance Diamond (ISBE Factory).

## Qué es

El Governance Diamond es el contrato principal del sistema ISBE. Contiene:

- **BusinessLogicFactory**: Gestiona despliegue de business logic facets
- **ConfigurationManagement**: Registra configuraciones
- **ProxyFactory**: Despliega use cases (proxies)
- **GlobalPause**: Control de pausa global
- **AccessControl**: Sistema de roles
- **DID Registry**: Gestión de identidades descentralizadas
- **ENS**: Sistema de nombres

## Uso

### Desplegar solo governance

```bash
npx hardhat deploy:governance --network mvp
```

### Como parte del despliegue completo

```bash
npx hardhat deploy:full --network mvp
```

## Implementación

Este módulo **reutiliza completamente** el código existente en:

- `tasks/deployment/deployers/CleanGovernanceDeployer.ts`
- `tasks/businessLogic/deployIsbeFactory.ts`

El comando `deploy:governance` simplemente llama a la task existente `deployIsbeFactory`.

## Facets Desplegados

1. **Diamond Facets**:
   - DiamondCutAccessControlFacet
   - DiamondLoupeFacet

2. **Governance Facets**:
   - BusinessLogicFactoryFacet
   - ConfigurationManagementFacet
   - ProxyFactoryFacet
   - GlobalIsbePauseFacet
   - AccessControlGovernanceFacet
   - AccessControlDidGovernanceFacet
   - ISBEPauseFacet

3. **Identity Facets**:
   - DidDocumentDetailedFacet
   - DidControllerFacet
   - DidVerificationMethodFacet
   - DidVerificationRelationshipFacet
   - DidRegistryQueryFacet

4. **ENS Facets**:
   - EnsRegistryFacet
   - EnsResolverFacet
   - NameResolverFacet
   - PubkeyResolverFacet
   - TextResolverFacet

5. **Client Facets**:
   - ClientFilteringFacet
   - TimeStampingRegistryFacet
   - AnchoringCoreFacet

## Referencias

- **Código fuente**: `tasks/deployment/deployers/CleanGovernanceDeployer.ts`
- **Arquitectura**: `docs/Gobernance-Layer-Architecture.md`
- **Task original**: `tasks/businessLogic/deployIsbeFactory.ts`
