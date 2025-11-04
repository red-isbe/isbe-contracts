# ISBE SDK - Examples

Este directorio contiene ejemplos de uso del ISBE SDK para interactuar con tokens ERC20, ERC721 y contratos desplegados en la red Besu.

## Índice

- [Configuración](#configuración)
- [Ejemplos Básicos](#ejemplos-básicos)
- [Despliegue de Tokens](#despliegue-de-tokens)
- [Herramientas de Utilidad](#herramientas-de-utilidad)
- [Administración](#administración)

---

## Configuración

Todos los ejemplos requieren configurar las siguientes variables de entorno en `sdk/.env`:

```bash
# RPC Endpoint
RPC_URL=https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/

# Factory Proxy Address
FACTORY_ADDRESS=0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de

# Private Key (sin el prefijo 0x)
ACCOUNT_PRIVATE_KEY=your_private_key_here

# Chain ID
CHAIN_ID=2026
```

---

## Ejemplos Básicos

### 1. `01-basic-connection.ts`

**Descripción**: Ejemplo básico de conexión al proveedor RPC y consulta de información de la red.

**Uso**:
```bash
npx ts-node sdk/examples/01-basic-connection.ts
```

**Lo que hace**:
- Conecta al RPC configurado
- Obtiene información de la red (Chain ID, nombre)
- Verifica la conexión del signer
- Muestra el balance del signer

---

### 2. `02-client-configurations.ts`

**Descripción**: Muestra cómo consultar y gestionar configuraciones de cliente (deployments, configuraciones disponibles).

**Uso**:
```bash
npx ts-node sdk/examples/02-client-configurations.ts
```

**Lo que hace**:
- Lee el archivo de configuración del cliente
- Lista todas las configuraciones disponibles (ERC20, ERC721)
- Muestra los deployments realizados
- Información de cada token desplegado

---

## Despliegue de Tokens

### 3. `03-deploy-erc20-token.ts`

**Descripción**: Ejemplo completo de despliegue de un token ERC20 con el Builder Pattern.

**Características**:
- Token: "Mi Token SDK" (MTSDK)
- Features: Burnable
- Asignación automática de roles (ADMIN, MINTER, BURNER)

**Uso**:
```bash
npx ts-node sdk/examples/03-deploy-erc20-token.ts
```

**Pasos que ejecuta**:
1. Configura el token con ERC20Builder
2. Busca la configuración correspondiente
3. Verifica roles requeridos
4. Despliega el token
5. Asigna roles automáticamente
6. Mintea tokens iniciales (opcional)
7. Guarda la configuración en `client-configurations/`

**Salida**:
- Dirección del token desplegado
- Transaction hash
- Configuración guardada localmente

---

### 4. `04-deploy-erc721-nft.ts`

**Descripción**: Ejemplo de despliegue de una colección NFT ERC721.

**Características**:
- Colección: "NFT SDK" (NFTSDK)
- Features: Capped (límite de supply)
- Gestión de roles automática

**Uso**:
```bash
npx ts-node sdk/examples/04-deploy-erc721-nft.ts
```

**Pasos que ejecuta**:
1. Configura el NFT con ERC721Builder
2. Encuentra configuración "ERC721 Capped"
3. Verifica roles necesarios
4. Despliega la colección
5. Asigna roles (ADMIN, MINTER)
6. Mintea NFT de prueba (opcional)
7. Guarda la configuración

**Salida**:
- Dirección de la colección NFT
- Transaction hash del deployment
- Token ID del NFT minteado

---

## Herramientas de Utilidad

### 5. `call-contract.ts`

**Descripción**: Script genérico para llamar a cualquier función de cualquier contrato. Esta es la herramienta principal para interactuar con contratos desplegados.

**Características**:
- Funciona con cualquier contrato
- Detecta automáticamente funciones view vs write
- Usa ABIs comunes (ERC20, ERC721, AccessControl)
- Decodificador de errores integrado
- Estimación de gas opcional
- Sin necesidad de ABI custom (usa estándares)

**Uso**:
```bash
# Sintaxis general
npx ts-node sdk/examples/call-contract.ts <CONTRACT_ADDRESS> <FUNCTION_NAME> [PARAMS...] [--estimate-gas]
```

**Ejemplos**:

```bash
# ============================================
# CONSULTAS (Read-Only - View Functions)
# ============================================

# Consultar nombre del token
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 name

# Consultar símbolo
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 symbol

# Consultar decimales
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 decimals

# Consultar balance de una dirección
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 balanceOf 0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462

# Consultar total supply
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 totalSupply

# Consultar allowance
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 allowance 0xOwner 0xSpender

# ============================================
# TRANSACCIONES (Write Functions)
# ============================================

# Mintear tokens (cantidad con 18 decimales)
# Ejemplo: 55500 tokens = 55500000000000000000000
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 mint 0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462 55500000000000000000000

# Mintear con estimación de gas
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 mint 0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462 55500000000000000000000 --estimate-gas

# Transferir tokens
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 transfer 0xRecipient 1000000000000000000

# Aprobar gasto
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 approve 0xSpender 5000000000000000000

# Quemar tokens
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 burn 100000000000000000

# ============================================
# ROLES Y PERMISOS (Access Control)
# ============================================

# Obtener MINTER_ROLE hash
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 MINTER_ROLE

# Verificar si tiene un rol
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 hasRole 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 0xAddress

# Otorgar rol
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 grantRole 0xRoleHash 0xAddress

# Revocar rol
npx ts-node sdk/examples/call-contract.ts 0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 revokeRole 0xRoleHash 0xAddress
```

**Funciones disponibles (ABIs comunes)**:

**ERC20**:
- `name()`, `symbol()`, `decimals()`
- `balanceOf(address)`, `totalSupply()`
- `transfer(address, uint256)`, `approve(address, uint256)`
- `allowance(address, address)`
- `mint(address, uint256)`, `burn(uint256)`

**ERC721**:
- `ownerOf(uint256)`, `tokenURI(uint256)`
- `safeMint(address, uint256)`

**Access Control**:
- `hasRole(bytes32, address)`, `grantRole(bytes32, address)`, `revokeRole(bytes32, address)`
- `MINTER_ROLE()`, `DEFAULT_ADMIN_ROLE()`

**Common**:
- `owner()`, `paused()`

**Flags**:
- `--estimate-gas`: Estima gas antes de enviar la transacción (solo para write operations)

**Variables de entorno**:
- `RPC_URL`: Endpoint RPC (se carga desde `sdk/.env`)
- `PRIVATE_KEY` o `ACCOUNT_PRIVATE_KEY`: Requerido solo para transacciones

---

### 6. `error-decoder-usage.ts`

**Descripción**: Muestra cómo usar el ErrorDecoder para decodificar errores de contratos.

**Uso**:
```bash
npx ts-node sdk/examples/error-decoder-usage.ts
```

**Lo que hace**:
- Ejemplos de errores conocidos (AccountHasNoRole, CapExceeded, etc.)
- Decodificación de selectores
- Formato de errores para usuarios
- Manejo de errores de ethers.js

**Errores soportados** (30+):
- `AccountHasNoRole(address,bytes32)`
- `CapExceeded(uint256,uint256)`
- `ZeroAddress()`
- `Paused()`
- `NotInitialized()`
- Y muchos más...

---

### 7. `add-deployment.ts`

**Descripción**: Utilidad para añadir manualmente un deployment a la configuración del cliente.

**Uso**:
```bash
npx ts-node sdk/examples/add-deployment.ts
```

**Cuándo usar**:
- Añadir tokens desplegados externamente
- Registrar deployments existentes
- Sincronizar configuración entre equipos

---

## Administración

En el directorio `admin/` encontrarás herramientas para gestionar roles y permisos:

### `admin/grant-role.ts`

Otorga un rol a una dirección específica.

**Uso**:
```bash
npx ts-node sdk/examples/admin/grant-role.ts
```

### `admin/revoke-role.ts`

Revoca un rol de una dirección.

**Uso**:
```bash
npx ts-node sdk/examples/admin/revoke-role.ts
```

### `admin/test-role-manager.ts`

Prueba el RoleManager con casos de uso comunes.

**Uso**:
```bash
npx ts-node sdk/examples/admin/test-role-manager.ts
```

### `admin/test-error-decoder.ts`

Prueba el ErrorDecoder con diferentes tipos de errores.

**Uso**:
```bash
npx ts-node sdk/examples/admin/test-error-decoder.ts
```

---

## Mejores Prácticas

### 1. Estimación de Gas

Siempre que vayas a hacer una transacción importante, usa `--estimate-gas`:

```bash
npx ts-node sdk/examples/call-contract.ts <CONTRACT> <FUNCTION> <PARAMS> --estimate-gas
```

Esto te permitirá:
- Detectar errores antes de gastar gas
- Ver errores decodificados claramente
- Calcular el costo de la transacción

### 2. Cantidades en Wei

Para tokens ERC20 con 18 decimales, recuerda convertir:

```javascript
// 100 tokens = 100 * 10^18
100 tokens = 100000000000000000000

// 1 token = 1 * 10^18
1 token = 1000000000000000000

// 0.5 tokens = 0.5 * 10^18
0.5 tokens = 500000000000000000
```

### 3. **Verificar Roles**

Antes de mintear o quemar, verifica que tienes el rol necesario:

```bash
# 1. Obtener el hash del rol
npx ts-node sdk/examples/call-contract.ts <CONTRACT> MINTER_ROLE

# 2. Verificar si lo tienes
npx ts-node sdk/examples/call-contract.ts <CONTRACT> hasRole <ROLE_HASH> <YOUR_ADDRESS>
```

### 4. **Guardar Transaction Hashes**

Siempre guarda los transaction hashes de operaciones importantes:
- Deployments
- Otorgamiento de roles
- Transferencias grandes
- Cambios de configuración

### 5. **Usar call-contract.ts para Todo**

El script `call-contract.ts` es la herramienta más versátil:
- No necesitas scripts específicos para cada operación
- Funciona con cualquier contrato
- Decodifica errores automáticamente
- Soporta todas las funciones estándar

---

## Troubleshooting

### Error: "PRIVATE_KEY environment variable is required"

**Solución**: Asegúrate de tener `ACCOUNT_PRIVATE_KEY` o `PRIVATE_KEY` en `sdk/.env`

### Error: "Gas estimation failed"

**Causas comunes**:
1. No tienes el rol necesario (MINTER_ROLE, BURNER_ROLE, etc.)
2. Parámetros incorrectos
3. Contrato no inicializado
4. Token pausado

**Solución**: Revisa el error decodificado que muestra el script.

### Error: "could not decode result data (value='0x')"

**Causa**: El contrato no está inicializado o la función no existe.

**Solución**: 
- Verifica que el contrato esté correctamente desplegado
- Asegúrate de que la función exista en el contrato
- Revisa que estés usando la dirección correcta

### Error: "Cannot find module 'dotenv'"

**Solución**:
```bash
npm install dotenv
```

---

## Recursos Adicionales

- **Documentación del SDK**: Ver `ISBE-SDK-Documentation.md` en la raíz del proyecto
- **Error Decoder**: Ver `sdk/src/utils/errorDecoder.ts` para lista completa de errores
- **Contract Connector**: Ver `sdk/src/utils/ContractConnector.ts` para API completa

---

## Flujo de Trabajo Típico

### 1. Desplegar un Token

```bash
# Edita 03-deploy-erc20-token.ts con tus parámetros
npx ts-node sdk/examples/03-deploy-erc20-token.ts
```

### 2. Verificar el Deployment

```bash
# Consulta el nombre
npx ts-node sdk/examples/call-contract.ts <TOKEN_ADDRESS> name

# Consulta el símbolo
npx ts-node sdk/examples/call-contract.ts <TOKEN_ADDRESS> symbol

# Verifica tu balance
npx ts-node sdk/examples/call-contract.ts <TOKEN_ADDRESS> balanceOf <YOUR_ADDRESS>
```

### 3. Mintear Tokens

```bash
# Mintea tokens (ejemplo: 1000 tokens)
npx ts-node sdk/examples/call-contract.ts <TOKEN_ADDRESS> mint <RECIPIENT> 1000000000000000000000
```

### 4. Gestionar Roles

```bash
# Otorgar MINTER_ROLE a otro usuario
npx ts-node sdk/examples/admin/grant-role.ts

# O usar call-contract directamente
npx ts-node sdk/examples/call-contract.ts <TOKEN_ADDRESS> grantRole <MINTER_ROLE_HASH> <USER_ADDRESS>
```

---

## ✨ Ejemplos Rápidos

### Mintear 55,500 tokens (caso de uso real)

```bash
npx ts-node sdk/examples/call-contract.ts \
  0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 \
  mint \
  0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462 \
  55500000000000000000000
```

### Consultar balance después del mint

```bash
npx ts-node sdk/examples/call-contract.ts \
  0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 \
  balanceOf \
  0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462
```

### Transferir tokens

```bash
npx ts-node sdk/examples/call-contract.ts \
  0x0b2c3F1cf80098A2906AD14b5F2A521aDD4BC5D0 \
  transfer \
  0xRecipientAddress \
  1000000000000000000000
```

---

## Notas

- Todos los ejemplos están en TypeScript
- Se ejecutan con `ts-node` (no requieren compilación previa)
- Las configuraciones se guardan automáticamente en `sdk/client-configurations/`
- Los transaction hashes se pueden consultar en el explorador de bloques de Besu

---

## Soporte

Si encuentras problemas:
1. Revisa que `sdk/.env` esté configurado correctamente
2. Verifica que el Factory esté desplegado
3. Consulta los errores decodificados
4. Revisa los logs del RPC
