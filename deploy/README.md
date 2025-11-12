# ISBE Deployment System

Sistema de despliegue modular y organizado para contratos ISBE (Interoperable Secure Blockchain Ecosystem).

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura](#arquitectura)
- [Quick Start](#quick-start)
- [Comandos Principales](#comandos-principales)
- [Fases de Despliegue](#fases-de-despliegue)
- [Redes Soportadas](#redes-soportadas)
- [Ejemplos](#ejemplos)
- [Migración](#migración)

## Introducción

Este sistema de despliegue está diseñado para:

- ✅ **Claridad**: Estructura por fases que refleja el orden de despliegue
- ✅ **Modularidad**: Desplegar solo lo necesario (governance, business logic, configs, use cases)
- ✅ **Flexibilidad**: Soporte para secp256k1 y secp256r1
- ✅ **Mantenibilidad**: Código organizado y auto-documentado
- ✅ **Compatibilidad**: Funciona junto al sistema existente

## Arquitectura

```
deploy/
├── 01-governance/          # FASE 1: Governance Diamond
├── 02-business-logic/      # FASE 2: Business Logic Facets
├── 03-configurations/      # FASE 3: Configuration Registry
├── 04-use-cases/          # FASE 4: Use Case Proxies (Opcional)
├── networks/              # Configuración de redes
├── providers/             # Signature Providers (secp256k1/secp256r1)
├── orchestrators/         # Orquestadores de despliegue
├── validation/            # Validaciones globales
├── utils/                 # Utilidades compartidas
├── genesis/               # Generación de Genesis
├── commands/              # Comandos CLI
├── types/                 # Tipos TypeScript
├── examples/              # Ejemplos de uso
└── docs/                  # Documentación detallada
```

## Quick Start

### Despliegue Completo

```bash
# Desplegar sistema completo en red MVP
npx hardhat deploy:full --network mvp

# Desplegar con preset esencial (solo use cases principales)
npx hardhat deploy:full --network mvp --preset essentials

# Desplegar sin use cases (solo governance + business logic + configs)
npx hardhat deploy:full --network mvp --no-use-cases
```

### Despliegue por Fases

```bash
# Fase 1: Solo Governance
npx hardhat deploy:governance --network mvp

# Fase 2: Solo Business Logic (requiere governance desplegado)
npx hardhat deploy:business-logic --network mvp --governance 0x...

# Fase 3: Solo Configuraciones (requiere business logic)
npx hardhat deploy:configurations --network mvp --governance 0x...

# Fase 4: Solo Use Cases (requiere configuraciones)
npx hardhat deploy:use-cases --network mvp --governance 0x... --preset essentials
```

### Despliegue Selectivo

```bash
# Desplegar solo tokens ERC20
npx hardhat deploy:selective --network mvp --categories erc20

# Desplegar solo tokens con extensiones específicas
npx hardhat deploy:selective --network mvp --extensions burnable,snapshot

# Desplegar usando archivo de configuración custom
npx hardhat deploy:selective --network mvp --selective-config my-config.json
```

## Comandos Principales

### Comandos de Despliegue

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `deploy:full` | Despliegue completo del sistema | `npx hardhat deploy:full --network mvp` |
| `deploy:governance` | Solo Governance Diamond | `npx hardhat deploy:governance --network mvp` |
| `deploy:business-logic` | Solo Business Logic Facets | `npx hardhat deploy:business-logic --network mvp` |
| `deploy:configurations` | Solo Configuraciones | `npx hardhat deploy:configurations --network mvp` |
| `deploy:use-cases` | Solo Use Cases | `npx hardhat deploy:use-cases --network mvp` |
| `deploy:selective` | Despliegue selectivo | `npx hardhat deploy:selective --categories erc20` |

### Comandos de Gestión

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `deploy:upgrade` | Actualizar facet | `npx hardhat deploy:upgrade --facet ERC20Facet` |
| `deploy:validate` | Validar despliegue | `npx hardhat deploy:validate --network mvp` |
| `deploy:genesis` | Generar genesis | `npx hardhat deploy:genesis --template bare` |
| `deploy:status` | Estado del despliegue | `npx hardhat deploy:status --network mvp` |

### Opciones Comunes

| Opción | Valores | Descripción |
|--------|---------|-------------|
| `--network` | `hardhat`,`dev` `mvp`, `arsys`, `kepler`, `customR1Network`, `bare` | Red de despliegue |
| `--preset` | `minimal`, `essentials`, `complete` | Preset de use cases |
| `--log-level` | `minimal`, `normal`, `verbose`, `debug` | Nivel de logging |
| `--precommit` | flag | Ejecutar validaciones completas |
| `--debug` | flag | Modo debug detallado |
| `--no-use-cases` | flag | No desplegar use cases |

## Fases de Despliegue

### Fase 1: Governance

Despliega el Diamond de gobernanza con todos los facets necesarios para gestionar el ecosistema.

**Componentes:**
- ISBE Factory (Diamond EIP-2535)
- Governance Facets: BusinessLogicFactory, ConfigurationManagement, ProxyFactory, GlobalPause
- Access Control Facets
- DID Registry Facets
- ENS Facets

**Documentación:** [01-governance/README.md](01-governance/README.md)

### Fase 2: Business Logic

Despliega todos los facets de business logic (implementaciones) que serán usados por los use cases.

**Componentes:**
- Core Facets: IsbeCut, IsbeLoupe, AccessControl, Pause
- Token Facets: ERC20, ERC721 + extensiones
- Identity Facets: DID, ENS
- Utility Facets: HashTimestamp, Ownable, AssetTracker
- Client Facets: Filtering, BesuNodeManager, TimeStampingRegistry

**Documentación:** [02-business-logic/README.md](02-business-logic/README.md)

### Fase 3: Configurations

Registra las configuraciones (combinaciones de business logic) en el ConfigurationManagement.

**Presets:**
- **Minimal**: Configuraciones básicas (~10 configs)
- **Essentials**: Configuraciones esenciales (~30 configs)
- **Complete**: Todas las configuraciones (~150+ configs)
- **Custom**: Configuraciones personalizadas

**Documentación:** [03-configurations/README.md](03-configurations/README.md)

### Fase 4: Use Cases (Opcional)

Despliega instancias de proxies (use cases) usando las configuraciones registradas.

**Opciones:**
- Desplegar todos los use cases
- Desplegar por preset (minimal/essentials/complete)
- Despliegue selectivo (por categoría, extensión, o custom)
- No desplegar (solo registrar configuraciones)

**Documentación:** [04-use-cases/README.md](04-use-cases/README.md)

## Redes Soportadas

### Redes secp256k1 (Ethereum estándar)

| Red | Chain ID | Descripción |
|-----|----------|-------------|
| `hardhat` | 31337 | Red local Hardhat |
| `dev` | 11073 | Red dev Besu |
| `mvp` | 2023 | ISBE MVP |
| `arsys` | 2024 | ISBE Arsys |
| `kepler` | 1003 | IoBuilders Kepler |

### Redes secp256r1 (Hyperledger Besu)

| Red | Chain ID | Descripción |
|-----|----------|-------------|
| `customR1Network` | 2222 | Red Besu secp256r1 custom |
| `bare` | 10962 | Red Besu bare (sin use cases) |

**Nota:** El sistema detecta automáticamente el tipo de curva y usa el provider apropiado.

**Documentación:** [networks/README.md](networks/README.md)

## Ejemplos

### Ejemplo 1: Despliegue Completo en MVP

```bash
# Despliegue completo con validaciones
npx hardhat deploy:full \
  --network mvp \
  --preset essentials \
  --precommit \
  --log-level normal
```

### Ejemplo 2: Despliegue Solo Governance

```bash
# Solo governance para configurar la red
npx hardhat deploy:governance \
  --network hardhat \
  --log-level verbose
```

### Ejemplo 3: Despliegue Selectivo de Tokens

```bash
# Solo tokens ERC20 con extensiones Burnable y Snapshot
npx hardhat deploy:selective \
  --network mvp \
  --categories erc20 \
  --extensions burnable,snapshot
```

### Ejemplo 4: Despliegue en Red secp256r1

```bash
# Despliegue en Hyperledger Besu con secp256r1
npx hardhat deploy:full \
  --network customR1Network \
  --preset minimal \
  --log-level verbose
```

### Ejemplo 5: Generación de Genesis

```bash
# Generar genesis con governance pre-desplegado
npx hardhat deploy:genesis \
  --network hardhat \
  --template bare \
  --output genesis-bare.json
```

**Más ejemplos:** [examples/README.md](examples/README.md)

## Scripts NPM


```bash
# Despliegue completo
npm run deploy:full

# Solo governance
npm run deploy:governance

# Despliegue selectivo
npm run deploy:selective

# Validar despliegue
npm run deploy:validate
```

### Scripts por Red

```bash
# Despliegue completo por red
npm run deploy:full:dev        # Red dev
npm run deploy:full:mvp        # Red mvp
npm run deploy:full:local      # Red hardhat

# Governance por red
npm run deploy:governance:dev  # Red dev
npm run deploy:governance:mvp  # Red mvp
```

### Scripts Selectivos Pre-configurados

```bash
# Despliegue por categoría
npm run deploy:selective:erc20     # Solo tokens ERC20
npm run deploy:selective:erc721    # Solo tokens ERC721
npm run deploy:selective:utility   # Solo utilidades
```

### Agregar Flags Adicionales

Los scripts NPM mantienen **total flexibilidad** - usa `--` para pasar flags adicionales:

```bash
# Ejemplo 1: Dev con preset minimal y verbose
npm run deploy:full:dev -- --preset minimal --log-level verbose

# Ejemplo 2: Governance con debug logging
npm run deploy:governance:dev -- --log-level debug

# Ejemplo 3: ERC20 con extensiones en mvp
npm run deploy:selective:erc20 -- --network mvp --extensions burnable,snapshot

# Ejemplo 4: Despliegue sin use cases
npm run deploy:full:mvp -- --no-use-cases --precommit

# Ejemplo 5: Validación completa
npm run deploy:validate -- --network dev --governance 0x... --full
```

### Ventajas de los Scripts NPM

- ✅ **Atajos convenientes** para casos de uso comunes
- ✅ **Flexibilidad total** con `--` para pasar flags
- ✅ **Autocompletado** en IDE (escribe `npm run deploy:` y verás todas las opciones)
- ✅ **Compatibilidad CI/CD** fácil de usar en pipelines
- ✅ **Sin perder poder** - todos los flags funcionan igual

### Equivalencias

| Script NPM | Comando Hardhat Equivalente |
|------------|----------------------------|
| `npm run deploy:full:dev` | `npx hardhat deploy:full --network dev` |
| `npm run deploy:governance:mvp` | `npx hardhat deploy:governance --network mvp` |
| `npm run deploy:selective:erc20` | `npx hardhat deploy:selective --categories erc20` |

**Nota:** Puedes usar indistintamente los scripts NPM o los comandos hardhat directos - funcionan exactamente igual.

## Estructura Detallada

### 01-governance/

Módulo de despliegue de Governance Diamond.

```
01-governance/
├── config/              # Configuración de governance
├── deployers/           # Lógica de despliegue
├── validation/          # Validaciones
└── deploy-governance.ts # Script principal
```

### 02-business-logic/

Módulo de despliegue de Business Logic.

```
02-business-logic/
├── config/
│   ├── core/           # Facets core (IsbeCut, IsbeLoupe, etc.)
│   ├── tokens/         # ERC20, ERC721
│   ├── identity/       # DID, ENS
│   ├── utility/        # HashTimestamp, Ownable, etc.
│   └── client/         # Client services
├── deployers/
└── deploy-business-logic.ts
```

### 03-configurations/

Módulo de registro de configuraciones.

```
03-configurations/
├── config/
│   ├── minimal/        # Configs mínimas
│   ├── essentials/     # Configs esenciales
│   ├── complete/       # Todas las configs
│   └── custom/         # Configs personalizadas
├── builders/           # Constructor de configuraciones
└── register-configurations.ts
```

### 04-use-cases/

Módulo de despliegue de Use Cases.

```
04-use-cases/
├── config/
│   ├── presets/        # Presets predefinidos
│   └── selective/      # Despliegue selectivo
├── deployers/
└── deploy-use-cases.ts
```

## Migración desde Sistema Anterior

El nuevo sistema es **100% compatible** con el sistema existente (`tasks/`).

### Coexistencia

Ambos sistemas pueden usarse simultáneamente:

```bash
# Sistema antiguo (sigue funcionando)
npx hardhat deployAllClean --network mvp

# Sistema nuevo
npx hardhat deploy:full --network mvp
```

### Plan de Migración

1. **Fase 1**: Sistema nuevo en paralelo (actual)
2. **Fase 2**: Migración gradual de scripts
3. **Fase 3**: Deprecación del sistema antiguo (mantenido por compatibilidad)

**Guía de migración:** [docs/08-migration-guide.md](docs/08-migration-guide.md)

## Validación

### Validación Automática

```bash
# Validación completa post-despliegue
npx hardhat deploy:validate \
  --network mvp \
  --governance 0x... \
  --full

# Validación rápida
npx hardhat deploy:validate \
  --network mvp \
  --quick
```

### Validaciones Pre-commit

```bash
# Ejecutar validaciones exhaustivas
npx hardhat deploy:full \
  --network hardhat \
  --precommit
```

## Troubleshooting

### Problemas Comunes

**Error: "Network not found"**
```bash
# Verificar configuración de red
DEBUG=true npx hardhat deploy:full --network mvp --log-level debug
```

**Error: "Governance address required"**
```bash
# Especificar dirección de governance
npx hardhat deploy:business-logic --network mvp --governance 0x...
```

**Error: "Account validation failed"**
```bash
# Validar cuentas
npx hardhat validate-accounts
```

**Guía completa:** [docs/07-troubleshooting.md](docs/07-troubleshooting.md)

## Documentación Detallada

- [Getting Started](docs/01-getting-started.md) - Primeros pasos
- [Deployment Phases](docs/02-deployment-phases.md) - Fases de despliegue
- [Network Configuration](docs/03-network-configuration.md) - Configuración de redes
- [Custom Configurations](docs/04-custom-configurations.md) - Configuraciones custom
- [Selective Deployment](docs/05-selective-deployment.md) - Despliegue selectivo
- [Genesis Generation](docs/06-genesis-generation.md) - Generación de genesis
- [Troubleshooting](docs/07-troubleshooting.md) - Resolución de problemas
- [Migration Guide](docs/08-migration-guide.md) - Guía de migración


