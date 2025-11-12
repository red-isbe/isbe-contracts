# QUICKSTART - Prueba en 3 Pasos

##  Archivo Actualizado

El archivo `hardhat.config.ts` **YA está actualizado** con:

```typescript
// Register new deploy system commands
import './deploy/register'
```

##  Para Probar AHORA

### Paso 1: Verificar comandos disponibles

```bash
npx hardhat --help | grep "deploy:"
```

**Debes ver:**
```
deploy:full        Despliegue completo del sistema ISBE
deploy:governance  Desplegar solo Governance Diamond
deploy:selective   Despliegue selectivo de use cases
deploy:validate    Validar despliegue existente
```

Si NO los ves, reinicia tu terminal y vuelve a intentar.

### Paso 2: Verificar cuentas

```bash
npx hardhat validate-accounts
```

**Debe mostrar:**
```
✅ Loaded 5 valid accounts from environment
```

### Paso 3: ¡Desplegar!

#### Opción A: Red Dev (Producción)

```bash
npx hardhat deploy:full --network dev --preset minimal --log-level verbose
```

#### Opción B: Red Local (Testing)

```bash
# Terminal 1: Iniciar red
npx hardhat node

# Terminal 2: Desplegar
npx hardhat deploy:full --network localhost --preset minimal
```

##  ¿Qué Hace?

```
1. Despliega Governance Diamond        ✅ (1 contrato)
2. Despliega Business Logic Facets     ✅ (24 contratos)
3. Registra Configuraciones            ✅ (~10 configs)
4. Despliega Use Cases                 ✅ (~10 proxies)
```

**Tiempo:** 5-10 minutos en dev

##  Si Todo Funciona

Verás al final:

```
✅ Despliegue completo exitoso
   Governance deployed at: 0x...
   Business Logics: 24
   Configurations: 10
   Use Cases: 10
```

**Guarda esa dirección de Governance!**

## ❌ Si Algo Falla

### Error: "Task deploy:full not found"

```bash
# Verificar que está el import
grep "deploy/register" hardhat.config.ts

# Debe aparecer:
import './deploy/register'
```

### Error: "No accounts available"

```bash
# Verificar .env
cat .env | grep ACCOUNT

# Debe tener:
ACCOUNT_ADDRESS=0x...
ACCOUNT_PRIVATE_KEY=0x...
```

### Error de red

```bash
# Probar primero en localhost
npx hardhat node  # Terminal 1
npx hardhat deploy:full --network localhost --preset minimal  # Terminal 2
```

##  Documentación

- **Guía completa**: [deploy/README.md](README.md)
- **Testing en dev**: [deploy/TESTING_DEV.md](TESTING_DEV.md)
- **Ejemplos**: [deploy/examples/01-quick-start.md](examples/01-quick-start.md)
- **Integración**: [deploy/INTEGRATION.md](INTEGRATION.md)

##  Comandos Útiles

```bash
# Ver ayuda de un comando
npx hardhat deploy:full --help

# Solo governance (más rápido)
npx hardhat deploy:governance --network dev

# Despliegue selectivo (solo ERC20)
npx hardhat deploy:selective --network dev --categories erc20

# Validar despliegue
npx hardhat deploy:validate --network dev --governance 0x...
```

##  Comparación

**Antes:**
```bash
npx hardhat deployAllClean --network dev
```

**Ahora:**
```bash
npx hardhat deploy:full --network dev --preset minimal
```

Ambos hacen **exactamente lo mismo**, solo cambia la interfaz.

---

**¿Listo? Ejecuta:**
```bash
npx hardhat deploy:full --network dev --preset minimal --log-level verbose
```

**O para testing local:**
```bash
npx hardhat deploy:full --network localhost --preset minimal
```

---

##  Atajos NPM (Opcional)

Para mayor comodidad, también puedes usar scripts NPM:

```bash
# En lugar de: npx hardhat deploy:full --network dev
npm run deploy:full:dev

# Con flags adicionales usando --
npm run deploy:full:dev -- --preset minimal --log-level verbose
```

**Scripts disponibles:**
- `npm run deploy:full:dev` - Despliegue completo en dev
- `npm run deploy:full:mvp` - Despliegue completo en mvp
- `npm run deploy:governance:dev` - Solo governance en dev
- `npm run deploy:selective:erc20` - Solo tokens ERC20

Ver todos los scripts: [README.md - Scripts NPM](README.md#scripts-npm)
