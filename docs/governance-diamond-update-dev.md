# Actualización del Diamante de Gobernanza - Red DEV

**Fecha de generación:** 2026-03-24  
**Red objetivo:** dev  
**Chain ID:** 11073  
**Diamante de gobernanza:** `0x00000000000000000000000000000000000015BE`

---

## Resumen Ejecutivo

Este documento proporciona la guía paso a paso para actualizar los facets del diamante de gobernanza en la red `dev` del ecosistema ISBE (Interoperable Secure Blockchain Ecosystem).

### Acciones a realizar

1. **Verificación inicial** - Obtener estado actual del diamante
2. **Despliegue de facets** - Desplegar nuevos facets actualizados
3. **Actualización del diamante** - Aplicar cambios al diamante de gobernanza
4. **Verificación final** - Confirmar que los cambios se aplicaron correctamente

---

## 1. Pre-requisitos

### 1.1 Configuración de cuenta

Asegúrate de tener las variables de entorno configuradas en tu archivo `.env`:

```bash
# Archivo .env
; Curve: SECP256K1
ACCOUNT_ADDRESS=0xTuDireccion
ACCOUNT_PRIVATE_KEY=0xTuPrivateKey
ACCOUNTS=privatekey1,privatekey2,privatekey3,privatekey4,privatekey5
```

### 1.2 Validar cuentas

```bash
npx hardhat validate-accounts
```

### 1.3 Verificar acceso a la red

```bash
npx hardhat network-info --network dev
```

---

## 2. Proceso de Actualización

### Paso 1: Verificar Estado Actual

Obtener la configuración actual de los facets del diamante:

```bash
npx hardhat showDiamondFacets --network dev
```

**Salida esperada:**

- Lista de facets actuales
- Direcciones de cada facet
- selectors asociados

**Guardar esta información** para对比 (comparación posterior).

---

### Paso 2: Desplegar Facets (Opcional - Solo si hay nuevos facets)

Si necesitas desplegar nuevos facets antes de actualizar el diamante:

```bash
npx hardhat deployFacets --network dev --save-addresses
```

Esto desplegará todos los facets de gobernanza y guardará las direcciones en un archivo.

---

### Paso 3: Actualizar el Diamante

#### Opción A: Dry-run (Vista previa sin ejecutar)

```bash
npx hardhat updateDiamondFacets --network dev --dry-run
```

Esto mostrará qué cambios se harían sin ejecutarlos.

#### Opción B: Actualización completa

```bash
npx hardhat updateDiamondFacets --network dev
```

Esto desplegará todos los facets ISBE y actualizará el diamante.

#### Opción C: Actualizar solo facets específicos

```bash
npx hardhat updateDiamondFacets --network dev \
  --facets '["DiamondCutAccessControlFacet","DiamondLoupeFacet","DiamondCutOwnableFacet"]'
```

---

### Paso 4: Verificar Cambios

Después de la actualización, verificar el nuevo estado:

```bash
npx hardhat showDiamondFacets --network dev
```

---

## 3. Facets del Diamante de Gobernanza

### 3.1 Facets de Núcleo (EIP-2535)

| Facet                          | Función                       | Rol requerido           |
| ------------------------------ | ----------------------------- | ----------------------- |
| `DiamondCutAccessControlFacet` | Modificar facets del diamante | GOVERNANCE_MANAGER_ROLE |
| `DiamondLoupeFacet`            | Introspección de facets       | Público                 |
| `DiamondCutOwnableFacet`       | Gestión de Ownership          | Propietario             |

### 3.2 Facets de Gobernanza

| Facet                             | Función                         | Rol requerido                         |
| --------------------------------- | ------------------------------- | ------------------------------------- |
| `BusinessLogicFactoryFacet`       | Despliegue de lógica de negocio | BUSINESS_LOGIC_DEPLOYER_ROLE          |
| `ConfigurationManagementFacet`    | Gestión de configuraciones      | GOVERNANCE_CONFIGURATION_MANAGER_ROLE |
| `ProxyFactoryFacet`               | Despliegue de use cases         | PROXY_DEPLOYER_ROLE                   |
| `GlobalIsbePauseFacet`            | Pausa global de red             | ISBE_PAUSER_ROLE                      |
| `AccessControlGovernanceFacet`    | Control de acceso               | DEFAULT_ADMIN_ROLE                    |
| `AccessControlDidGovernanceFacet` | Control de acceso DID           | DID_REGISTRY_ROLE                     |

