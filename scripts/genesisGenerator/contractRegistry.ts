import fs from 'fs'
import path from 'path'
import { type GenesisAlloc } from './slotExtractor'

export class ContractRegistry {
    private data: Map<string, string[]>

    constructor() {
        this.data = new Map()
    }

    public dumpRegistry(alloc: GenesisAlloc, outputFile: string): void {
        const outputPath = outputFile

        const registry: Record<string, string[]> = {}

        for (const [address, entry] of alloc.entries()) {
            if (!entry.contractName) {
                throw new Error(
                    `❌ Missing contractName for address ${address}. Ensure all contracts are named before dumping registry.`
                )
            }

            const name = entry.contractName
            if (!registry[name]) {
                registry[name] = []
            }
            registry[name].push(address)
        }

        // (opcional) ordenar las claves para un JSON más legible
        const sorted = Object.keys(registry)
            .sort()
            .reduce<Record<string, string[]>>((acc, key) => {
                acc[key] = registry[key]
                return acc
            }, {})

        fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), 'utf8')

        console.log(`✅ Contract registry saved to ${outputPath}`)
    }

    public retrieveContractRegistry(inputFile: string): void {
        const inputPath = path.isAbsolute(inputFile)
            ? inputFile
            : path.join(inputFile)

        if (!fs.existsSync(inputPath)) {
            throw new Error(`❌ File not found: ${inputPath}`)
        }

        const rawData = fs.readFileSync(inputPath, 'utf8')
        let parsed: Record<string, string[]>

        try {
            parsed = JSON.parse(rawData)
        } catch (err) {
            throw new Error(
                `❌ Invalid JSON in ${inputPath}: ${(err as Error).message}`
            )
        }

        const dataMap = new Map<string, string[]>()
        for (const [contractName, addresses] of Object.entries(parsed)) {
            if (!Array.isArray(addresses)) {
                throw new Error(
                    `❌ Invalid entry for ${contractName}: expected array of addresses`
                )
            }
            dataMap.set(contractName, addresses)
        }

        this.data = dataMap
        console.log(`📗 Loaded contract registry from ${inputPath}`)
    }

    public toString(): string {
        return JSON.stringify(Object.fromEntries(this.data), null, 2)
    }

    public getAddresses(contractName: string): string[] {
        const result = this.data.get(contractName)
        if (!result) {
            throw new Error(
                `❌ Contract name ${contractName} not found in registry`
            )
        }
        return result
    }

    public getAddress(contractName: string): string {
        const result = this.getAddresses(contractName)
        if (!result || result.length !== 1) {
            throw new Error(
                `❌ Expected exactly one address for contract ${contractName}, found ${result ? result.length : 0}`
            )
        }
        return result[0]
    }
}
