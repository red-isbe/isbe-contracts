# DOC-001 · Patrón de identidad Smart Contract (ERC-725/734/735)

# 1. Resumen ejecutivo

## 1.1 Objetivo y alcance
- **Objetivo:** describir el **patrón de identidad smart contract** basado en **ERC-725 (identidad/metadata)**, **ERC-734 (gestión de claves)** y **ERC-735 (claims)**.
- **Alcance:** qué estandariza cada ERC, cómo se **combinan**, **modelo de datos** (claves y claims), **operaciones** básicas y consideraciones de **privacidad/seguridad**.
- **Fuera de alcance:** comparativa con **DID/VC** (DOC-003) e integración con **ERC-3643** (DOC-004).

## 1.2 Qué aporta
- **Identidad como contrato (725):** dirección del contrato representa al sujeto y almacena metadata key-value
- **Control por claves (734):** propósitos y umbrales para autorización multifirma
- **Claims verificables (735):** afirmaciones firmadas con estado on-chain
- **Separación clara:** 725=identidad, 734=control, 735=atributos
- **Privacidad por diseño:** PII off-chain, solo hashes/URI en cadena

## 1.3 Qué NO cubre
- No define políticas de confianza (qué emisores/claims aceptar)
- No implementa KYC/AML ni recuperación social
- No resuelve portabilidad fuera de EVM

# 2. Arquitectura lógica

## 2.1 Componentes y límites

```mermaid
graph TB
    subgraph "Identidad On-Chain"
        ID725["ERC-725<br/>(Identity + Metadata<br/>getData/setData)"]
        KM734["ERC-734<br/>(Key Manager<br/>keys, purposes, weights, thresholds)"]
        CL735["ERC-735<br/>(Claims Registry<br/>add/remove/get/verify)"]
    end

    KM734 -->|"Autoriza<br/>setData / gobierno"| ID725
    KM734 -->|"Autoriza<br/>operaciones sensibles"| CL735
```

| ERC | Es | Hace | NO hace |
|---|---|---|---|
| 725 | Contrato identidad | Metadata key-value | No autoriza escrituras |
| 734 | Control de acceso | Multifirma y rotación | No guarda metadata/claims |
| 735 | Claims verificables | Afirmaciones firmadas | No define trust policy |

## 2.2 Flujos principales

```mermaid
sequenceDiagram
    actor Op as Operator
    actor Is as Issuer
    actor Vf as Verifier
    participant KM as ERC-734<br/>Key Manager
    participant ID as ERC-725<br/>Identity
    participant CL as ERC-735<br/>Claims

    rect rgb(200, 220, 240)
        Note over Op,ID: A) Cambio de metadata protegido
        Op->>KM: Solicitar setData(nsKey, value)<br/>(purpose=MANAGEMENT, weight ≥ threshold)
        KM->>ID: setData(nsKey, value)
        ID-->>KM: ok (emit DataChanged)
        KM-->>Op: confirmado
    end

    rect rgb(220, 240, 200)
        Note over Is,CL: B) Alta de claim firmado
        Is->>CL: addClaim(topic, issuer=Is, signature, data, uri)
        CL->>CL: verificar firma (issuer == ecrecover(payload))
        CL-->>Is: ok (emit ClaimAdded)
    end

    rect rgb(240, 220, 200)
        Note over Vf,CL: C) Verificación por tercero
        Vf->>CL: getClaim(topic, issuer=Is)
        CL-->>Vf: {topic, issuer, signature, data, uri}
        Vf->>Vf: validar firma y estado (vigencia/revocación)<br/>+ aplicar política (allowlist/temas)
        Vf-->>Vf: decisión (accept / reject)
    end
```

# 3. Modelo de datos

## 3.1 Claves y control

### Propósitos estándar
```solidity
uint256 constant MANAGEMENT_KEY = 1;  // gobierno
uint256 constant ACTION_KEY = 2;      // operación
uint256 constant CLAIM_SIGNER_KEY = 3;// emisión claims
uint256 constant ENCRYPTION_KEY = 4;  // cifrado (opt)
```

### Estructura clave
```solidity
struct Key {
    bytes32 key;         // hash de pública
    uint256[] purposes;  // MANAGEMENT, ACTION...
    uint256 keyType;     // 1 = ECDSA
    uint256 weight;      // peso para umbral
}
```

### Operaciones principales
```solidity
interface IERC734 {
    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType, uint256 _weight) 
        external returns (bool success);
    
    function removeKey(bytes32 _key, uint256 _purpose) 
        external returns (bool success);
    
    function setThreshold(uint256 _purpose, uint256 _threshold)
        external returns (bool success);
        
    function keyHasPurpose(bytes32 _key, uint256 _purpose)
        external view returns (bool exists);
}
```

## 3.2 Claims verificables

### Estructura base
```solidity
struct Claim {
    bytes32 topic;     // tipo (KYC, etc)
    address issuer;    // quién firma
    bytes signature;   // firma del payload
    bytes data;       // hash/flags (no PII)
    string uri;       // evidencia off-chain
}

// Payload canónico
bytes32 payload = keccak256(abi.encodePacked(
    topic,
    subject,   // previene replay
    version,   // permite evolución
    keccak256(data)
));
```

