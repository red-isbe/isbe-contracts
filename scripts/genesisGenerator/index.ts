import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    getCreateAddress,
    getCreate2Address,
    keccak256,
    dataSlice,
    toBeHex,
    Block,
} from 'ethers'

// -----------------------------
// Utilities & Types
// -----------------------------
type GenesisAllocEntry = {
    balance?: string // opcional ("0x0" by default)
    nonce?: string // opcional ("0x0" by default)
    code: string // deployed bytecode  (MANDATORY)
    storage: Record<string, string> // { slotHex: valueHex }
}

export type GenesisAlloc = Record<string, GenesisAllocEntry>

type Hex = string

// A single EVM execution step as returned in `structLogs` from `debug_traceTransaction`.
type Step = {
    /** The opcode mnemonic about to be executed at this step.
     *  Example: "SSTORE", "CALL", "CREATE2", "REVERT", etc.
     */
    op: string

    /** The current call depth at this step.
     *  1 = root context (the transaction itself).
     *  Increments when entering CALL/DELEGATECALL/CALLCODE/CREATE/CREATE2,
     *  and decrements on RETURN/REVERT/end of frame.
     */
    depth: number

    /** Snapshot of the EVM stack *before* executing this opcode.
     *  Each entry is a 32-byte word as hex string ("0x" prefixed).
     *  IMPORTANT: the TOP OF STACK is the LAST element:
     *    top = stack[stack.length - 1]
     *  May be undefined if the tracer was configured with stack disabled.
     */
    stack?: string[]

    /** Snapshot of linear memory *before* executing this opcode.
     *  Represented as an array of 32-byte hex words ("0x" prefixed).
     */
    memory?: string[]
}

// Represents one logical call frame/context in the tracer's simulated call stack.
// A frame is a single EVM execution context on the call stack—created
//  on CALL/DELEGATECALL/CREATE and popped on return—that tracks which bytecode is running and which address’s storage (SSTORE owner) is in scope.
type Frame = {
    /** The storage owner for this frame.
     *  All SSTOREs observed while this frame is active should be attributed to this address.
     *  - CALL               → owner is the callee address
     *  - DELEGATECALL/CALLCODE → owner is inherited from the parent frame (caller)
     *  - CREATE/CREATE2     → owner is the newly created contract address
     */
    owner: Hex

    /** The address whose bytecode is currently being executed in this frame.
     *  This can differ from `owner` in proxy-like patterns:
     *  - DELEGATECALL/CALLCODE → codeAddr = implementation, owner = proxy (caller)
     *  - CALL/CREATE*          → codeAddr equals `owner` (usual case)
     *  Primarily informational, useful for debugging/proxy detection.
     */
    codeAddr: Hex
}

// STATICCALL cannot modify the callee's storage and it is excluded
// DELEGATECALL writes to the current contract's storage (no need to track another owner)
// CALLCODE (deprecated) behaves like DELEGATECALL
// CALL, CREATE, CREATE2 modify storage of the callee/created contract
const CALLS = new Set(['CALL'])
const DELEGATES = new Set(['DELEGATECALL', 'CALLCODE'])
const CREATES = new Set(['CREATE', 'CREATE2'])

/**
 * Convert bigint to 20-byte hex address (0x-prefixed, lowercase)
 * @param x big int o transform to address
 * @returns the address in hex format
 */
const toAddr = (x: bigint): Hex =>
    ('0x' + x.toString(16).slice(-40).padStart(40, '0')).toLowerCase()

/**
 * Read a 32-byte EVM stack word by index **from the top** of the stack.
 *
 * The trace’s stack is an array of hex strings (each a 32-byte word). In most clients,
 * the **top of stack is the last element** of the array, so `nFromTop = 0` reads the top,
 * `1` reads the next, and so on. The returned value is parsed as an unsigned 256-bit BigInt.
 *
 * @param st        Array of 32-byte hex words (with or without `0x` prefix), where the last element is the top of the stack.
 * @param nFromTop  Zero-based index from the top of the stack to read (0 = top, 1 = next below top, ...).
 * @returns         The selected stack word as a BigInt (uint256).
 */
const wordFromTop = (st: string[], nFromTop: number): bigint => {
    const raw = st[st.length - 1 - nFromTop]
    const hex = raw.startsWith('0x') ? raw : '0x' + raw
    return BigInt(hex)
}

