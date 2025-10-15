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
export type GenesisAllocEntry = {
    contractName?: string
    balance?: string
    nonce?: string
    code: string
    storage: Record<string, string>
}

export type GenesisAlloc = Map<string, GenesisAllocEntry>

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
     *  Used to reconstruct initcode for CREATE2.
     */
    memory?: string[]

    /** Not needed but used for internal audit purposes */
    storage?: Record<string, { prev: string; current: string }>
}

// Represents one logical call frame/context in the tracer's simulated call stack.
// A frame is a single EVM execution context on the call stack—created
//  on CALL/DELEGATECALL/CREATE and popped on return—that tracks which bytecode is running and which address’s storage (SSTORE owner) is in scope.
type Frame = {
    /** The storage owner for this frame.
     *  All SSTOREs observed while this frame is active should be attributed to this address.
     *  - CALL/STATICCALL       → owner is the callee address
     *  - DELEGATECALL/CALLCODE → owner is inherited from the parent frame (caller)
     *  - CREATE/CREATE2        → owner is the newly created contract address
     */
    owner: Hex

    /** The address whose bytecode is currently being executed in this frame.
     *  This can differ from `owner` in proxy-like patterns:
     *  - DELEGATECALL/CALLCODE → codeAddr = implementation, owner = proxy (caller)
     *  - CALL/CREATE*          → codeAddr equals `owner` (usual case)
     *  Primarily informational, useful for debugging/proxy detection.
     */
    //codeAddr?: Hex --- NOT NEEDED ANYMORE ---
    /**
     * TIs a create operation (CREATE or CREATE2)

     */
    opcode: string
}

/**
 * Nonce management. It also acts as an address registry
 */
class Nonces {
    private map: Map<string, bigint> = new Map<string, bigint>()

    initialize(address: string, start: bigint = 0n) {
        this.map.set(address, start)
    }

    getNonce(address: string): bigint | undefined {
        const current = this.map.get(address)
        if (current === undefined) {
            return undefined
        }
        this.map.set(address, current + 1n)
        return current
    }

    getCurrent(address: string): bigint | undefined {
        const next = this.map.get(address)
        return next
    }

    toString(): string {
        let str: string = ''
        for (const k of this.map.keys()) {
            str += `[${k}]: ${this.map.get(k)}}\n`
        }
        return str
    }
}

const nonces = new Nonces()

/**
 * Frames management. It has information regaring all contexts (depths) (opcodes,owners)
 */
class Frames {
    private map: Map<number, Frame> = new Map<number, Frame>()

    set(depth: number, frame: Frame) {
        this.map.set(depth, frame)
    }

    get(depth: number): Frame {
        const frame = this.map.get(depth)
        if (!frame) {
            throw new Error(`Frame not found for depth ${depth}`)
        }
        return frame
    }

    toString(): string {
        let str: string = ''
        for (const k of this.map.keys()) {
            str += `[${k}]: ${JSON.stringify(this.map.get(k), null, 2)}\n`
        }
        return str
    }
}

const frames: Frames = new Frames()

/**
 * Convert bigint to 20-byte hex address (0x-prefixed, lowercase)
 * @param x big int o transform to address
 * @returns the address in hex format
 */
// const toAddr = (x: bigint): Hex =>
//     ('0x' + x.toString(16).slice(-40).padStart(40, '0')).toLowerCase()

const toAddrStr = (str: string): Hex => {
    return '0x' + str.slice(-40).padStart(40, '0').toLowerCase()
}

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
    if (!raw)
        throw new Error(
            `Stack underflow reading ${nFromTop} from top. Stack size: ${st}`
        )
    const hex = raw.startsWith('0x') ? raw : '0x' + raw
    return BigInt(hex)
}

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
 *  4) Deduplicate results and return `Map<string, Set<string>>` (both hex strings). Bear in minf that a contract could not have any slot
 *
 * Notes:
 *  - We compute CREATE/CREATE2 addresses **at ENTER time** so that SSTOREs in constructors
 *    are immediately attributed to the correct contract. If the creation later fails and you
 *    want to roll back, add a failure check on frame exit (not shown here).
 *  - We keep a local `nextCreateNonce` per creator so that subsequent CREATE predictions
 *    are consistent within this single trace.
 *   This function does not extract slot's value, only a set of modified slots per contract. Values are extracted in a later step.
 *
 *  Known limitations:
 *  - This function assumes no SSTORE occurs in a STATICCALL context or any nested context. If so the will be processed as if they were in a CALL context.
 *  - This function assumes no REVERT occurs. If a revert occurs, all SSTOREs will be processed as if they were successful. Code must be tested.
 *
 * @param hre     Hardhat runtime environment (used for provider & code lookups).
 * @param txHash  Hash of the transaction to trace.
 * @returns       Array of `{ contract, slot }` pairs (slot normalized to 32 bytes).
 */