### Validación claims
```solidity
function validateClaim(Claim memory c) internal view returns (bool) {
    // 1. Reconstruir payload
    bytes32 payload = keccak256(abi.encodePacked(
        c.topic,
        msg.sender,  // subject
        keccak256(c.data)
    ));
    
    // 2. Verificar firma
    address signer = recoverSigner(payload, c.signature);
    require(signer == c.issuer, "Invalid signature");
    
    // 3. Verificar estado
    require(!revoked[c.id], "Claim revoked");
    require(block.timestamp >= c.validFrom, "Claim not yet valid");
    require(c.validTo == 0 || block.timestamp <= c.validTo, "Claim expired");
    
    // 4. Política específica del verificador
    return isIssuerAndTopicAllowed(c.issuer, c.topic);
}
```

## 3.3 Estado claims

### Estructura estado
```solidity
struct ClaimStatus {
    bool revoked;
    uint256 validFrom;
    uint256 validTo;
}

mapping(bytes32 => ClaimStatus) public claimStatus;
```

### Eventos
```solidity
event ClaimAdded(
    bytes32 indexed claimId,
    bytes32 indexed topic,
    address indexed issuer
);

event ClaimRevoked(
    bytes32 indexed claimId,
    address indexed revoker,
    uint256 timestamp
);
```

# 4. Operaciones (playbooks)

## 4.1 Alta inicial

### Pasos
1. Deploy contrato identity
2. Configurar claves iniciales
3. Establecer umbrales
4. Inicializar metadata

### Implementación
```solidity
function setupIdentity(address[] calldata controllers) external {
    require(msg.sender == address(this), "Only identity");
    
    for (uint i = 0; i < controllers.length; i++) {
        addKey(
            keccak256(abi.encodePacked(controllers[i])),
            MANAGEMENT_KEY,
            1, // ECDSA
            1  // weight
        );
    }
    
    setThreshold(MANAGEMENT_KEY, controllers.length);
    setThreshold(ACTION_KEY, 1);
}
```

### Flujo detallado
```mermaid
sequenceDiagram
    actor A as Admin
    participant ID as ERC-725<br/>Identity
    participant KM as ERC-734<br/>KeyMgr

    rect rgb(200, 220, 240)
        Note over A,KM: Despliegue e inicialización
        A->>ID: deploy / instantiate()
        A->>KM: bindTo(ID)
    end

    rect rgb(220, 240, 200)
        Note over A,KM: Altas de claves
        A->>KM: addKey(kMgmt, MANAGEMENT, ... , weight)
        KM-->>A: KeyAdded
        A->>KM: addKey(kOps, ACTION, ... , weight)
        KM-->>A: KeyAdded
        A->>KM: addKey(kClaim, CLAIM_SIGNER, ... , weight)
        KM-->>A: KeyAdded
    end

    rect rgb(240, 220, 200)
        Note over A,KM: Umbrales y metadata
        A->>KM: setThreshold(MANAGEMENT, 2)
        KM-->>A: ThresholdChanged
        A->>KM: setThreshold(ACTION, 1)
        KM-->>A: ThresholdChanged
    end
```

## 4.2 Rotación claves

### Pasos
1. Añadir nueva clave
2. Verificar umbral alcanzado
3. Retirar clave antigua
4. Actualizar metadata

### Implementación
```solidity
function rotateKey(bytes32 oldKey, bytes32 newKey, uint256 purpose) external {
    require(keyHasPurpose(msg.sender, MANAGEMENT_KEY), "Not authorized");
    
    // 1. Añadir nueva
    addKey(newKey, purpose, 1, 1);
    
    // 2. Verificar umbral
    require(getKeyWeight(purpose) >= getThreshold(purpose), "Insufficient weight");
    
    // 3. Retirar antigua
    removeKey(oldKey, purpose);
}
```

### Flujo detallado
```mermaid
sequenceDiagram
    actor A as Admin
    participant KM as ERC-734<br/>KeyMgr

    rect rgb(200, 220, 240)
        Note over A,KM: Rotación normal (control mantenido)
        A->>KM: addKey(kNew, PURPOSES..., weight)
        KM-->>A: KeyAdded
        A->>KM: (opcional) ajustar thresholds
        KM-->>A: ThresholdChanged
        A->>KM: removeKey(kOld, PURPOSES...)
        KM-->>A: KeyRemoved
    end

    rect rgb(220, 240, 200)
        Note over A,KM: Recuperación (clave comprometida/perdida)
        alt Multifirma disponible (≥ threshold)
            A->>KM: removeKey(kCompromised)
            KM-->>A: KeyRemoved
            A->>KM: addKey(kRecovery, MANAGEMENT, weight)
            KM-->>A: KeyAdded
        else Procedimiento de emergencia (gobernanza)
            A->>KM: addKey(kEmerg, MANAGEMENT, highWeight)
            KM-->>A: KeyAdded
            A->>KM: removeKey(kCompromised)
            KM-->>A: KeyRemoved
        end
    end
```