/**
 * Normalize an arbitrary hex string to a 32-byte (256-bit) left-padded form.
 *
 * Takes a hex string with or without the `0x` prefix and returns a value
 * prefixed with `0x` and exactly 64 hexadecimal characters (32 bytes),
 * padding on the left with zeros as needed.
 *
 * @param hex  A hex string (with or without `0x`).
 * @returns    A `0x`-prefixed, 64-nibble (32-byte) zero-padded hex string.
 *
 * @example
 * normalize32("0x1a")        // -> "0x000000000000000000000000000000000000000000000000000000000000001a"
 * normalize32("deadbeef")    // -> "0x00000000000000000000000000000000000000000000000000000000deadbeef",
 *   slice after padding: `"0x" + hexNo0x.padStart(64, "0").slice(-64)`.
 */
const normalize32 = (hex: string): Hex =>
    '0x' + hex.replace(/^0x/, '').padStart(64, '0')

/**
 * Heuristically flag “tiny” addresses (numeric value ≤ 0xff).
 *
 * Useful in tracers to filter out stack words that are *probably not* real
 * contract addresses—e.g., small constants like `0x40`, `0x60`, `0x64`
 * (common memory offsets) or **precompile addresses** (on Ethereum, 0x01..0x13).
 *
 * @param addr  A hex string address (e.g., "0x...") to test.
 * @returns     `true` if the numeric value ≤ 0xff (255), otherwise `false`.
 *
 * @example
 * looksTiny("0x0000000000000000000000000000000000000040") // → true  (likely an offset)
 * looksTiny("0x0000000000000000000000000000000000000009") // → true  (precompile 0x09)
 * looksTiny("0x8ba1f109551bd432803012645ac136ddd64dba72") // → false (normal address)
 *
 * @remarks
 * - This is a **heuristic** additional validation, not a validity check. Extremely low-value EOAs
 *   *could* exist, but are extraordinarily unlikely in practice.
 * - Assumes `addr` is a hex string; if you might receive non-hex input,
 *   normalize it first (e.g., ensure it starts with `0x`).
 */
const looksTiny = (addr: string): boolean => BigInt(addr) <= 0xffn // typical low offsets / precompiles

/**
 * Return a byte slice from the EVM linear memory snapshot.
 *
 * `memWords` is the trace’s memory dump represented as an array of 32-byte hex
 * words (each element is a 0x-prefixed 64-nibble string). This function
 * concatenates those words into a single byte array and returns the
 * half-open slice `[offset, offset + size)` as hex.
 *
 * @param memWords Array of 32-byte hex words representing linear memory,
 *                 or `undefined` when memory tracing is disabled.
 * @param offset   Start offset in **bytes** within the linear memory.
 * @param size     Number of **bytes** to return.
 * @returns        A 0x-prefixed hex string containing exactly `size` bytes,
 *                 or `"0x"` when `size === 0` or `memWords` is undefined.
 *
 * @example
 * // memory = 0x00112233 44556677 ...
 * const mem = [
 *   "0x00112233445566778899aabbccddeeff000102030405060708090a0b0c0d0e0f",
 *   "0x101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f",
 * ];
 * memorySlice(mem, 0, 4);   // → "0x00112233"
 * memorySlice(mem, 16, 3);  // → "0xccddeeff".slice(0, 6) = "0xccddee"
 *
 * @remarks
 * - The snapshot reflects memory **before** the current opcode executes.
 * - This implementation does **not** auto-extend with zeros. If `offset + size`
 *   exceeds the available bytes in `memWords`, `ethers`’ `dataSlice` may throw.
 *   On real EVM, reading beyond the allocated region yields zeros; if you need
 *   that behavior, pre-pad `concat` to at least `offset + size` bytes.
 * - Offsets and sizes are in **bytes**, not words.
 */
const memorySlice = (
    memWords: string[] | undefined,
    offset: number,
    size: number
): Hex => {
    if (!memWords || size === 0) return '0x'
    const concat = '0x' + memWords.map((w) => w.replace(/^0x/, '')).join('')
    return dataSlice(concat, offset, offset + size)
}

