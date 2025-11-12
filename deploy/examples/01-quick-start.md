# Quick Start - Primer Despliegue

Guía paso a paso para tu primer despliegue usando el nuevo sistema.

## Prerequisitos

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar contratos
npx hardhat compile

# 3. Verificar que los comandos están disponibles
npx hardhat --help | grep deploy:
```

Deberías ver:
```
deploy:full        Despliegue completo del sistema ISBE
deploy:governance  Desplegar solo Governance Diamond
deploy:selective   Despliegue selectivo de use cases
deploy:validate    Validar despliegue existente
```

## Escenario 1: Despliegue Completo en Red Local

### Paso 1: Iniciar red local

```bash
# Terminal 1: Iniciar Hardhat Network
npx hardhat node
```

### Paso 2: Desplegar sistema completo

```bash
# Terminal 2: Desplegar con preset minimal
npx hardhat deploy:full \
  --network hardhat \
  --preset minimal \
  --log-level verbose
```

### Qué hace este comando:

1. ✅ Despliega Governance Diamond
2. ✅ Despliega 24 Business Logic Facets
3. ✅ Registra ~10 configuraciones (preset minimal)
4. ✅ Despliega ~10 use cases (proxies)

### Resultado esperado:

```
🚀 ISBE Full Deployment
   Network: hardhat
   Preset: minimal
   Log Level: verbose

🏗️  STEP 1: GOVERNANCE DEPLOYMENT
   📦 Deploying ISBE Factory...
   ✅ Governance deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🏗️  STEP 2: BUSINESS LOGIC DEPLOYMENT
   📦 Deploying 24 business logics...
   ✅ [24/24] 100% completed

🏗️  STEP 3: CONFIGURATION REGISTRATION
   📝 Registering 10 configurations...
   ✅ [10/10] 100% completed

🏗️  STEP 4: USE CASE DEPLOYMENT
   🎯 Deploying 10 use cases...
   ✅ [10/10] 100% completed

✅ Despliegue completo exitoso
   Documentación: deploy/docs/02-deployment-phases.md
```

## Escenario 2: Solo Governance

Útil para configurar la red sin desplegar use cases aún.

```bash
npx hardhat deploy:governance --network hardhat
```

**Resultado:**
```
🏛️  ISBE Governance Deployment
   Network: hardhat

✅ Governance Diamond desplegado exitosamente
   Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Documentación: deploy/01-governance/README.md
```

## Escenario 3: Despliegue Selectivo

Desplegar solo tokens ERC20 con extensión Burnable.

```bash
npx hardhat deploy:selective \
  --network hardhat \
  --categories erc20 \
  --extensions burnable
```

**Resultado:**
```
🎯 ISBE Selective Deployment
   Network: hardhat
   Categories: erc20
   Extensions: burnable

   📝 Generated config: deployment-configs/selective-temp.json

🏗️  STEP 1: GOVERNANCE DEPLOYMENT (skipped - already deployed)

🏗️  STEP 2: BUSINESS LOGIC DEPLOYMENT
   ✅ Business logics deployed

🏗️  STEP 3: CONFIGURATION REGISTRATION
   ✅ Registering selected configurations

🏗️  STEP 4: USE CASE DEPLOYMENT
   🎯 Deploying:
      - ERC20 Base
      - ERC20 w/Burnable
   ✅ [2/2] 100% completed

✅ Despliegue selectivo exitoso
```

## Escenario 4: Despliegue en MVP (Producción)

### Paso 1: Configurar cuentas

```bash
# Verificar que .env está configurado
cat .env

# Debe tener:
# ACCOUNT_ADDRESS=0xYourAddress
# ACCOUNT_PRIVATE_KEY=0xYourPrivateKey
```

### Paso 2: Validar configuración

```bash
npx hardhat validate-accounts
```

### Paso 3: Desplegar con validaciones

```bash
npx hardhat deploy:full \
  --network mvp \
  --preset essentials \
  --precommit \
  --log-level normal
```

**Nota:** `--precommit` ejecuta validaciones exhaustivas después del despliegue.

### Paso 4: Verificar despliegue

```bash
npx hardhat deploy:validate \
  --network mvp \
  --governance 0xGovernanceAddress \
  --full
```

## Escenario 5: Despliegue en Red secp256r1 (Besu)

### Paso 1: Generar cuentas secp256r1

```bash
npx hardhat generate-secp256r1-env --count 5
```

### Paso 2: Validar cuentas

```bash
npx hardhat validate-accounts
```

### Paso 3: Desplegar

```bash
npx hardhat deploy:full \
  --network customR1Network \
  --preset minimal \
  --log-level verbose
```

**El sistema detecta automáticamente** que es una red secp256r1 y usa el provider apropiado.

## Comandos Útiles

### Ver ayuda de un comando

```bash
npx hardhat deploy:full --help
```

### Ver estado de despliegue

```bash
npx hardhat complete-deployment-status \
  --network hardhat \
  --governance 0xGovernanceAddress
```

### Listar business logics desplegados

```bash
npx hardhat getBusinessLogics \
  --factory 0xGovernanceAddress \
  --network hardhat
```

### Verificar roles de governance

```bash
npx hardhat governanceRoles \
  --factory 0xGovernanceAddress \
  --network hardhat
```

## Troubleshooting

### Error: "Task deploy:full not found"

**Solución:** Agregar `import './deploy/register'` en hardhat.config.ts

### Error: "No signers available"

**Solución:** Verificar configuración de cuentas
```bash
npx hardhat validate-accounts
```

### Error: "Network not found"

**Solución:** Verificar que la red está configurada en hardhat.config.ts

### Despliegue muy lento

**Solución:** Usar preset minimal para testing
```bash
npx hardhat deploy:full --network hardhat --preset minimal
```

## Comparación con Sistema Anterior

| Tarea | Sistema Antiguo | Sistema Nuevo |
|-------|-----------------|---------------|
| Despliegue completo | `deployAllClean --network mvp` | `deploy:full --network mvp` |
| Solo governance | `deployIsbeFactory --network mvp` | `deploy:governance --network mvp` |
| Selectivo | Crear JSON manual | `deploy:selective --categories erc20` |
| Validación | Múltiples comandos | `deploy:validate --governance 0x...` |
| Ayuda | Leer código | `--help` en cada comando |
