# Ejemplos de Uso

Ejemplos prácticos del sistema de despliegue ISBE.

## Guías Disponibles

### Básicas

- **[01-quick-start.md](01-quick-start.md)** - Tu primer despliegue paso a paso
  - Despliegue completo en red local
  - Solo governance
  - Despliegue selectivo
  - Producción (MVP)
  - Redes secp256r1

## Escenarios Comunes

### Desarrollo Local

```bash
# Iniciar red
npx hardhat node

# Despliegue mínimo para desarrollo
npx hardhat deploy:full --network hardhat --preset minimal
```

### Testing

```bash
# Despliegue en Hardhat Network (in-memory)
npx hardhat deploy:full --network hardhat --preset minimal

# Con validaciones
npx hardhat deploy:full --network hardhat --preset minimal --precommit
```

### Staging/Pre-producción

```bash
# Despliegue con configs esenciales
npx hardhat deploy:full --network mvp --preset essentials --log-level verbose
```

### Producción

```bash
# Despliegue completo con validaciones
npx hardhat deploy:full \
  --network mvp \
  --preset complete \
  --precommit \
  --log-level normal
```

## Escenarios Avanzados

### Despliegue por Fases

```bash
# Fase 1: Solo governance
npx hardhat deploy:governance --network mvp

# Fase 2: Business logic + Configurations (sin use cases)
npx hardhat deploy:full --network mvp --no-use-cases

# Fase 3: Desplegar use cases después
npx hardhat deploy:selective --network mvp --categories erc20,utility
```

### Despliegue Selectivo por Categoría

```bash
# Solo tokens ERC20
npx hardhat deploy:selective --network mvp --categories erc20

# Solo utilidades
npx hardhat deploy:selective --network mvp --categories utility

# Múltiples categorías
npx hardhat deploy:selective --network mvp --categories erc20,erc721,utility
```

### Despliegue Selectivo por Extensión

```bash
# Todos los tokens con Burnable
npx hardhat deploy:selective --network mvp --extensions burnable

# Tokens con Burnable y Snapshot
npx hardhat deploy:selective --network mvp --extensions burnable,snapshot

# ERC20 con extensiones específicas
npx hardhat deploy:selective \
  --network mvp \
  --categories erc20 \
  --extensions burnable,snapshot,capped
```

### Despliegue con Archivo Custom

```bash
# Crear archivo de configuración
cat > deployment-configs/my-config.json << EOF
{
  "description": "Mi configuración custom",
  "version": "1.0.0",
  "includeAllBusinessLogics": true,
  "useCaseFilters": {
    "enabled": true,
    "categories": ["erc20", "utility"],
    "includePatterns": ["w/Burnable", "w/Snapshot"]
  }
}
EOF

# Desplegar con el archivo
npx hardhat deploy:full --network mvp --config-file my-config
```

## Despliegue en Diferentes Redes

### Hardhat Network (Testing)

```bash
npx hardhat deploy:full --network hardhat --preset minimal
```

### hardhat (Besu local)

```bash
npx hardhat deploy:full --network hardhat --preset essentials
```

### MVP (Producción)

```bash
npx hardhat deploy:full --network mvp --preset complete --precommit
```

### Custom R1 (secp256r1)

```bash
# Primero generar cuentas secp256r1
npx hardhat generate-secp256r1-env --count 5

# Luego desplegar
npx hardhat deploy:full --network customR1Network --preset minimal
```

## Validaciones

### Validación completa

```bash
npx hardhat deploy:validate \
  --network mvp \
  --governance 0xGovernanceAddress \
  --full
```

### Validación rápida

```bash
npx hardhat deploy:validate \
  --network mvp \
  --governance 0xGovernanceAddress \
  --quick
```

## Comandos de Consulta

### Ver estado del despliegue

```bash
npx hardhat complete-deployment-status \
  --network mvp \
  --governance 0xGovernanceAddress
```

### Listar business logics

```bash
npx hardhat getBusinessLogics \
  --factory 0xGovernanceAddress \
  --network mvp
```

### Verificar configuración

```bash
npx hardhat getConfig \
  --config-id 0xConfigurationId \
  --factory 0xGovernanceAddress \
  --network mvp
```

### Ver roles de governance

```bash
npx hardhat governanceRoles \
  --factory 0xGovernanceAddress \
  --network mvp
```

## Niveles de Logging

```bash
# Minimal - Solo mensajes críticos
npx hardhat deploy:full --network mvp --log-level minimal

# Normal - Mensajes estándar (default)
npx hardhat deploy:full --network mvp --log-level normal

# Verbose - Información detallada
npx hardhat deploy:full --network mvp --log-level verbose

# Debug - Máximo detalle
npx hardhat deploy:full --network mvp --log-level debug
```

## Integración con CI/CD

### GitHub Actions Example

```yaml
name: Deploy ISBE

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Compile contracts
        run: npx hardhat compile

      - name: Deploy to MVP
        run: |
          npx hardhat deploy:full \
            --network mvp \
            --preset essentials \
            --precommit \
            --log-level normal
        env:
          ACCOUNT_ADDRESS: ${{ secrets.DEPLOYER_ADDRESS }}
          ACCOUNT_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}
```

## Scripts NPM

Los scripts NPM ya están configurados en `package.json`. Puedes usarlos directamente:

```bash
# Despliegues por red
npm run deploy:full:dev         # Despliegue completo en dev
npm run deploy:full:mvp         # Despliegue completo en mvp
npm run deploy:full:local       # Despliegue completo en hardhat

# Governance por red
npm run deploy:governance:dev   # Solo governance en dev
npm run deploy:governance:mvp   # Solo governance en mvp

# Despliegues selectivos
npm run deploy:selective:erc20  # Solo tokens ERC20
npm run deploy:selective:erc721 # Solo tokens ERC721
npm run deploy:selective:utility # Solo utilidades

# Con flags adicionales
npm run deploy:full:dev -- --preset minimal --log-level verbose
npm run deploy:selective:erc20 -- --extensions burnable,snapshot
```

Ver documentación completa: [../README.md#scripts-npm](../README.md#scripts-npm)

## Tips y Best Practices

### 1. Usar preset según necesidad

- **minimal**: Para desarrollo y testing rápido
- **essentials**: Para staging y demos
- **complete**: Solo para producción final

### 2. Siempre validar en producción

```bash
npx hardhat deploy:full --network mvp --precommit
```

### 3. Usar log-level apropiado

- **minimal**: CI/CD
- **normal**: Uso general
- **verbose**: Debugging
- **debug**: Investigación de problemas

### 4. Backup de direcciones

Guarda las direcciones de governance desplegadas:

```bash
npx hardhat deploy:full --network mvp 2>&1 | tee deployment-$(date +%Y%m%d).log
```

### 5. Verificar antes de desplegar

```bash
# Verificar configuración de red
npx hardhat validate-accounts

# Verificar compilación
npx hardhat compile

# Test en hardhat primero
npx hardhat deploy:full --network hardhat --preset minimal
```