/**
 * Resolve the callee address for CALL-like opcodes from a stack snapshot.
 *
 * Many tracers expose the EVM stack as an array where the **top of stack is the last element**.
 * Right before CALL/CALLCODE/DELEGATECALL/STATICCALL executes, the stack layout is (top→down):
 *
 *  CALL/CALLCODE:
 *    [0]=gas, [1]=to, [2]=value, [3]=inOffset, [4]=inSize, [5]=outOffset, [6]=outSize
 *
 *  DELEGATECALL/STATICCALL:
 *    [0]=gas, [1]=to, [2]=inOffset, [3]=inSize, [4]=outOffset, [5]=outSize
 *
 * However, some clients or tooling can present slight variations. To be robust, we try a set of
 * candidate indices “fromTop” and validate each candidate address by checking for bytecode on-chain.
 *
 * @param hre  Hardhat runtime, used to query code via provider.getCode
 * @param op   Opcode mnemonic at this step (e.g. "CALL", "DELEGATECALL")
 * @param st   Stack snapshot (hex strings), top is st[st.length - 1]
 * @returns    Lowercased 20-byte hex address string (0x…)
 */
async function resolveCallee(
    hre: HardhatRuntimeEnvironment,
    op: string,
    st: string[]
): Promise<string> {
    const OPC = op.toUpperCase()
    // In most tracers the callee sits at index 1 (second from top).
    const candidates =
        OPC === 'CALL' || OPC === 'CALLCODE'
            ? [1, 2, 5, 4, 6] // expected 1; alternates in case tracer layout differs
            : [1, 4, 2, 5] // STATIC/DELEGATE: expected 1; classic alternates

    for (const fromTop of candidates) {
        if (st.length <= fromTop) continue
        const addr = toAddr(wordFromTop(st, fromTop))
        // Precompiles (1..0xff) have no bytecode but are valid; offsets also fall here
        if (looksTiny(addr)) continue
        const code = await hre.ethers.provider.getCode(addr)
        if (code !== '0x') return addr
    }
    // Last resort: return the most likely (1 from top) even if there's no code
    return toAddr(wordFromTop(st, 1))
}

/**
 * Trace a transaction and collect (contract, slot) pairs for every SSTORE that
 * effectively occurs during its execution (constructor and nested calls).
 *
 * High-level flow:
 *  1) Fetch tx/receipt to determine the root "owner" (the created contract for a
 *     creation tx, or tx.to for a call).
 *  2) Call `debug_traceTransaction` with stack & memory enabled.
 *  3) Walk `structLogs`, maintaining a simulated call-stack of **Frames** keyed by `depth`.
 *     - On CALL          → push frame with owner = callee
 *     - On DELEGATECALL  → push frame with owner = parent.owner (inherits)
 *     - On CALLCODE      → treat like DELEGATECALL (inherits storage owner)
 *     - On CREATE        → compute child address via getCreateAddress(from, nonce)
 *     - On CREATE2       → compute child address via salt + keccak(initcode)
 *     - On SSTORE        → attribute the slot to the **current frame's owner**
 *  4) Deduplicate results and return `Array<{ contract, slot }>` (both hex strings).
 *
 * Notes:
 *  - We compute CREATE/CREATE2 addresses **at ENTER time** so that SSTOREs in constructors
 *    are immediately attributed to the correct contract. If the creation later fails and you
 *    want to roll back, add a failure check on frame exit (not shown here).
 *  - We keep a local `nextCreateNonce` per creator so that subsequent CREATE predictions
 *    are consistent within this single trace.
 *
 * @param hre     Hardhat runtime environment (used for provider & code lookups).
 * @param txHash  Hash of the transaction to trace.
 * @returns       Array of `{ contract, slot }` pairs (slot normalized to 32 bytes).
 */
