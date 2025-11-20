# Initializable Version Control - Rules Summary

## Core Principles

### Storage Version States

```
version = 0  →  Never initialized (fresh contract)
version = N  →  Initialized to version N (where N > 0)
version = MAX → Disabled (type(uint256).max)
```

---

## Modifier Rules

### 1. `initializer(bytes32 facetKey, uint256 version)`

**Purpose:** Initial deployment only

**Rule:** Can ONLY be called when `storedVersion == 0`

**Behaviour:**

```solidity
REQUIRE: storedVersion == 0        // Must be fresh/uninitialized
REQUIRE: version > 0               // Cannot use version 0
EXECUTE: function body
SET: storedVersion = version       // Store the version parameter
EMIT: Initialized(facetKey, version)
```

**Examples:**

```solidity
// ✅ VALID: Fresh contract (version = 0)
initializer(KEY, 1)  // 0 → 1 ✅
initializer(KEY, 5)  // 0 → 5 ✅
initializer(KEY, 99) // 0 → 99 ✅

// ❌ INVALID: Already initialized (version > 0)
// After initializer(KEY, 1) sets version to 1:
initializer(KEY, 1)  // 1 → 1 ❌ Reverts (version != 0)
initializer(KEY, 2)  // 1 → 2 ❌ Reverts (version != 0)
initializer(KEY, 10) // 1 → 10 ❌ Reverts (version != 0)
```

---

### 2. `reinitializer(bytes32 facetKey, uint256 version)`

**Purpose:** Contract upgrades

**Rule:** Can ONLY be called when `version > storedVersion`

**Behaviour:**

```solidity
REQUIRE: storedVersion > 0         // Must already be initialized
REQUIRE: version > storedVersion   // Must upgrade, not downgrade or same
REQUIRE: version > 0               // Cannot use version 0
EXECUTE: function body
SET: storedVersion = version       // Update to new version
EMIT: Reinitialized(facetKey, previousVersion, version)
```

**Examples:**

```solidity
// Starting state: version = 1

// ✅ VALID: Upgrading to higher version
reinitializer(KEY, 2)  // 1 → 2 ✅
// Now version = 2

reinitializer(KEY, 3)  // 2 → 3 ✅
// Now version = 3

reinitializer(KEY, 10) // 3 → 10 ✅
// Now version = 10

// ❌ INVALID: Same or lower version
reinitializer(KEY, 10) // 10 → 10 ❌ Reverts (10 <= 10)
reinitializer(KEY, 5)  // 10 → 5 ❌ Reverts (5 < 10)
reinitializer(KEY, 1)  // 10 → 1 ❌ Reverts (1 < 10)

// ❌ INVALID: Cannot reinitialize uninitialized contract
// If version = 0:
reinitializer(KEY, 1)  // 0 → 1 ❌ Reverts (1 <= 0 is false, but 0 is special)
```

---

### 3. `onlyAfterVersion(bytes32 facetKey, uint256 minVersion)`

**Purpose:** Access control based on version

**Rule:** Can ONLY be called when `storedVersion >= minVersion`

**Behaviour:**

```solidity
REQUIRE: storedVersion >= minVersion  // Must meet minimum version
EXECUTE: function body
// Version remains unchanged
```

**Examples:**

```solidity
// Starting state: version = 3

// ✅ VALID: Current version meets or exceeds requirement
onlyAfterVersion(KEY, 1) // 3 >= 1 ✅
onlyAfterVersion(KEY, 2) // 3 >= 2 ✅
onlyAfterVersion(KEY, 3) // 3 >= 3 ✅

// ❌ INVALID: Current version below requirement
onlyAfterVersion(KEY, 4) // 3 >= 4 ❌ Reverts
onlyAfterVersion(KEY, 5) // 3 >= 5 ❌ Reverts
```

### 4. `onlyBeforeVersion(bytes32 facetKey, uint256 minVersion)`

**Purpose:** Access control based on version

**Rule:** Can ONLY be called when `storedVersion <= minVersion`

**Behaviour:**

```solidity
REQUIRE: storedVersion <= minVersion  // Must meet minimum version
EXECUTE: function body
// Version remains unchanged
```

**Examples:**

```solidity
// Starting state: version = 3

// ✅ VALID: Current version meets or exceeds requirement
onlyBeforeVersion(KEY, 5) // 3 >= 5 ✅
onlyBeforeVersion(KEY, 4) // 3 >= 4 ✅
onlyBeforeVersion(KEY, 3) // 3 >= 3 ✅

// ❌ INVALID: Current version below requirement
onlyBeforeVersion(KEY, 2) // 3 >= 2 ❌ Reverts
onlyBeforeVersion(KEY, 1) // 3 >= 1 ❌ Reverts
```

---

## Complete State Transition Table