### 3.3 Facets de Identidad

| Facet                         | Función             | Rol requerido             |
| ----------------------------- | ------------------- | ------------------------- |
| `DidRegistryFacet`            | Registro de DID     | DID_REGISTRY_ROLE         |
| `DidRegistryQueryFacet`       | Consulta de DID     | Público                   |
| `TrustedIssuersRegistryFacet` | Emisores confiables | DID_REGISTRY_MANAGER_ROLE |

---

## 4. Plantilla de Evidencia

### 4.1 Registro de Estado - ANTES de actualizar

| Campo       | Valor                                      |
| ----------- | ------------------------------------------ |
| Fecha       | [FECHA_INICIO]                             |
| Red         | dev                                        |
| Chain ID    | 11073                                      |
| Diamante    | 0x00000000000000000000000000000000000015BE |
| Facilitador | [TU_DIRECCION]                             |

#### Facets Actuales

| #   | Facet | Dirección | Selectors |
| --- | ----- | --------- | --------- |
| 1   |       |           |           |
| 2   |       |           |           |
| 3   |       |           |           |
| ... |       |           |           |

---

### 4.2 Registro de Estado - DESPUÉS de actualizar

| Campo       | Valor                                      |
| ----------- | ------------------------------------------ |
| Fecha       | [FECHA_FIN]                                |
| Red         | dev                                        |
| Chain ID    | 11073                                      |
| Diamante    | 0x00000000000000000000000000000000000015BE |
| Facilitador | [TU_DIRECCION]                             |
| Transacción | [TX_HASH]                                  |
| Gas Used    | [GAS]                                      |

#### Facets Nuevos

| #   | Facet | Dirección | Selectors |
| --- | ----- | --------- | --------- |
| 1   |       |           |           |
| 2   |       |           |           |
| 3   |       |           |           |
| ... |       |           |           |

---

## 5. Comandos de Verificación Adicionales

### 5.1 Obtener información de un facet específico

```bash
npx hardhat getFacets --diamond 0x00000000000000000000000000000000000015BE --network dev
```

### 5.2 Obtener dirección de un selector

```bash
npx hardhat getFacetAddress --selector 0x1f931c1c --diamond 0x00000000000000000000000000000000000015BE --network dev
```

### 5.3 Obtener selectors de un facet

```bash
npx hardhat getFacetSelectors --facet 0xDIRECCION_FACET --diamond 0x00000000000000000000000000000000000015BE --network dev
```

### 5.4 Analizar roles de gobernanza

```bash
npx hardhat governance-roles --governance 0x00000000000000000000000000000000000015BE --network dev
```

---

## 6. Resolución de Problemas

### 6.1 Error: Timeout de conexión

Si la conexión a la red falla:

```bash
# Verificar variables de entorno
export DEV_URL="https://tu-endpoint-aqui"

# O usar variable de entorno
DEV_URL="https://tu-endpoint-aqui" npx hardhat showDiamondFacets --network dev
```

### 6.2 Error: Sin permisos

Si falla por permisos (AccessControlError):

- Verificar que la cuenta tenga GOVERNANCE_MANAGER_ROLE
- Verificar que la cuenta tenga DEFAULT_ADMIN_ROLE en el diamante

### 6.3 Error: Facet ya existente

Si el facet ya está desplegado y quieres actualizarlo:

```bash
# Usar la opción de actualizar
npx hardhat updateDiamondFacets --network dev --replace
```

---

## 7. Notas de Seguridad

⚠️ **Importante:**

1. **Make una copia de seguridad** de las direcciones de facets actuales antes de actualizar
2. **Verificar los roles** de la cuenta que ejecutará la actualización
3. **Testear en testnet** primero si es posible
4. **Documentar la transacción** (hash, gas usado, block number)
5. **Confirmar con múltiples fuentes** después de la actualización

---

## 8. Historial de Cambios

| Fecha      | Descripción                   | Facilitador |
| ---------- | ----------------------------- | ----------- |
| 2026-03-24 | Guía inicial de actualización | [Sisyphus]  |
|            |                               |             |
|            |                               |             |

---

## 9. Referencias

- [Documentación de Gobernanza](docs/Governance-Layer-Architecture.md)
- [Diamond Pattern Guidelines](docs/Diamond-pattern-guidelines.md)
- [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [README del proyecto](../README.md)

---

_Documento generado automáticamente como guía para la actualización del diamante de gobernanza en la red dev._