export async function collectStorageSlotsByContract(
    hre: HardhatRuntimeEnvironment,
    txHash: string
): Promise<Array<{ contract: string; slot: string }>> {
    const provider = hre.network.provider

    // 1) Load tx & receipt to identify root owner (the address whose storage is written at depth=1)
    const tx = await hre.ethers.provider.getTransaction(txHash)
    if (!tx) throw new Error(`Tx ${txHash} not found`)
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash)
    if (!receipt) throw new Error(`Receipt for ${txHash} not found`)

    // If this is a contract creation tx, receipt.contractAddress is the root.
    // Otherwise, use tx.to (could be a contract or an EOA—SSTOREs only make sense in contracts).
    const rootOwner: Hex | undefined = (
        receipt.contractAddress
            ? receipt.contractAddress // Contract creation
            : tx.to
    ) as Hex | undefined // tx.to -> contract call or EOA->EOA

    // 2) Obtain the execution trace. We need:
    //    - stack: to read opcode parameters (e.g., SSTORE slot, CALL target)
    //    - memory: to reconstruct initcode for CREATE2 (offset/size windows)
    //    - storage diffs per step are unnecessary, so disableStorage=true for lighter traces (slot values are read later)
    const trace = await provider.send('debug_traceTransaction', [
        txHash,
        {
            disableStack: false,
            disableMemory: false,
            disableStorage: true,
        },
    ])

    const structLogs: Step[] = trace?.structLogs ?? []

    // 3) State for our simulated call stack + CREATE nonce tracking
    const frames = new Map<number, Frame>() // depth -> frame
    const nextCreateNonce = new Map<string, bigint>() // creator -> next nonce for CREATE

    // Seed depth=1 frame so depth-1 SSTOREs can be attributed even in minimal traces
    if (rootOwner) {
        const ro = rootOwner.toLowerCase()
        frames.set(1, { owner: ro, codeAddr: ro })
        // For a freshly created root contract, its first internal CREATE uses nonce=1.
        nextCreateNonce.set(ro, 1n)
    }

    // Result set (dedup {owner, slot})
    const seen = new Set<string>()
    const result: Array<{ contract: string; slot: string }> = []

    for (const step of structLogs) {
        const op = (step.op ?? '').toUpperCase()
        const st = step.stack ?? []
        const mem = step.memory ?? []
        const d = step.depth ?? 0

        // --- ENTER: push a new frame at depth+1 ---------------------------------
        if (CALLS.has(op)) {
            // Resolve callee robustly from stack (validate with code presence)
            const callee = await resolveCallee(hre, op, st)
            const parentOwner = frames.get(d)?.owner ?? callee
            const owner = op === 'CALLCODE' ? parentOwner : callee
            frames.set(d + 1, { owner, codeAddr: callee })
            console.log(
                `[ENTER ${op}] depth=${d + 1} owner=${owner} code=${callee} stackDepth=${st.length}`
            )
        } else if (DELEGATES.has(op)) {
            // DELEGATECALL/CALLCODE → execute callee's code but write to parent's storage
            const callee = await resolveCallee(hre, op, st)
            const parentOwner = frames.get(d)?.owner ?? callee
            frames.set(d + 1, { owner: parentOwner, codeAddr: callee })
            console.log(
                `[ENTER ${op}] depth=${d + 1} owner=${parentOwner} code=${callee} stackDepth=${st.length}`
            )
        } else if (CREATES.has(op)) {
            // Both CREATE and CREATE2 behaves same way. Only the address derivation differs.
            const creator = frames.get(d)?.owner
            let created = '0x<unknown>'
            if (creator) {
                if (op === 'CREATE') {
                    // CREATE: address = keccak(rlp([creator, nonce]))[12:]
                    // Use and increment a local nonce for deterministic predictions within this trace
                    const n = nextCreateNonce.get(creator) ?? 1n
                    created = getCreateAddress({
                        from: creator,
                        nonce: n,
                    }).toLowerCase()
                    nextCreateNonce.set(creator, n + 1n)
                } else {
                    // CREATE2: address = keccak(0xff || creator || salt || keccak(initcode))[12:]
                    // Stack layout before CREATE2 (top is last element): value(0), inOffset(1), inSize(2), salt(3)
                    const salt = toBeHex(wordFromTop(st, 3), 32)
                    const inOffset = Number(wordFromTop(st, 1))
                    const inSize = Number(wordFromTop(st, 2))
                    const initcode = memorySlice(mem, inOffset, inSize)
                    const initHash = keccak256(initcode)
                    created = getCreate2Address(
                        creator,
                        salt,
                        initHash
                    ).toLowerCase()

                    console.log(
                        '* Salt:',
                        salt,
                        '* InitcodeHash:',
                        initHash,
                        '* Initcode:',
                        initcode,
                        '* Created:',
                        created
                    )
                    const n = nextCreateNonce.get(creator) ?? 1n
                    nextCreateNonce.set(creator, n + 1n)
                }
            }
            frames.set(d + 1, { owner: created, codeAddr: created })
            console.log(
                `[ENTER ${op}] depth=${d + 1} owner=${created} stackDepth=${st.length}`
            )
        }

        // --- SSTORE: print and accumulate { contract, slot } ---
        if (op === 'SSTORE') {
            // If something goes wrong with frames, fall back to rootOwner/tx.to for depth=1
            const fallbackOwner = (
                rootOwner ??
                tx.to ??
                '<unknown>'
            ).toLowerCase()
            const owner = frames.get(d)?.owner ?? fallbackOwner
            if (st.length >= 1) {
                // In SSTORE, the slot is at the top of the stack (value is below it)
                const keyHex = st[st.length - 1] // top-of-stack = slot
                const slot = normalize32(keyHex)
                console.log(`[SSTORE] depth=${d} owner=${owner} slot=${slot}`)

                const k = `${owner}|${slot}`
                if (!seen.has(k)) {
                    seen.add(k)
                    result.push({ contract: owner, slot })
                }
            } else {
                throw new Error(
                    `ERROR: [SSTORE] depth=${d} owner=${owner} slot=<stack-missing>`
                )
            }
        }

        // echo selected call-like opcodes
        if (
            op === 'CALL' ||
            op === 'DELEGATECALL' ||
            op === 'STATICCALL' ||
            op === 'CREATE' ||
            op === 'CREATE2'
        ) {
            console.log(`[op=${op}] callDepth=${d} stackDepth=${st.length}`)
        }
    }

    return result
}

