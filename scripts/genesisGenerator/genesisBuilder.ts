import { promises as fs } from 'fs'
import * as path from 'path'
import type { GenesisAlloc } from '.' // wherever you have your types

// @ts-expect-error Using `any` intentionally for flexible JSON schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JSONGenesis = any

// type GenesisJson = {
//   config?: any;
//   alloc?: GenesisAlloc;
//   [k: string]: any;
// };

/**
 * Merge two allocs: everything in `additions` will be added/overwritten in `base`.
 * - balance / nonce / code / contractName are overwritten if provided
 * - storage is merged by key (new values overwrite existing ones)
 */
function mergeAlloc(
    allocBase: JSONGenesis = {},
    allocAdditions: GenesisAlloc
): JSONGenesis {
    console.log('Merging alloc additions into base genesis alloc...')
    console.log(`  Base alloc entries: ${Object.keys(allocBase).length}`)
    console.log(`  Addition alloc entries: ${allocAdditions.size}`)

    // Merge existing entries

    for (const [addr, entry] of allocAdditions.entries()) {
        if (allocBase[addr] === undefined) {
            allocBase[addr] = entry
        } else {
            throw new Error(
                `Address ${addr} already exists in base genesis alloc.`
            )
        }
    }

    return allocBase
}

/**
 * Reads a genesis template file, merges in the given slotStructure (alloc),
 * and writes the final genesis JSON to the specified outputFile.
 */
export async function buildGenesisWithAlloc(
    genesisTemplateFile: string,
    slotStructure: GenesisAlloc,
    outputFile: string
): Promise<void> {
    const raw = await fs.readFile(genesisTemplateFile, 'utf8')
    if (!raw) {
        throw new Error(
            `Genesis template file is empty or not found: ${genesisTemplateFile}`
        )
    }
    const data: JSONGenesis = JSON.parse(raw)

    const mergedAlloc = mergeAlloc(
        data.genesis ? data.genesis.alloc : data.alloc,
        slotStructure
    )

    if (data.genesis) data.genesis.alloc = mergedAlloc
    else if (data.alloc) data.alloc = mergedAlloc
    else
        throw new Error(
            "❌ Wrong genesis template format: 'alloc' section is missing."
        )

    await fs.mkdir(path.dirname(outputFile), { recursive: true })
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf8')

    console.log(`✅ Genesis generated at: ${outputFile}`)
}

export async function extractISBEAdminAddress(
    genesisTemplateFile: string
): Promise<[string, string]> {
    const raw = await fs.readFile(genesisTemplateFile, 'utf8')
    if (!raw) {
        throw new Error(
            `Genesis template file is empty or not found: ${genesisTemplateFile}`
        )
    }
    const data: JSONGenesis = JSON.parse(raw)

    //console.log('Genesis data:', data.alloc) // Debugging line
    const genesisAlloc = data.genesis ? data.genesis.alloc : data.alloc
    if (!genesisAlloc || Object.keys(genesisAlloc).length === 0) {
        throw new Error(
            "❌ Wrong genesis template format: 'alloc' section is missing or empty."
        )
    }
    if (data.version === 'genesis-local-template') {
        const isbeadmins: Array<string> = []
        Object.keys(genesisAlloc).forEach((address) => {
            const entry = genesisAlloc[address]
            if (
                entry.description &&
                entry.description.toUpperCase() === 'ISBEADMIN'
            ) {
                isbeadmins.push(address)
            }
        })
        if (isbeadmins.length != 2) {
            throw new Error(
                `❌ Wrong genesis template format: Expected 2 ISBEADMIN entries, found ${isbeadmins.length}.`
            )
        }
        return [isbeadmins[0], isbeadmins[1]]
    } else {
        const isbeAdminAddress: string = Object.keys(genesisAlloc)[0] // Firs entry address us considered ISBE Admin

        return [isbeAdminAddress, '']
    }
}

export async function extractCurve(
    genesisTemplateFile: string
): Promise<string> {
    const raw = await fs.readFile(genesisTemplateFile, 'utf8')
    if (!raw) {
        throw new Error(
            `Genesis template file is empty or not found: ${genesisTemplateFile}`
        )
    }
    const data: JSONGenesis = JSON.parse(raw)

    const ecCurve =
        data.genesis?.config?.ecCurve ?? data.config?.ecCurve ?? 'secp256k1'
    const ellipticCurve =
        data.genesis?.config?.ellipticCurve ??
        data.config?.ellipticCurve ??
        'secp256k1'

    if (ecCurve !== ellipticCurve) {
        throw new Error(
            "❌ Wrong genesis template format: 'ecCurve' and 'ellipticCurve' sections are missing or not matching."
        )
    }

    return ecCurve
}
