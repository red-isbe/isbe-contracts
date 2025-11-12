# Integración del Sistema Deploy

Este documento explica cómo integrar el nuevo sistema de deploy con el hardhat.config.ts existente.

## Quick Start

### Paso 1: Importar en hardhat.config.ts

Agrega esta línea al final de tu `hardhat.config.ts`:

```typescript
// Al final del archivo, después de todas las configuraciones

// Importar nuevo sistema de deploy
import './deploy/register'
```

### Paso 2: Verificar comandos disponibles

```bash
npx hardhat --help
```

Deberías ver los nuevos comandos:
- `deploy:full`
- `deploy:governance`
- `deploy:selective`
- `deploy:validate`

### Paso 3: Probar el sistema

```bash
# Despliegue completo en red local
npx hardhat deploy:full --network hardhat

# Ver opciones de un comando
npx hardhat deploy:full --help
```

## Compatibilidad con Sistema Anterior

### Ambos sistemas funcionan en paralelo

```bash
# Sistema antiguo (sigue funcionando igual)
npx hardhat deployAllClean --network mvp

# Sistema nuevo (nueva interfaz)
npx hardhat deploy:full --network mvp
```

### Migración gradual

El nuevo sistema **NO rompe** nada existente:

1. ✅ Todas las tasks existentes siguen funcionando
2. ✅ Los scripts existentes no se modifican
3. ✅ El nuevo sistema **reutiliza** todo el código existente
4. ✅ Puedes migrar comando por comando cuando estés listo

## Arquitectura de Integración

```
hardhat.config.ts
    ├── import './tasks/register'         # Sistema existente
    └── import './deploy/register'        # Sistema nuevo
                    ↓
            deploy/commands/
                ├── deploy-full.ts        # Llama a: deployAllClean
                ├── deploy-governance.ts  # Llama a: deployIsbeFactory
                ├── deploy-selective.ts   # Llama a: deployAllClean con config
                └── deploy-validate.ts    # Llama a: validaciones existentes
```

## Ejemplo de hardhat.config.ts

```typescript
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

// ... otras importaciones ...

// Importar tasks existentes
import './tasks/register'

// Importar nuevo sistema de deploy
import './deploy/register'

const config: HardhatUserConfig = {
    // ... tu configuración existente ...
}

export default config
```

## Ventajas del Nuevo Sistema

### 1. Comandos más intuitivos

**Antes:**
```bash
npx hardhat deployAllClean --network mvp --no-deploy-use-cases
```

**Ahora:**
```bash
npx hardhat deploy:full --network mvp --no-use-cases
```

### 2. Despliegue selectivo simplificado

**Antes:** Crear archivo JSON manualmente

**Ahora:**
```bash
npx hardhat deploy:selective --categories erc20 --extensions burnable
```

### 3. Documentación integrada

```bash
npx hardhat deploy:full --help
```

Muestra documentación clara de todas las opciones.

### 4. Estructura modular

```
deploy/
├── commands/       # Comandos CLI claros
├── docs/          # Documentación por fase
└── README.md      # Guía principal
```

## Reutilización de Código

### El nuevo sistema NO duplica código:

```typescript
// deploy/commands/deploy-full.ts

// ❌ NO hace esto:
async function deployFull() {
    // Código duplicado de deployAllClean
}

// ✅ Hace esto:
async function deployFull() {
    await hre.run('deployAllClean', args)  // Reutiliza código existente
}
```

### Providers reutilizados:

```typescript
// deploy/providers/Secp256k1Provider.ts

// ❌ NO hace esto:
export class Secp256k1Provider { /* código duplicado */ }

// ✅ Hace esto:
export { Secp256k1SignatureProvider as Secp256k1Provider }
    from '../../../tasks/deployment/providers/Secp256k1SignatureProvider'
```

### Constantes reutilizadas:

```typescript
// deploy/03-configurations/

// ❌ NO hace esto:
export const ERC20_CONFIGS = [ /* duplicar constantes */ ]

// ✅ Hace esto:
// Documentación que referencia:
// tasks/deployment/constants/DeploymentConstants.ts
```

## Testing

### Verificar integración

```bash
# 1. Verificar que los comandos se registraron
npx hardhat --help | grep deploy:

# 2. Probar despliegue en hardhat
npx hardhat deploy:full --network hardhat --preset minimal

# 3. Verificar que el sistema antiguo sigue funcionando
npx hardhat deployAllClean --network hardhat
```

### Verificar que no hay duplicación

```bash
# Buscar imports duplicados
grep -r "deployAllClean" deploy/

# Resultado esperado: Solo llamadas via hre.run(), sin código duplicado
```

## Troubleshooting

### Error: "Task deploy:full not found"

**Solución:** Verificar que `import './deploy/register'` está en hardhat.config.ts

### Error: "deployAllClean is not a task"

**Solución:** Verificar que `import './tasks/register'` está antes de `import './deploy/register'`

### Los comandos nuevos no aparecen

**Solución:**
```bash
# Limpiar cache
npx hardhat clean

# Recompilar
npx hardhat compile

# Verificar
npx hardhat --help
```

## Roadmap de Migración

### Fase 1: Coexistencia (Actual)

-  Ambos sistemas funcionan
-  Sin breaking changes
-  Nuevo sistema reutiliza código existente

### Fase 2: Adopción gradual

- Equipo empieza a usar comandos `deploy:*`
- Documentación apunta al nuevo sistema
- Sistema antiguo se mantiene

### Fase 3: Deprecación (Futuro)

- Marcar comandos antiguos como deprecated
- Redirigir a nuevos comandos
- Mantener por compatibilidad

## Soporte

- **Documentación**: [deploy/README.md](README.md)
- **Comandos**: `npx hardhat deploy:* --help`
- **Ejemplos**: [deploy/examples/](examples/)

---