/**
 * Append the (contract → slot → value) structure touched by a given transaction
 * into a genesis-like alloc object, fetching current on-chain values.
 *
 * High-level:
 *  1) Use `collectStorageSlotsByContract(hre, txHash)` to discover all (contract, slot) pairs
 *     that were SSTORE'd during the transaction (constructor + nested calls).
 *  2) Normalize & deduplicate (address+slot).
 *  3) Ensure each contract has an alloc entry (balance/nonce/code/storage).
 *  4) Optionally fetch runtime code for contracts missing `code`.
 *  5) Read each slot's current value from chain (`eth_getStorageAt` at "latest").
 *  6) Insert into `alloc[contract].storage`, respecting `overwriteExistingSlot`.
 *
 * @param hre    Hardhat runtime (used for provider calls and helpers).
 * @param txHash Transaction hash to analyze.
 * @param alloc  Mutable genesis alloc object to augment. Shape:
 *               {
 *                 [address]: {
 *                   balance: "0x..",
 *                   nonce:   "0x..",
 *                   code:    "0x..",
 *                   storage: { [slotHex32]: "0x.." }
 *                 }
 *               }
 * @param opts   Optional behavior flags:
 *               - defaultBalance: default balance for new alloc entries (default "0x0")
 *               - defaultNonce:   default nonce for new alloc entries (default "0x0")
 *               - fetchCodeIfMissing: if true, fetch runtime code for contracts with empty code (default true)
 *               - overwriteExistingSlot: if true, replace existing storage entries (default true)
 *
 * @returns The same `alloc` object passed in, augmented with code & storage entries but updated with new entries
 *
 * @example
 * const alloc = {};
 * await appendSlotStructure(hre, "0xabc...", alloc, { defaultBalance: "0x1", fetchCodeIfMissing: true });
 */
async function appendSlotStructure(
    hre: HardhatRuntimeEnvironment,
    txHash: string,
    alloc: GenesisAlloc,
    opts?: {
        defaultBalance?: string // By default "0x0"
        defaultNonce?: string // By default "0x0"
        fetchCodeIfMissing?: boolean // By default true
        overwriteExistingSlot?: boolean // By default true
    }
): Promise<GenesisAlloc> {
    const {
        defaultBalance = '0x0',
        defaultNonce = '0x0',
        fetchCodeIfMissing = true,
        overwriteExistingSlot = true,
    } = opts ?? {}

    // 1) Discover (contract, slot) affected by the transaction
    const newData: Array<{ contract: string; slot: string }> =
        await collectStorageSlotsByContract(hre, txHash)

    if (newData.length === 0) return alloc

    // 2)  Normalise to lowercase and remove exact duplicates (contract+slot)
    const pairKey = (c: string, s: string) =>
        `${c.toLowerCase()}::${s.toLowerCase()}`
    const unique = new Map<string, { contract: string; slot: string }>()
    for (const { contract, slot } of newData) {
        unique.set(pairKey(contract, slot), {
            contract: contract.toLowerCase(),
            slot: slot.toLowerCase(),
        })
    }
    const toFetch = [...unique.values()]
    if (toFetch.length === 0) return alloc

    // 3) Ensure that there is one alloc entry for each contract.
    for (const { contract } of toFetch) {
        if (!alloc[contract]) {
            alloc[contract] = {
                balance: defaultBalance,
                nonce: defaultNonce,
                code: '0x',
                storage: {},
            }
        } else {
            // Normalise minimum fields
            alloc[contract].balance ??= defaultBalance
            alloc[contract].nonce ??= defaultNonce
            alloc[contract].code ??= '0x'
            alloc[contract].storage ??= {}
        }
    }

    // 4) Fill in code if empty
    if (fetchCodeIfMissing) {
        const needCode = toFetch
            .map(({ contract }) => contract)
            .filter((addr, i, arr) => arr.indexOf(addr) === i) // únicos
            .filter((addr) => !alloc[addr].code || alloc[addr].code === '0x')

        if (needCode.length > 0) {
            const codes = await Promise.all(
                needCode.map((addr) => hre.ethers.provider.getCode(addr))
            )
            for (let i = 0; i < needCode.length; i++) {
                const addr = needCode[i]
                const code = codes[i] ?? '0x'
                // Some providers return ‘0x’ if there is no code.
                alloc[addr].code =
                    code && code !== '0x' ? code : (alloc[addr].code ?? '0x')
            }
        }
    }

    // 5) Read  storage values (latest)
    const values = await Promise.all(
        toFetch.map(({ contract, slot }) =>
            hre.ethers.provider.send('eth_getStorageAt', [
                contract,
                slot,
                'latest',
            ])
        )
    )

    // 6) Insert into storage, avoiding duplicates
    for (let i = 0; i < toFetch.length; i++) {
        const { contract, slot } = toFetch[i]
        const key = slot.startsWith('0x') ? slot : `0x${slot}`
        const val =
            values[i] && values[i].startsWith('0x')
                ? values[i]
                : `0x${values[i] ?? ''}`

        if (overwriteExistingSlot || !(key in alloc[contract].storage)) {
            alloc[contract].storage[key.toLowerCase()] = val.toLowerCase()
        }
    }

    return alloc
}

