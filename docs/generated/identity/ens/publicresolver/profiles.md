## INameResolver

Interface for managing reverse DNS resolution within the Ethereum Name Service

_Provides functionality to associate human-readable names with ENS nodes for
reverse lookup operations as specified in EIP-181_

### NameChanged

```solidity
event NameChanged(bytes32 node, string name)
```

Emitted when a name is associated with an ENS node

#### Parameters

| Name | Type    | Description                                          |
| ---- | ------- | ---------------------------------------------------- |
| node | bytes32 | The ENS node hash receiving the new name association |
| name | string  | The human-readable name being assigned to the node   |

### setName

```solidity
function setName(bytes32 node, string newName) external
```

Associates a human-readable name with an ENS node for reverse resolution

_Enables reverse DNS lookups by storing the canonical name for a given node_

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| node    | bytes32 | The ENS node hash to receive the name association            |
| newName | string  | The human-readable name to associate with the specified node |

### name

```solidity
function name(bytes32 node) external view returns (string associatedName)
```

Retrieves the human-readable name associated with an ENS node

_Returns the canonical name for reverse DNS resolution as defined in EIP-181_

#### Parameters

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated name |

#### Return Values

| Name           | Type   | Description                                          |
| -------------- | ------ | ---------------------------------------------------- |
| associatedName | string | The human-readable name linked to the specified node |

## INameResolver

Interface for managing reverse DNS resolution within the Ethereum Name Service

_Provides functionality to associate human-readable names with ENS nodes for
reverse lookup operations as specified in EIP-181_

### NameChanged

```solidity
event NameChanged(bytes32 node, string name)
```

Emitted when a name is associated with an ENS node

#### Parameters

| Name | Type    | Description                                          |
| ---- | ------- | ---------------------------------------------------- |
| node | bytes32 | The ENS node hash receiving the new name association |
| name | string  | The human-readable name being assigned to the node   |

### setName

```solidity
function setName(bytes32 node, string newName) external
```

Associates a human-readable name with an ENS node for reverse resolution

_Enables reverse DNS lookups by storing the canonical name for a given node_

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| node    | bytes32 | The ENS node hash to receive the name association            |
| newName | string  | The human-readable name to associate with the specified node |

### name

```solidity
function name(bytes32 node) external view returns (string associatedName)
```

Retrieves the human-readable name associated with an ENS node

_Returns the canonical name for reverse DNS resolution as defined in EIP-181_

#### Parameters

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated name |

#### Return Values

| Name           | Type   | Description                                          |
| -------------- | ------ | ---------------------------------------------------- |
| associatedName | string | The human-readable name linked to the specified node |

---

## IPubkeyResolver

Interface for managing SECP256k1 public key records within ENS nodes

_Provides functionality to store and retrieve elliptic curve public keys for
cryptographic verification and digital signature operations as defined in EIP-619_

### PubkeyChanged

```solidity
event PubkeyChanged(bytes32 node, bytes32 x, bytes32 y)
```

Emitted when a public key is associated with an ENS node

#### Parameters

| Name | Type    | Description                                                     |
| ---- | ------- | --------------------------------------------------------------- |
| node | bytes32 | The ENS node hash receiving the new public key assignment       |
| x    | bytes32 | The X coordinate of the elliptic curve point for the public key |
| y    | bytes32 | The Y coordinate of the elliptic curve point for the public key |

### setPubkey

```solidity
function setPubkey(bytes32 node, bytes32 x, bytes32 y) external
```

Associates a SECP256k1 public key with an ENS node

_Stores the elliptic curve coordinates for cryptographic verification purposes_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to receive the public key assignment |
| x    | bytes32 | The X coordinate of the SECP256k1 elliptic curve point |
| y    | bytes32 | The Y coordinate of the SECP256k1 elliptic curve point |

### pubkey

```solidity
function pubkey(bytes32 node) external view returns (bytes32 xCoordinate, bytes32 yCoordinate)
```

Retrieves the SECP256k1 public key associated with an ENS node

_Returns the elliptic curve coordinates as defined in EIP-619 specification_

#### Parameters

| Name | Type    | Description                                              |
| ---- | ------- | -------------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated public key |

#### Return Values

| Name        | Type    | Description                                                     |
| ----------- | ------- | --------------------------------------------------------------- |
| xCoordinate | bytes32 | The X coordinate of the elliptic curve point for the public key |
| yCoordinate | bytes32 | The Y coordinate of the elliptic curve point for the public key |

## IPubkeyResolver

Interface for managing SECP256k1 public key records within ENS nodes