| Current State | Modifier Call                              | New State     | Result                    |
| ------------- | ------------------------------------------ | ------------- | ------------------------- |
| `version = 0` | `initializer(KEY, 1)`                      | `version = 1` | ✅ Success                |
| `version = 0` | `initializer(KEY, 5)`                      | `version = 5` | ✅ Success                |
| `version = 0` | `reinitializer(KEY, 1)`                    | `version = 0` | ❌ Revert: `1 <= 0`       |
| `version = 1` | `initializer(KEY, X)`                      | `version = 1` | ❌ Revert: `version != 0` |
| `version = 1` | `reinitializer(KEY, 1)`                    | `version = 1` | ❌ Revert: `1 <= 1`       |
| `version = 1` | `reinitializer(KEY, 2)`                    | `version = 2` | ✅ Success                |
| `version = 2` | `reinitializer(KEY, 1)`                    | `version = 2` | ❌ Revert: `1 < 2`        |
| `version = 2` | `reinitializer(KEY, 2)`                    | `version = 2` | ❌ Revert: `2 <= 2`       |
| `version = 2` | `reinitializer(KEY, 3)`                    | `version = 3` | ✅ Success                |
| `version = N` | `onlyAfterVersion(KEY, M)` where `M <= N`  | `version = N` | ✅ Success (no change)    |
| `version = N` | `onlyAfterVersion(KEY, M)` where `M > N`   | `version = N` | ❌ Revert                 |
| `version = N` | `onlyBeforeVersion(KEY, M)` where `M >= N` | `version = N` | ✅ Success (no change)    |
| `version = N` | `onlyBeforeVersion(KEY, M)` where `M < N`  | `version = N` | ❌ Revert                 |

---

## Decision Tree

```
┌─────────────────────────────────────┐
│ What are you trying to do?         │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
  Fresh Deploy      Upgrade?
  (version=0)     (version>0)
      │                 │
      ▼                 ▼
 Use:             Use:
 initializer      reinitializer
 (any version)    (version > current)
      │                 │
      └────────┬────────┘
               │
               ▼
      ┌──────────────────┐
      │ Access Control?  │
      └────────┬─────────┘
               │
               ▼
          Use:
      onlyAfterVersion
    (require minimum)
```

---

## Common Patterns

### Pattern 1: Fresh Deploy to Latest Version

```solidity
// Deploy and initialize directly to v3
function deploy() external {
    MyContract c = new MyContract();
    c.initialize(...);  // initializer(KEY, 3)
    // State: version = 0 → 3
}
```

### Pattern 2: Incremental Upgrades

```solidity
// Deploy at v1, upgrade incrementally
function deployAndUpgrade() external {
    MyContract c = new MyContract();

    // Initial: v1
    c.initializeV1(...);           // initializer(KEY, 1)
    // State: version = 0 → 1

    // Upgrade: v1 → v2
    c.reinitializeV2(...);         // reinitializer(KEY, 2)
    // State: version = 1 → 2

    // Upgrade: v2 → v3
    c.reinitializeV3(...);         // reinitializer(KEY, 3)
    // State: version = 2 → 3
}
```

### Pattern 3: Version-Gated Features

```solidity
contract MyContract {
    // Available from v1
    function basicFunction()
        external
        onlyAfterVersion(KEY, 1) // Works if version >= 1
    {}

    // Available from v2
    function advancedFunction()
        external
        onlyAfterVersion(KEY, 2) // Works if version >= 2
    {}

    // Available from v3
    function premiumFunction()
        external
        onlyAfterVersion(KEY, 3) // Works if version >= 3
    {}
}
```

---

## Error Messages

### `ContractIsAlreadyInitialized(bytes32 facetKey, uint256 currentVersion, uint256 attemptedVersion)`

**Cause:** Tried to use `initializer` when version > 0

**Solution:**

- For fresh deploy: Ensure contract has never been initialized
- For upgrade: Use `reinitializer` instead

### `InvalidReinitializerVersion(bytes32 facetKey, uint256 currentVersion, uint256 attemptedVersion)`

**Cause:** Tried to use `reinitializer` with version <= currentVersion

**Solution:**

- Ensure new version > current version
- Cannot downgrade or use same version
- For fresh deploy: Use `initializer` instead

### `InsufficientVersion(bytes32 facetKey, uint256 currentVersion, uint256 requiredVersion)`

**Cause:** Tried to call function requiring higher version

**Solution:**

- Upgrade contract to required version using `reinitializer`
- Check version requirements before calling function

### `InvalidVersionZero()`

**Cause:** Tried to use version 0 in any modifier

**Solution:**

- Version 0 is reserved for "uninitialized" state
- Always use version >= 1

---

## Quick Reference

| Modifier            | When to Use    | Requirement         | Version Change  |
| ------------------- | -------------- | ------------------- | --------------- |
| `initializer`       | Fresh deploy   | `version == 0`      | `0 → N`         |
| `reinitializer`     | Upgrade        | `version > current` | `N → M` (M > N) |
| `onlyAfterVersion`  | Access control | `version >= min`    | No change       |
| `onlyBeforeVersion` | Access control | `version <= min`    | No change       |

---

## Testing Checklist

```solidity
// ✅ Test: initializer works on fresh contract
test_initializer_from_zero()

// ✅ Test: initializer fails on initialized contract
test_initializer_fails_when_initialized()

// ✅ Test: reinitializer works with higher version
test_reinitializer_upgrade()

// ✅ Test: reinitializer fails with same version
test_reinitializer_fails_same_version()

// ✅ Test: reinitializer fails with lower version
test_reinitializer_fails_downgrade()

// ✅ Test: onlyAfterVersion allows access when version sufficient
test_onlyAfterVersion_allows_access()

// ✅ Test: onlyAfterVersion blocks access when version insufficient
test_onlyAfterVersion_blocks_access()

// ✅ Test: sequential upgrades v1 → v2 → v3
test_sequential_upgrades()

// ✅ Test: cannot initialize after reinitialize
test_cannot_initialize_after_reinitialize()
```
