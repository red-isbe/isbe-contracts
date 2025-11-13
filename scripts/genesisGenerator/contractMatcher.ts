import type { HardhatRuntimeEnvironment, Artifact } from 'hardhat/types'
import { GenesisAlloc } from './slotExtractor'
import { id as keccak256 } from 'ethers'

const ISBE_GOVERNANCE_CONTRACT_NAME: string = 'EIP2535AccessControl'

type contractData = {
    contractCode?: Map<string, string> // address -> bytecode
    selectorIndex?: Map<string, string> // selector -> address
}

function normHex(hex?: string): string {
    if (!hex) return '0x'
    let h = hex.trim().toLowerCase()
    if (!h.startsWith('0x')) h = '0x' + h
    return h
}

async function buildExactBytecodeIndex(hre: HardhatRuntimeEnvironment) {
    const index = new Map<string, string>() // deployedBytecode -> contractName

    //TIDO: avoid extract artifacts each time we neer to check a contract
    // Could be done once and cached
    const fqns = await hre.artifacts.getAllFullyQualifiedNames()
    for (const fqn of fqns) {
        const art = await hre.artifacts.readArtifact(fqn)
        const name = art.contractName ?? fqn.split(':').pop() ?? fqn

        // Hardhat artifacts store runtime code in `deployedBytecode`
        const deployed: string | undefined = (art as Artifact).deployedBytecode
        if (!deployed || deployed === '0x') continue

        const exact = normHex(deployed)
        if (!index.has(exact)) index.set(exact, name)
    }

    return index
}

export async function buildFunctionSelectorIndex(
    hre: HardhatRuntimeEnvironment
): Promise<Map<string, string>> {
    const index = new Map<string, string>() // selector -> signature

    const fqns = await hre.artifacts.getAllFullyQualifiedNames()

    for (const fqn of fqns) {
        const art = await hre.artifacts.readArtifact(fqn)
        const iface = new hre.ethers.Interface(art.abi)

        for (const frag of iface.fragments) {
            if (frag.type !== 'function') continue

            // Garantizamos que el fragmento es funcional
            if (typeof frag.format !== 'function') {
                throw new Error(
                    `❌ Invalid fragment detected in ${fqn}: missing .format()`
                )
            }

            const signature = frag.format('sighash')
            if (typeof signature !== 'string' || !signature.includes('(')) {
                throw new Error(
                    `❌ Invalid function signature for fragment in ${fqn}: ${JSON.stringify(
                        frag
                    )}`
                )
            }

            // Calculamos selector = keccak256(signature)[0:4 bytes]
            const selector = keccak256(signature).slice(0, 10).toLowerCase()

            const existing = index.get(selector)
            if (!existing) {
                index.set(selector, signature)
            } else if (existing !== signature) {
                throw new Error(
                    `⚠️ Selector collision detected:
              Selector: ${selector}
              Existing: ${existing}
              New:      ${signature}
              Contract: ${fqn}`
                )
            }
        }
    }

    return index
}

/**
 * Tags each entry in a GenesisAlloc with its `contractName` by exact bytecode match.
 *
 * @param hre  Hardhat runtime environment
 * @param alloc Genesis allocation to be tagged in-place
 * @returns The same `alloc` object, with `contractName` filled when a match is found
 */
export async function matchContractNames(
    hre: HardhatRuntimeEnvironment,
    alloc: GenesisAlloc, // Map<string, GenesisAllocEntry>
    governanceaddress: string
): Promise<GenesisAlloc> {
    const exactIndex = await buildExactBytecodeIndex(hre)

    for (const [addr, entry] of alloc.entries()) {
        if (!entry?.code) continue

        const code = normHex(entry.code)
        const match = exactIndex.get(code)

        if (match) {
            entry.contractName = match
            alloc.set(addr, entry)
        } else {
            console.warn(
                `⚠️  Warning: No exact bytecode match found for contract at address ${addr}`
            )
            entry.contractName = '<unknown>'
            alloc.set(addr, entry)
        }
    }

    const found = Array.from(alloc.entries()).find(
        ([, e]) => e.contractName === ISBE_GOVERNANCE_CONTRACT_NAME
    )

    if (!found)
        throw new Error(
            `❌ Governance contract (${ISBE_GOVERNANCE_CONTRACT_NAME}) not found in genesis allocation. Perhaps contract name has been changed?`
        )

    const [address, entry] = found

    console.log(
        `✅ Governance contract found at address ${address} changing to address ${governanceaddress}`
    )
    alloc.set(governanceaddress, entry)
    alloc.delete(address) //Entry is maintained as it us by GOVERNANCE_CONTRACT_NAME address

    console.log(
        '******************************************************************************'
    )
    console.log(`Resulting Governance contract`)
    console.log(alloc)
    console.log(
        '******************************************************************************'
    )

    return alloc
}

export class ContractMatcher {
    private matchIndex: contractData = {}

    async init(hre: HardhatRuntimeEnvironment) {
        this.matchIndex.contractCode = await buildExactBytecodeIndex(hre)
        this.matchIndex.selectorIndex = await buildFunctionSelectorIndex(hre)
        console.log(
            `ContractMatcher: Indexes built: ${this.matchIndex.contractCode.size} contracts, ${this.matchIndex.selectorIndex.size} selectors`
        )
    }

    async singleContractMatcher(
        address: string,
        hre: HardhatRuntimeEnvironment
    ): Promise<string> {
        const deployedCode = await hre.ethers.provider.getCode(address)
        if (!this.matchIndex || !this.matchIndex.contractCode) {
            throw new Error('ContractMatcher: Indexes not built')
        }
        const match = this.matchIndex.contractCode.get(deployedCode)
        return match ? match : '<unknown>'
    }

    matchSelector(selector: string): string {
        if (!this.matchIndex || !this.matchIndex.selectorIndex) {
            throw new Error('ContractMatcher: Indexes not built')
        }
        const match = this.matchIndex.selectorIndex.get(selector.toLowerCase())
        return match ? match : '<unknown>'
    }
}
