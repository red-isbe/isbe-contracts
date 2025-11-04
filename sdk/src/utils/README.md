# Utils Module

Helper utilities for the SDK.

## errorDecoder

Decode smart contract errors to human-readable messages.

```typescript
import { decodeError, formatError } from './errorDecoder';

try {
  await contract.mint(...);
} catch (error: any) {
  const decoded = decodeError(error);
  console.log(formatError(decoded));
  // Example: AccountHasNoRole(0x..., 0xd8e8f9f9...)
}
```

### Supported Errors

- `AccountHasNoRole(address,bytes32)`
- `NotInitialized(address,bytes32)`
- `FacetNotInitialized(address,bytes32)`
- `CapExceeded()`
- `NewCapIsLessThanTotalSupply(uint256,uint256)`
- `InvalidConfiguration(bytes32)`
- `FacetNotFound(bytes32)`
- `AccessDenied(address)`
- `Paused()`
- `InvalidRole(bytes32)`

### Methods

- `decodeError(errorData)` - Decode error from transaction
- `formatError(decoded)` - Format decoded error for display
- `getErrorSelector(signature)` - Get selector from signature
- `findErrorSignature(selector)` - Find signature from selector
```

### constants.ts (Futuro)

**Propósito:** Constantes comunes del SDK.

**Contenido previsto:**
- Selectores de funciones comunes
- Selectores de errores conocidos
- Valores por defecto (decimals, gas limits, etc.)
- Timeouts y retry policies

**Uso esperado:**
```typescript
import { ERROR_SELECTORS, DEFAULT_DECIMALS } from './utils/constants';

const ACCOUNT_HAS_NO_ROLE = ERROR_SELECTORS.AccountHasNoRole; // 0xa1180aad
const decimals = DEFAULT_DECIMALS; // 18
```

---

### retry.ts (Futuro)

**Propósito:** Lógica de reintentos para transacciones.

**Funciones previstas:**
- `retryWithBackoff(fn, options)` - Reintentar con backoff exponencial
- `waitForReceipt(txHash, confirmations)` - Esperar confirmaciones
- `estimateWithRetry(contract, method, params)` - Estimar gas con reintentos

---

### index.ts (Futuro)

**Propósito:** Exportar todas las utilidades.

```typescript
export * from './encoders';
export * from './validators';
export * from './errorDecoder';
export * from './formatters';
export * from './constants';
export * from './retry';
```

---

## Prioridad de implementación

1. **encoders.ts** (Alta) - Necesario para construir initData
2. **validators.ts** (Alta) - Prevenir errores comunes
3. **formatters.ts** (Media) - Mejorar UX de consola
4. **errorDecoder.ts** (Media) - Debugging de errores
5. **constants.ts** (Baja) - Organización de código
6. **retry.ts** (Baja) - Robustez en producción

## Cuando implementar

Las utilidades se implementarán gradualmente conforme se necesiten:

- **encoders.ts** → Al crear ERC20Builder/ERC721Builder
- **validators.ts** → Al implementar formularios/builders
- **errorDecoder.ts** → Al crear AdminTools
- **formatters.ts** → Al mejorar logging y UX
- **constants.ts** → Cuando acumulemos muchas "magic strings"
- **retry.ts** → Para producción/mainnet

## Contribuir

Al agregar nuevas utilidades:

1. Crear el archivo en `src/utils/`
2. Agregar documentación clara con ejemplos
3. Exportar desde `src/utils/index.ts`
4. Actualizar este README
5. Agregar tests (cuando tengamos test suite)