/**
 * retrieveTransactions
 * Purpose:
 *   Utility to collect transaction hashes over a configurable block range using
 *   the Hardhat runtime environment (HRE). Supports partial options with sane
 *   defaults, configurable logging frequency, and simple concurrency to speed up
 *   scans without overwhelming your RPC provider.
 *
 * Environment:
 *   - Requires Hardhat Runtime Environment (HRE) with an ethers-compatible
 *     provider (hre.ethers.provider).
 *
 * Behavior:
 *   - By default scans from block 0 up to the current latest block.
 *   - Returns an array of transaction hashes (strings) in ascending block order.
 *   - Logs progress every `logEvery` blocks (default: 1). Set to 0 to silence.
 *   - Fetches blocks (headers + tx hashes) via `getBlock(n)`.
 *     If you need full tx objects, switch to `getBlockWithTransactions(n)`.
 *
 *
 * Error handling:
 *   - Throws if a block is missing or if invalid options are provided.
 *
 * Examples:
 *   const txs = await retrieveTransactions(hre);
 * @param hre Hardhat runtime environment
 * @returns Array of transaction hashes (strings)
 */
async function retrieveTransactions(hre: HardhatRuntimeEnvironment) {
    const transactions: string[] = []
    const blockNumber = await hre.ethers.provider.getBlockNumber()
    for (let i = 0; i <= blockNumber; i++) {
        const block: Block | null = await hre.ethers.provider.getBlock(i)
        if (!block) throw new Error(`Block ${i} not found`)

        transactions.push(...block.transactions)
        console.log(
            `Block ${i} processed, ${block.transactions.length} transactions found.`
        )
    }
    return transactions
}

/**
 * Build a genesis-alloc style map by tracing every transaction and merging
 * discovered storage/code into a cumulative structure.
 *
 * Dependencies: `retrieveTransactions(hre)` and `appendSlotStructure(hre, tx, alloc, opts)`.
 * @param {HardhatRuntimeEnvironment} hre - Hardhat runtime (with ethers provider).
 * @returns {Promise<GenesisAlloc>} Final alloc: address → { code?, storage{slot:value}, ... }.
 */
export async function retrieveSlotStructure(
    hre: HardhatRuntimeEnvironment
): Promise<GenesisAlloc> {
    const transactions: Array<string> = await retrieveTransactions(hre)
    let alloc: GenesisAlloc = {}
    for (const txHash of transactions) {
        console.log(`\n🔍 Analyzing transaction ${txHash} ...`)
        alloc = await appendSlotStructure(hre, txHash, alloc, {
            fetchCodeIfMissing: true,
            overwriteExistingSlot: true,
        })
    }
    console.log(
        `\n🎉 Genesis allocation structure completed. ${Object.keys(alloc).length} contracts with modified storage.`
    )
    return alloc
}