export async function collectStorageSlotsByContract(
    hre: HardhatRuntimeEnvironment,
    txHash: string
): Promise<Map<string, Set<string>>> {
    // const result: Array<{ contract: string; slot: string }> = new Array<{
    //     contract: string
    //     slot: string
    // }>()
    const resultStorage = new Map<string, Set<string>>()
    const provider = hre.network.provider

    // 1) Load tx & receipt to identify root owner (the address whose storage is written at depth=1)
    const tx = await hre.ethers.provider.getTransaction(txHash)
    if (!tx) throw new Error(`Tx ${txHash} not found`)
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash)
    if (!receipt) throw new Error(`Receipt for ${txHash} not found`)

    // If this is a contract creation tx, receipt.contractAddress is the root.
    // Otherwise, use tx.to (could be a contract or an EOA, SSTOREs only make sense in contracts).
    // const rootOwnerRaw: Hex | undefined = (
    //     receipt.contractAddress
    //         ? receipt.contractAddress // Contract creation
    //         : tx.to
    // ) as Hex | undefined // tx.to -> contract call or EOA->EOA
    let rootOwnerRaw: Hex
    if (receipt.contractAddress) {
        console.log('TX IS A CONTRACT CREATION: ' + receipt.contractAddress)
        rootOwnerRaw = receipt.contractAddress // Contract creation
    } else if (tx.to) {
        console.log('TX IS A CALL TO: ' + tx.to)
        rootOwnerRaw = tx.to
    } else {
        throw new Error(
            `Tx ${txHash} has no to address and is not a contract creation`
        )
    }

    if (!rootOwnerRaw) {
        throw new Error(
            `Tx ${txHash} has no to address and is not a contract creation`
        )
    }
    const rootOwner = rootOwnerRaw.toLowerCase()
    console.log(`Root owner (depth=1) is ${rootOwner} `)

    // 2) Obtain the execution trace. We need:
    //    - stack: to read opcode parameters (e.g., SSTORE slot, CALL target)
    //    - memory: to reconstruct initcode for CREATE2 (offset/size windows)
    //    - storage diffs per step are unnecessary, but it is used for double check and debugging purposes
    process.stdout.write('\x1b[31mRequesting TX trace from Hardhat...\x1b[0m\r')
    const trace = await provider.send('debug_traceTransaction', [
        txHash,
        {
            disableStack: false, // Opcode parameters and return values
            disableMemory: false, // For CREATE2 initcode reconstruction
            disableStorage: false, // We don't need per-step storage diffs as THEY HAVE NO INFORMATION REGARDING CONTRACT OWNERSHIP. Used for audiring purposes only
        },
    ])
    process.stdout.write(
        `                                                                         \r`
    )
    //const callCode=(await provider.send('eth_getTransactionByHash', [txHash]))?.input??"0x";
    // console.log("-------------------------------------------------------------------");
    // console.log(`Transaction ${txHash} callCode=${callCode}`);

    const structLogs: Step[] = trace?.structLogs ?? []
    //console.log(`Struct logs: ${structLogs.length} steps`);

    // 3) State for our simulated call stack + CREATE nonce tracking

    let previousOp = '<NONE (EOA)>'
    const ro = rootOwner.toLowerCase()
    frames.set(1, { owner: ro, opcode: previousOp })
    // For a freshly created root contract, its first internal CREATE uses nonce=1.

    resultStorage.set(ro, new Set()) // In any case, we create an entry as it can have SSTOREs
    if (nonces.getCurrent(ro) === undefined) {
        console.log('Root owner ' + ro + ' not known, initializing nonce to 1')
        nonces.initialize(ro, 1n) // as it is creating a contract nonce starts with 1 not 0
        resultStorage.set(ro.toLowerCase(), new Set())
    } else {
        console.log(
            'Root owner ' +
                ro +
                ' already known, it is an INVOCATION. NO NEED TO INCRENMENT NONCE current nonce is ' +
                nonces.getCurrent(ro)
        )
    }

    /*********************************************************************************************
     * Main loop: walk the trace steps, maintaining a simulated call stack of Frames keyed by depth.
     * PREVIOUS* variables that track the last step's values (depth, op, stack, memory)
     * FRAMES takes track of the frame level (they have not relation with previous variables). Manages EVM environment (owners, opcodes)
     * STACK is used to keep track of the current execution context (in short: opcode params and return values are in the stack)
     * MEM (memory) is used to reconstruct initcode for CREATE2 (offset/size windows)
     * STORAGE is used only for internal control and debugging purposes
     ************************************************************************************************/
    let previousDepth = 0
    let count = 0
    let currentOwner = rootOwner.toLowerCase()
    let previousStack: string[] = []
    let previousMem: string[] = []
    let sstoreCount = 0

    // LOOP to process all opcodes
    for (const step of structLogs) {
        const op = step.op.toUpperCase()
        const st = step.stack
        //console.log(`Opcode: ${op} Depth: ${step.depth} Stack: ${st?.length} items`);
        if (!st) {
            throw new Error(
                `Step ${count} has no stack (tracer must enable stack). ${JSON.stringify(step)}`
            )
        }
        const mem = step.memory
        if (!mem) {
            throw new Error(
                `Step ${count} has no memory (tracer must enable memory). ${JSON.stringify(step)}`
            )
        }
        const depth = step.depth
        if (!depth || depth < 0) {
            throw new Error(
                `Step ${count} has invalid depth ${depth}. ${JSON.stringify(step)}`
            )
        }
        const storage = step.storage

        if (depth > previousDepth) {
            //entered in a deeper depth (it happens when a call, delegatecall, staticcall, create or create2 is done)
            console.log(
                `${'--'.repeat(depth)}> [ENTER] ${previousDepth} >> ${depth}  from ${previousOp} current owner ${currentOwner}`
            )
            if (previousOp === 'CALL') {
                const callee = toAddrStr(
                    previousStack[previousStack.length - 2]
                )
                console.log(
                    `${'--'.repeat(depth)} + CALL callee: ${callee} STACK [${previousStack.length}] `
                )
                frames.set(depth, { owner: callee, opcode: previousOp })
                currentOwner = callee
                // Double check if called contract  exists
                if (nonces.getCurrent(callee) === undefined) {
                    errorInfo(
                        previousStack,
                        previousDepth,
                        depth,
                        op,
                        frames,
                        resultStorage,
                        `ERROR IN CALL: CONTACT NOT FOUND for callee ${callee} at depth ${depth}`
                    )
                }
            } else if (
                previousOp === 'DELEGATECALL' ||
                previousOp === 'CALLCODE'
            ) {
                const callee = toAddrStr(
                    previousStack[previousStack.length - 2]
                )
                //const callee = await resolveCallee(hre, previousOp, st)
                console.log(
                    `${'--'.repeat(depth)} + DELEGATECALL callee: ${callee}  STACK [${previousStack.length}] `
                )
                frames.set(depth, { owner: currentOwner, opcode: previousOp }) // DELEGATECALL inherits owner from caller
                // Double check if called contract  exists
                if (nonces.getCurrent(callee) === undefined) {
                    errorInfo(
                        previousStack,
                        previousDepth,
                        depth,
                        op,
                        frames,
                        resultStorage,
                        `ERROR IN DELEGATECALL: CONTACT NOT FOUND for callee ${callee} at depth ${depth}`
                    )
                }
            } else if (previousOp === 'STATICCALL') {
                const callee = toAddrStr(
                    previousStack[previousStack.length - 2]
                )
                //const callee = await resolveCallee(hre, previousOp, st)
                console.log(
                    `${'--'.repeat(depth)} + STATICCALL callee: ${callee} STACK [${previousStack.length}] `
                )
                frames.set(depth, { owner: callee, opcode: previousOp })
                currentOwner = callee
                // Double check if called contract  exists
                if (nonces.getCurrent(callee) === undefined) {
                    errorInfo(
                        previousStack,
                        previousDepth,
                        depth,
                        op,
                        frames,
                        resultStorage,
                        `ERROR IN STATICCALL: CONTACT NOT FOUND for callee ${callee} at depth ${depth}`
                    )
                }
            } else if (previousOp === 'CREATE') {
                const creator = currentOwner
                const nonce = nonces.getNonce(creator)
                //console.log(`New nonce for ${creator} is ${nonce}`)
                if (nonce === undefined) {
                    errorInfo(
                        previousStack,
                        previousDepth,
                        depth,
                        op,
                        frames,
                        resultStorage,
                        `ERRROR: CONTACT NOT FOUND for creator ${creator} nonce ${nonce}`
                    )
                    return new Map() // Not needed as errorInfo throws an exception; but to satisfy typescript
                }
                const created = getCreateAddress({
                    from: creator,
                    nonce: nonce,
                }).toLowerCase()
                console.log(
                    `${'--'.repeat(depth)} + CREATED newowner: ${created} pevious owner: ${creator} STACK [${previousStack.length}] `
                )
                frames.set(depth, { owner: created, opcode: previousOp })
                currentOwner = created
                nonces.initialize(created, 0n) //Takes track of cretated contract. Starts with 0 as it has not yet created any contract
                resultStorage.set(created.toLocaleLowerCase(), new Set())
            } else if (previousOp === 'CREATE2') {
                const creator = currentOwner
                const salt = toBeHex(wordFromTop(previousStack, 3), 32)
                const inOffset = Number(wordFromTop(previousStack, 1))
                const inSize = Number(wordFromTop(previousStack, 2))
                const initcode = memorySlice(previousMem, inOffset, inSize)
                const initHash = keccak256(initcode)
                const created = getCreate2Address(
                    creator,
                    salt,
                    initHash
                ).toLowerCase()
                console.log(
                    `${'--'.repeat(depth)} + CREATED2 owner: ${created} STACK [${previousStack.length}] `
                )
                frames.set(depth, { owner: created, opcode: previousOp })
                currentOwner = created
                nonces.initialize(created, 0n) //Takes track of cretated contract. Starts with 0 as it has not yet created any contract
                const nonce = nonces.getNonce(creator) //NONCE IS NOT USED FOR CREATE2 BUT WE NEED TO INCREMENT FOR FUTURE CREATEs (MANDATORY)
                if (nonce === undefined) {
                    errorInfo(
                        previousStack,
                        previousDepth,
                        depth,
                        op,
                        frames,
                        resultStorage,
                        `ERRROR: CONTACT NOT FOUND in nonces for creator2 ${creator} nonce ${nonce}`
                    )
                }
                resultStorage.set(created.toLocaleLowerCase(), new Set())
            } else if (previousOp != '<NONE (EOA)>') {
                //Internal error. Should never happen.previousOp could be <NONE (EOA)> in the first step of a contract creation transaction
                errorInfo(
                    previousStack,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERRROR: UNKNOWN OPCODE ${previousOp} CANNOT ENTER IN A DEEPER DEPTH ${depth} from ${previousDepth}`
                )
            }
        } else if (depth < previousDepth) {
            // exited from a deeper depth (it happens when exists from a call, create?, delegatecall or staticcall)
            //returned from a depth
            const storedOwner = frames.get(depth).owner
            const potentialCreatedContract = frames.get(previousDepth).owner
            if (!storedOwner) {
                // Internal error, should never happen
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERRROR: storedOwner NOT FOUND for depth ${previousDepth}`
                )
            }
            const storedOp = frames.get(previousDepth).opcode
            if (!storedOp) {
                // Internal error, should never happen
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERRROR: storedOp NOT FOUND for depth ${previousDepth}`
                )
            }
            if (
                storedOwner == currentOwner &&
                !(storedOp == 'DELEGATECALL' || storedOp == 'CALLCODE')
            ) {
                // Internal error, should never happen
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    storedOp,
                    frames,
                    resultStorage,
                    `ERRROR: EXITING TO THE SAME OWNER ${currentOwner} AT A DEEPER DEPTH ${depth} from ${previousDepth}`
                )
            }
            console.log(
                `<${'--'.repeat(previousDepth)} [Exit] ${previousDepth} >> ${depth}  from ${previousOp} from owner ${currentOwner} to owner ${storedOwner} caused by ${storedOp}`
            )
            if (storedOp === 'CREATE' || storedOp === 'CREATE2') {
                console.log(
                    `+${'--'.repeat(previousDepth)} [RETURN FROM CREATE?] ${depth}  from ${previousOp} at depth ${previousDepth} from owner ${currentOwner} to owner ${storedOwner}`
                )
                //console.log(`+${"--".repeat(d)} ${showStack(st)}`);
                const returnedAddress = toAddrStr(st[st.length - 1])
                if (returnedAddress !== potentialCreatedContract) {
                    //double check if returned address is the same than stored owner (i.e. precalculated address)
                    errorInfo(
                        st,
                        previousDepth,
                        depth,
                        storedOp,
                        frames,
                        resultStorage,
                        `ERRROR: RETURNED ADDRESS ${returnedAddress} NOT MATCHING STORED OWNER ${potentialCreatedContract} for depth ${previousDepth} `
                    )
                }
            } else if (
                storedOp != 'CALL' &&
                storedOp != 'DELEGATECALL' &&
                storedOp != 'STATICCALL' &&
                storedOp != 'CALLCODE' &&
                storedOp != '<NONE (EOA)>'
            ) {
                // Internal error, should never happen
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERRROR: UNKNOWN STORED OPCODE ${storedOp} CANNOT EXIT TO A PREVIOUS DEPTH ${depth} from ${previousDepth}`
                )
            }
            currentOwner = storedOwner
        }

        if (op === 'SSTORE') {
            const keyHex = st[st.length - 1] // top-of-stack = slot
            const slot = normalize32(keyHex).substring('0x'.length) // normalize to 32 bytes, remove "0x"
            console.log(
                `${'--'.repeat(depth)}> [SSTORE] (owner, slot) (${currentOwner}, ${slot}) `
            )
            //result.push({ contract: currentOwner, slot })
            const storageOwner = resultStorage.get(currentOwner.toLowerCase())
            if (!storageOwner) {
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERRROR: UNKNOWN CONTRACT IN RESULTSTORAGE ${currentOwner} CANNOT STORE SLOT ${slot} `
                )
                return new Map<string, Set<string>>() // Not needed as errorInfo throws an exception; but to satisfy typescript
            }
            storageOwner.add(slot)
            sstoreCount++
            if (!Object.prototype.hasOwnProperty.call(storage ?? {}, slot)) {
                // Internal error, should never happen as storage tracing is enabled
                errorInfo(
                    st,
                    previousDepth,
                    depth,
                    op,
                    frames,
                    resultStorage,
                    `ERROR: SSTORE SLOT [${slot}] MUST BE IN STORAGE {${JSON.stringify(storage)}} (tracer must enable storage))`
                )
            }
        }

        previousDepth = depth
        previousOp = op
        previousStack = st
        previousMem = mem
        count++
    }

    console.log(
        `<${'--'.repeat(previousDepth)} [EXIT] ${previousDepth} from ${previousOp} at depth ${previousDepth} current owner ${currentOwner}`
    )

    console.log(`Processed ${sstoreCount} SSTORAGE / ${count} OPCODES`)

    return resultStorage
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
export async function appendSlotStructure(
    hre: HardhatRuntimeEnvironment,
    txHash: string,
    alloc: GenesisAlloc
): Promise<GenesisAlloc> {
    // 1) Descubrir (address -> Set<slot>) afectados por la tx
    const newData: Map<
        string,
        Set<string>
    > = await collectStorageSlotsByContract(hre, txHash)

    // console.log("\n+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    // newData.forEach((slots, address) => {
    //     console.log(`Contract ${address} has ${slots.size} slots modified`);
    // });
    // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n");

    if (newData.size === 0) return alloc

    const provider = hre.ethers.provider

    // 2) Procesar cada contrato afectado
    for (const [rawAddress, slots] of newData.entries()) {
        const address = rawAddress.toLowerCase()
        //console.log(`Contract ${address} has ${slots.size} slots modified`)

        // Obtener o crear la entrada en alloc (Map)
        let entry = alloc.get(address)
        if (!entry) {
            console.log(
                `New contract found ${address} with ${slots.size} slots modified, creating default entry`
            )
            const storage: Record<string, string> = {}
            slots.forEach((slot) => {
                if (!(slot in storage)) storage[slot] = '0x0'
                //console.log(`   New slot found ${slot}: initializing to 0x0`);
            })
            entry = {
                contractName: 'NONAME',
                balance: '0',
                nonce: '0',
                code: (await provider.getCode(address)) ?? 'ERROR NO CODE',
                storage,
            }
            alloc.set(address, entry)
        } else {
            //console.log(`Contract ${address} with ${slots.size} slots modified already in alloc`);
            const storage = entry.storage ?? {}
            slots.forEach((slot) => {
                if (!(slot in storage)) storage[slot] = '0x0'
                //console.log(`   New slot found ${slot}: initializing to 0x0`);
            })
        }
    }
    // Map + Set ya garantizan unicidad por (address, slot)
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

async function retrieveSlotValues(
    hre: HardhatRuntimeEnvironment,
    alloc: GenesisAlloc
): Promise<GenesisAlloc> {
    const provider = hre.ethers.provider

    for (const [contractAddress, entry] of alloc) {
        const address = contractAddress?.toLowerCase()
        if (!address) continue

        const slots = Object.keys(entry.storage)
        if (slots.length === 0) continue

        // Lecturas por lotes para no saturar el nodo
        const chunkSize = 16
        for (let i = 0; i < slots.length; i += chunkSize) {
            const chunk = slots.slice(i, i + chunkSize)

            await Promise.all(
                chunk.map(async (slot) => {
                    const pos = normalize32(slot) // <-- tu función
                    try {
                        // ethers v6: obtiene el valor del slot en "latest" por defecto
                        const valueHex = await provider.getStorage(address, pos)
                        entry.storage[slot] = valueHex ?? '0x0'
                    } catch {
                        throw new Error(
                            `Failed to fetch storage for ${address} slot ${slot}`
                        )
                    }
                })
            )
        }
    }
    return alloc
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
    let alloc: GenesisAlloc = new Map<string, GenesisAllocEntry>()
    for (const txHash of transactions) {
        console.log(`\n🔍 Analyzing transaction ${txHash} ...`)
        alloc = await appendSlotStructure(hre, txHash, alloc)
        console.log('Current alloc size: ' + alloc.size + ' contracts\n')
    }

    alloc = await retrieveSlotValues(hre, alloc)

    console.log(
        `\n🎉 Genesis allocation structure completed. ${Object.keys(alloc).length} contracts with modified storage.`
    )
    return alloc
}

/**
 * Dumps complete state of the sctack .
 * @param st Stack at this moment
 * @param fromTop Stack could be very big, so we can limit the output to the last n elements. 0 means all the stack
 * @returns stringified stack
 */
function showStack(st: string[], fromTop: number = 0): string {
    if (fromTop == 0) return JSON.stringify(st)
    if (st.length <= fromTop) return JSON.stringify(st)
    return JSON.stringify(st.slice(-fromTop))
}

/**
 * Generates a complete dump of the current state for main internal structures
 * and throws an error with the provided message.
 * @param st Current stack at error moment
 * @param d2 Current depth at error moment
 * @param op Current operation at error moment
 * @param f Current frames structure at error moment
 * @param message Personalized message to include in the error
 * @throws always, with a complete dump of the current state
 */
function errorInfo(
    st: string[],
    d: number,
    d2: number,
    op: string,
    f: Frames,
    r: Map<string, Set<string>>,
    message: string
) {
    throw new Error(`${message} \n
    from ${d} >> ${d2} stack length[${st.length}]: \n 
    OPCODE: ${op} \n
    DUMP STACK----------------------------\n
    ${showStack(st)} \n
    DUMP FRAMES ---------------------------\n
    ${f.toString()} \n
    DUMP NONCES ----------------------------\n
    ${nonces.toString()} \n
    DUMP RESULLT KEYS ----------------------------\n
    ${[...r.keys()]} \n
    ---------------------------------------`)
}

/**
 * NOT USED: FOR debugging purposes
 * Try to figure out the nonce used to create a contract
 * by calculating all the possible addresses from nonce 0 to 150
 * and comparing it with the address of the created contract
 * @param storedOwner  address of the creator of the contract
 * @param checkedAddress
 * @returns nothing
 */
// function figureOutAddress(storedOwner: string, checkedAddress: string) {
//     console.log(`Attempting to resolve address for stored owner: ${storedOwner}`);
//     for(let nonce=0n; nonce<= 150n ; nonce = nonce +1n){
//         let calculated = getCreateAddress({from: storedOwner, nonce: nonce}).toLowerCase();
//         if(calculated === checkedAddress){
//             console.log(`Resolved address ${checkedAddress} for stored owner ${storedOwner} with nonce ${nonce}`);
//             return;
//         }
//     }
//     console.log(`Could not resolve address ${checkedAddress} for stored owner ${storedOwner}`);
// }
