# Testing en Red Dev - Guía Rápida

Guía paso a paso para probar el nuevo sistema de deploy en la red **dev**.

## Red Dev

**Configuración:**
- Network: `dev`
- Chain ID: `11073`
- Curve: `secp256k1` (Ethereum estándar)
- URL: `https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/`

## Pasos para Probar

### 1. Verificar que hardhat.config.ts está actualizado

El archivo `hardhat.config.ts` ya ha sido actualizado con la línea:

```typescript
// Register new deploy system commands
import './deploy/register'
```

Verifica que esté presente después de `import './tasks/register'`

### 2. Verificar que los comandos están disponibles

```bash
npx hardhat --help | grep "deploy:"
```

**Resultado esperado:**
```
deploy:full        Despliegue completo del sistema ISBE
deploy:governance  Desplegar solo Governance Diamond
deploy:selective   Despliegue selectivo de use cases
deploy:validate    Validar despliegue existente
```

### 3. Verificar configuración de cuentas

```bash
# Verificar que .env tiene las cuentas configuradas
cat .env | grep ACCOUNT

# Validar cuentas
npx hardhat validate-accounts
```

**Debe mostrar:**
```
✅ Loaded 5 valid accounts from environment
```

### 4. Probar despliegue en red dev

#### Opción A: Despliegue Minimal (Recomendado para primera prueba)

```bash
npx hardhat deploy:full \
  --network dev \
  --preset minimal \
  --log-level verbose
```

**Qué despliega:**
- ✅ Governance Diamond
- ✅ 24 Business Logic Facets
- ✅ ~10 configuraciones (ERC20 Base, ERC721 Base, Hash Timestamp, etc.)
- ✅ ~10 use cases

**Tiempo estimado:** 5-10 minutos

#### Opción B: Despliegue Essentials

```bash
npx hardhat deploy:full \
  --network dev \
  --preset essentials \
  --log-level normal
```

**Qué despliega:**
- ✅ Governance Diamond
- ✅ 24 Business Logic Facets
- ✅ ~30 configuraciones
- ✅ ~30 use cases

**Tiempo estimado:** 15-20 minutos

#### Opción C: Solo Governance (Más rápido)

```bash
npx hardhat deploy:governance \
  --network dev \
  --log-level verbose
```

**Qué despliega:**
- ✅ Solo Governance Diamond

**Tiempo estimado:** 2-3 minutos

### 5. Verificar el despliegue

Una vez completado, guarda la dirección del Governance Diamond que aparece en el output:

```
✅ Governance deployed at: 0x...
```

Luego valida:

```bash
npx hardhat deploy:validate \
  --network dev \
  --governance 0xTuDireccionDeGovernance \
  --full
```

### 6. Ver estado del despliegue

```bash
npx hardhat complete-deployment-status \
  --network dev \
  --governance 0xTuDireccionDeGovernance
```

## Comandos Útiles Post-Despliegue

### Listar Business Logics

```bash
npx hardhat getBusinessLogics \
  --factory 0xGovernanceAddress \
  --network dev
```

### Ver Configuraciones

```bash
npx hardhat getConfig \
  --config-id 0xConfigurationId \
  --factory 0xGovernanceAddress \
  --network dev
```

### Verificar Roles

```bash
npx hardhat governanceRoles \
  --factory 0xGovernanceAddress \
  --network dev
```

## Comparación: Sistema Antiguo vs Nuevo

### Sistema Antiguo

```bash
npx hardhat deployAllClean --network dev
```

### Sistema Nuevo

```bash
npx hardhat deploy:full --network dev --preset minimal
```

**Ambos funcionan igual**, solo cambia la interfaz.

## Troubleshooting

### Error: "Task deploy:full not found"

**Solución:** Verificar que `import './deploy/register'` está en hardhat.config.ts

```bash
grep "deploy/register" hardhat.config.ts
```

### Error: "No accounts available"

**Solución:** Configurar .env con las cuentas

```bash
# Verificar .env
cat .env

# Debe contener:
ACCOUNT_ADDRESS=0x...
ACCOUNT_PRIVATE_KEY=0x...
ACCOUNTS=key1,key2,key3,key4,key5
```

### Error: "Network not found"

**Solución:** La red dev ya está configurada en `config/networks.ts`

```bash
# Verificar configuración
npx hardhat run --network dev scripts/utils/getSigner.ts
```

### Despliegue muy lento

**Solución:** Usar preset minimal

```bash
npx hardhat deploy:full --network dev --preset minimal
```

## Ejemplo Completo de Output

Cuando ejecutes `deploy:full --preset minimal`, deberías ver algo así:

```
🚀 ISBE Full Deployment
   Network: dev
   Preset: minimal
   Log Level: verbose

✅ secp256k1 network detected - using Secp256k1Provider
📋 Using clean DeploymentOrchestrator with signature provider abstraction

🔐 DEPLOYMENT CONFIGURATION:
   • Network: dev
   • Signature curve: secp256k1
   • Deployer: 0xa019a80922bd32923280E0C5e5A79264b99dC9F8
   • Log level: verbose

📋 DEPLOYMENT OVERVIEW:
   • Business logics to deploy: 24
   • Use cases to deploy: 10

🏗️  STEP 1: GOVERNANCE DEPLOYMENT
🏛️  Deploying governance system...
   🔐 Using secp256k1 signatures
   🔐 ISBE Governance account: 0xa019a80922bd32923280E0C5e5A79264b99dC9F8
   📦 Deploying ISBE factory...
   ✅ Governance deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🏗️  STEP 2: BUSINESS LOGIC DEPLOYMENT
📦 Deploying 24 business logics...
   ✅ IsbeCutFacet deployed
   ✅ IsbeLoupeFacet deployed
   ✅ AccessControlFacet deployed
   ... [24/24] ...

📊 Summary: 24 successful, 0 failed

🏗️  STEP 3: CONFIGURATION REGISTRATION
📝 Registering 10 configurations...
   ✅ [10/10] 100% completed

🏗️  STEP 4: USE CASE DEPLOYMENT
🎯 Deploying 10 use cases...
   ✅ ERC20 Base UseCase: 0x...
   ✅ ERC721 Base UseCase: 0x...
   ✅ Hash Timestamp UseCase: 0x...
   ... [10/10] ...

✅ Despliegue completo exitoso
   Documentación: deploy/docs/02-deployment-phases.md
```

## Siguiente Paso

Una vez que el despliegue funcione en dev, puedes:

1. **Probar despliegue selectivo**:
   ```bash
   npx hardhat deploy:selective --network dev --categories erc20
   ```

2. **Explorar ejemplos**:
   ```bash
   cat deploy/examples/README.md
   ```

3. **Ver documentación completa**:
   ```bash
   cat deploy/README.md
   ```

## Guardar Direcciones

Es importante guardar las direcciones desplegadas:

```bash
# Guardar output completo
npx hardhat deploy:full --network dev --preset minimal 2>&1 | tee deployment-dev-$(date +%Y%m%d-%H%M%S).log

# El archivo contendrá todas las direcciones
cat deployment-dev-*.log | grep "deployed at"
```

---

**¡Listo para probar!** 

Ejecuta:
```bash
npx hardhat deploy:full --network dev --preset minimal --log-level verbose
```
