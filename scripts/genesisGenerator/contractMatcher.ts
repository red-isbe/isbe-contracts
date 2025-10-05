import type { HardhatRuntimeEnvironment, Artifact } from 'hardhat/types'
import { GenesisAlloc } from './slotExtractor'

/**
 * NOTE / WARNING
 * --------------
 * This function performs an **exact byte-for-byte match** between each `code` found in your
 * `GenesisAlloc` and the `deployedBytecode` from local Hardhat artifacts.
 *
 * This approach is correct and fast **only if**:
 *   1) You always spin up a fresh Hardhat network with the same accounts,
 *   2) You deploy in the same order (same nonces),
 *   3) You compile with the same solc version/settings,
 *   4) Linked libraries are deployed at the exact same addresses as in your artifacts.
 *
 * If any of the above changes (e.g., different deployment order, different solc build/metadata,
 * or different library addresses), the exact comparison will fail. In that case, you would need
 * a more tolerant strategy (e.g., stripping metadata or masking library addresses via linkReferences).
 */

// Given types:
// export type GenesisAllocEntry = {
//   balance?: string
//   nonce?: string
//   code: string
//   storage: Record<string, string>
//   contractName!: string
// }
// export type GenesisAlloc = Record<string, GenesisAllocEntry>

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

/**
 * Tags each entry in a GenesisAlloc with its `contractName` by exact bytecode match.
 *
 * @param hre  Hardhat runtime environment
 * @param alloc Genesis allocation to be tagged in-place
 * @returns The same `alloc` object, with `contractName` filled when a match is found
 */
export async function matchContractNames(
  hre: HardhatRuntimeEnvironment,
  alloc: GenesisAlloc // Map<string, GenesisAllocEntry>
): Promise<GenesisAlloc> {
  const exactIndex = await buildExactBytecodeIndex(hre);

  for (const [addr, entry] of alloc.entries()) {
    if (!entry?.code) continue;

    const code = normHex(entry.code);
    const match = exactIndex.get(code);

    if (match) {
      entry.contractName = match;
      alloc.set(addr, entry);
    } else {
      console.warn(
        `⚠️  Warning: No exact bytecode match found for contract at address ${addr}`
      );
      entry.contractName = "<unknown>";
      alloc.set(addr, entry);
    }
  }

  return alloc;
}