## 4.3 Gestión claims

### Pasos emisor
1. Preparar datos (sin PII)
2. Generar payload canónico
3. Firmar payload
4. Emitir claim

### Implementación emisión
```solidity
function issueClaim(
    address subject,
    bytes32 topic,
    bytes calldata data
) external returns (bytes32) {
    require(keyHasPurpose(msg.sender, CLAIM_SIGNER_KEY), "Not issuer");
    
    // 1. Preparar payload
    bytes32 payload = keccak256(abi.encodePacked(
        topic,
        subject,
        keccak256(data)
    ));
    
    // 2. Firmar
    bytes memory signature = sign(payload);
    
    // 3. Emitir
    return addClaim(topic, msg.sender, signature, data, "");
}
```

### Pasos verificador
1. Obtener claim
2. Validar firma
3. Verificar estado
4. Aplicar política

### Implementación verificación
```solidity
function verifyClaim(bytes32 claimId) external view returns (bool) {
    Claim memory c = getClaim(claimId);
    
    // 1. Validar firma/estado
    bool valid = validateClaim(c);
    
    // 2. Política específica
    return valid && acceptableIssuer[c.issuer];
}
```

### Flujo detallado
```mermaid
sequenceDiagram
    actor Is as Issuer
    actor Vf as Verifier
    participant CL as ERC-735<br/>Claims
    participant ID as ERC-725<br/>Identity (subject)

    rect rgb(200, 220, 240)
        Note over Is,CL: Emisión
        Is->>Is: build data (hash/flags)<br/>+ (opcional) uri
        Is->>Is: payload = keccak256(topic, subject=ID, keccak256(data))
        Is->>Is: signature = sign(issuerPrivKey, payload)
        Is->>CL: addClaim(topic, issuer=Is, signature, data, uri)
        CL->>CL: ecrecover(signature, payload) == issuer ?
        CL-->>Is: ClaimAdded(topic, issuer, claimId)
    end

    rect rgb(220, 240, 200)
        Note over Vf,CL: Verificación
        Vf->>CL: getClaim(topic, issuer=Is)
        CL-->>Vf: {topic, issuer, signature, data, uri}
        Vf->>Vf: recompute payload + verify signature
        Vf->>Vf: check state (revoked == false,<br/>validFrom/validTo)
        Vf->>Vf: apply policy (issuer allowlist,<br/>topics requeridos, grace period)
        Vf-->>Vf: decision (accept / reject)
    end
```

## 4.4 Revocación

### Pasos
1. Verificar autorización
2. Actualizar estado
3. Emitir evento
4. Propagar cambio

### Implementación
```solidity
function revokeClaim(bytes32 claimId) external {
    require(msg.sender == getClaim(claimId).issuer, "Not issuer");
    
    claimStatus[claimId].revoked = true;
    emit ClaimRevoked(claimId, msg.sender, block.timestamp);
}
```

### Flujo detallado
```mermaid
sequenceDiagram
    actor Is as Issuer
    participant CL as ERC-735<br/>Claims
    actor Vf as Verifier

    rect rgb(200, 220, 240)
        Note over Is,CL: Revocación
        Is->>CL: revokeClaim(claimId)
        CL-->>Is: ClaimRevoked(claimId, issuer, ts)
    end

    rect rgb(220, 240, 200)
        Note over Is,CL: Actualización de tiempos/estado
        alt Tiempos firmados en `data`
            Is->>Is: preparar nuevo data (validFrom/validTo)
            Is->>Is: nuevo payload + firma
            Is->>CL: addClaim(topic, issuer, signature, data, uri)
            CL-->>Is: ClaimAdded(newClaimId)
        else Estado mutable en tabla
            Is->>CL: updateState(claimId, flags/fechas)
            CL-->>Is: StateUpdated(claimId)
        end
    end

    rect rgb(240, 220, 200)
        Note over Vf,CL: Consumo tras cambios
        Vf->>CL: getClaim / checkRevoked / vigencia
        CL-->>Vf: estado actual (no revocado / vigente?)
        Vf->>Vf: aplicar política (allowlist, topic, tolerancias)
        Vf-->>Vf: decisión
    end
```

# 5. Roles y reglas

## 5.1 Roles principales

| Rol | Poder | Uso |
|-----|-------|-----|
| Controller | MANAGEMENT | Gobierno |
| Operator | ACTION | Operativa |
| Issuer | CLAIM_SIGNER | Certificación |
| Verifier | Read-only | Consumo |

## 5.2 Reglas prácticas (muy concisas)

- **Separación de funciones:** MANAGEMENT ≠ ACTION ≠ CLAIM_SIGNER
- **Umbrales:** gobierno > operación (2/3 vs 1/n)
- **Rotación:** nuevo → verificar → retirar viejo
- **Privacidad:** solo hashes/URI en cadena

> **Antipatrón:** mezclar gobierno/operación o exponer PII en cadena.