_Provides functionality to store and retrieve elliptic curve public keys for
cryptographic verification and digital signature operations as defined in EIP-619_

### PubkeyChanged

```solidity
event PubkeyChanged(bytes32 node, bytes32 x, bytes32 y)
```

Emitted when a public key is associated with an ENS node

#### Parameters

| Name | Type    | Description                                                     |
| ---- | ------- | --------------------------------------------------------------- |
| node | bytes32 | The ENS node hash receiving the new public key assignment       |
| x    | bytes32 | The X coordinate of the elliptic curve point for the public key |
| y    | bytes32 | The Y coordinate of the elliptic curve point for the public key |

### setPubkey

```solidity
function setPubkey(bytes32 node, bytes32 x, bytes32 y) external
```

Associates a SECP256k1 public key with an ENS node

_Stores the elliptic curve coordinates for cryptographic verification purposes_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to receive the public key assignment |
| x    | bytes32 | The X coordinate of the SECP256k1 elliptic curve point |
| y    | bytes32 | The Y coordinate of the SECP256k1 elliptic curve point |

### pubkey

```solidity
function pubkey(bytes32 node) external view returns (bytes32 xCoordinate, bytes32 yCoordinate)
```

Retrieves the SECP256k1 public key associated with an ENS node

_Returns the elliptic curve coordinates as defined in EIP-619 specification_

#### Parameters

| Name | Type    | Description                                              |
| ---- | ------- | -------------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated public key |

#### Return Values

| Name        | Type    | Description                                                     |
| ----------- | ------- | --------------------------------------------------------------- |
| xCoordinate | bytes32 | The X coordinate of the elliptic curve point for the public key |
| yCoordinate | bytes32 | The Y coordinate of the elliptic curve point for the public key |

---

## ITextResolver

Interface for managing arbitrary text metadata records within ENS nodes

_Provides functionality to store and retrieve key-value text data pairs for
flexible metadata management and decentralised identity information storage_

### TextChanged

```solidity
event TextChanged(bytes32 node, string indexedKey, string key, string value)
```

Emitted when text data is associated with an ENS node and key

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| node       | bytes32 | The ENS node hash receiving the text data assignment     |
| indexedKey | string  | The text data key indexed for efficient filtering        |
| key        | string  | The text data key identifier for metadata categorisation |
| value      | string  | The text data value being stored for the specified key   |

### setText

```solidity
function setText(bytes32 node, string key, string value) external
```

Associates text data with an ENS node using a specified key

_Stores arbitrary text metadata for flexible information management_

#### Parameters

| Name  | Type    | Description                                              |
| ----- | ------- | -------------------------------------------------------- |
| node  | bytes32 | The ENS node hash to receive the text data assignment    |
| key   | string  | The text data key identifier for metadata categorisation |
| value | string  | The text data value to store for the specified key       |

### text

```solidity
function text(bytes32 node, string key) external view returns (string textValue)
```

Retrieves text data associated with an ENS node and key

_Returns the stored text metadata for the specified node and key combination_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to query for text data               |
| key  | string  | The text data key identifier to retrieve the value for |

#### Return Values

| Name      | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| textValue | string | The text data value associated with the node and key |

## ITextResolver

Interface for managing arbitrary text metadata records within ENS nodes

_Provides functionality to store and retrieve key-value text data pairs for
flexible metadata management and decentralised identity information storage_

### TextChanged

```solidity
event TextChanged(bytes32 node, string indexedKey, string key, string value)
```

Emitted when text data is associated with an ENS node and key

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| node       | bytes32 | The ENS node hash receiving the text data assignment     |
| indexedKey | string  | The text data key indexed for efficient filtering        |
| key        | string  | The text data key identifier for metadata categorisation |
| value      | string  | The text data value being stored for the specified key   |

### setText

```solidity
function setText(bytes32 node, string key, string value) external
```

Associates text data with an ENS node using a specified key

_Stores arbitrary text metadata for flexible information management_

#### Parameters

| Name  | Type    | Description                                              |
| ----- | ------- | -------------------------------------------------------- |
| node  | bytes32 | The ENS node hash to receive the text data assignment    |
| key   | string  | The text data key identifier for metadata categorisation |
| value | string  | The text data value to store for the specified key       |

### text

```solidity
function text(bytes32 node, string key) external view returns (string textValue)
```

Retrieves text data associated with an ENS node and key

_Returns the stored text metadata for the specified node and key combination_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to query for text data               |
| key  | string  | The text data key identifier to retrieve the value for |

#### Return Values

| Name      | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| textValue | string | The text data value associated with the node and key |
