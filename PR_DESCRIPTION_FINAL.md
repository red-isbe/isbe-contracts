## Summary

This PR extends the global pausing mechanism to support **modality-2 contracts** — standalone contracts that implement `ISBEPause` but are not registered in the proxy factory. It also updates `Pause` / `PauseInternal` to convert checks into modifiers and adds a full test suite covering 100% of the casuistry for `GlobalIsbePause`.

---

### Changes

#### `GlobalIsbePause.sol`

Removed the `onlyDeployedProxy` guard. Added `onlyContract` modifier to reject EOA addresses at the facade before any internal logic is reached. Both modality-1 and modality-2 use the same `ISBEPause` interface — the routing between them is handled in the internal layer.

#### `GlobalIsbePauseInternal.sol`

Replaced the single try-catch path with explicit mod-1 / mod-2 routing:

- **Modality 1 (registered proxy)** — `_applyPause` / `_applyUnpause` call `ISBEPause(addr).pause()` / `.unpause()` directly. Errors bubble raw. If it fails it is our own code that is broken and must be fixed in the contracts.
- **Modality 2 (unregistered contract)** — calls go through the generic `_execute(address, bytes4)` handler. Any failure, regardless of its format, is wrapped in `PauseCallFailed(target, selector, returnData)`. This gives governance the evidence needed to take political action against the non-compliant contract without having to decode every possible error format.

Added `PauseCallFailed(address target, bytes4 selector, bytes returnData)` error to `IGlobalIsbePause`. The raw payload is intentionally not decoded — off-chain tooling can do that independently.

Removed all try-catch, assembly re-bubble, and `returnData.length` / `_isProxyDeployed` checks from inside a catch.

#### `Pause.sol` / `PauseInternal.sol`

- Converted `_checkPauserRoles` and `_checkAuthorityLevel` to modifiers (`onlyPauserRole`, `onlySufficientAuthorityLevel`) in `PauseInternal`, applied in the correct order on the external functions in `Pause.sol`.
- `_pause()` and `_unpause()` have no guards on the internals — `whenNotPaused` / `whenPaused` on the external functions is sufficient.
- `initializePause` simplified to `if (_paused) _pause()`.
- `_initPauseState` removed — it was not needed given the above.

#### `scripts/utils/publicKeyToAddress.ts`

Simplified to use `ethers.computeAddress` directly. The only pre-processing needed is adding the `0x04` SEC1 marker for raw X||Y keys (128 hex chars without marker).

---

### New test contracts

| Contract             | Purpose                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mod2PausableMock`   | Minimal standalone `ISBEPause`-compatible contract. Takes an `authorizedPauser` in the constructor (set to the governance diamond in tests). Used to validate mod-2 pause/unpause flows. |
| `NoPauseMock`        | Empty contract with no functions. Produces empty `returnData` when `pause()` / `unpause()` is called (undefined selector → implicit revert with no data).                                |
| `FallbackRevertMock` | Contract with a `fallback()` that reverts with a custom error. Produces non-empty `returnData` without being ISBEPause-compliant.                                                        |

---

### Test suite — `GlobalIsbePause.spec.ts` (27 tests)

**`pauseIsbe`**

- No role → `AccountHasNoRole`
- Zero address → `AddressZero`
- EOA → `InvalidProxy` (onlyContract modifier)
- Contract without `pause()` → `PauseCallFailed`
- Governance diamond (ISBEPause-compliant, unregistered) → `PauseCallFailed`
- Mod-2 with wrong authorized pauser → `PauseCallFailed`
- Contract with reverting fallback → `PauseCallFailed`
- Mod-2 double-pause → `PauseCallFailed` (unregistered contracts never bubble internal errors)
- Registered proxy already paused → bubbles `IsPaused` directly (no wrapping)
- Registered proxy, not paused → success + `IsbePaused` event
- Mod-2 authorized → success + `IsbePaused` event
- State: `authorityLevel()` == `type(uint256).max` after pause (governance holds `_ISBE_ROLE` on every proxy it deploys)

**`unpauseIsbe`**

- No role → `AccountHasNoRole`
- Zero address → `AddressZero`
- EOA → `InvalidProxy`
- Contract without `unpause()` → `PauseCallFailed`
- Governance diamond (unregistered) → `PauseCallFailed`
- Mod-2 already unpaused → `PauseCallFailed`
- Contract with reverting fallback → `PauseCallFailed`
- Registered proxy not paused → bubbles `IsNotPaused` directly
- Registered proxy paused → success + `IsbeUnpaused` event
- Mod-2 authorized, full pause/unpause cycle → success + `IsbeUnpaused` event
- State: `authorityLevel()` resets to `0` after unpause

> **Note on `InsufficientAuthorityLevel`:** this error is architecturally unreachable via `unpauseIsbe`. The proxy factory always grants `_ISBE_ROLE` to the governance diamond on every proxy it deploys (`ProxyFactoryInternal._buildIsbeRoleMembers`), giving it `authorityLevel = type(uint256).max`. Since `_checkAuthorityLevel` always passes for governance, this scenario is out of scope here and is covered in the `Pause` unit tests.

---

### Coverage

| File                        | % Stmts | % Branch | % Funcs | % Lines |
| --------------------------- | ------- | -------- | ------- | ------- |
| GlobalIsbePause.sol         | 100     | 100      | 100     | 100     |
| GlobalIsbePauseInternal.sol | 100     | 100      | 100     | 100     |
| IGlobalIsbePause.sol        | 100     | 100      | 100     | 100     |
| GlobalIsbePauseFacet.sol    | 100     | 100      | 100     | 100     |
| Pause.sol                   | 100     | 78       | 100     | 100     |
| PauseInternal.sol           | 90      | 50       | 100     | 100     |

The remaining gaps in `pause/` are branches of `_compareAuthorityLevels` and `_getAuthorityLevel` not exercised from this suite — covered in `Pause.spec.ts`.
