import * as fs from 'fs'
import { computeAddress } from 'ethers'

export class pkmanagement {
    private privateKeys: string[] = []

    constructor(
        private templateFile: string,
        privateKeyFile: string
    ) {
        console.log(
            `pkmanagement initialized with private key file: ${privateKeyFile}`
        )

        // Check if file exists
        if (!fs.existsSync(privateKeyFile)) {
            console.error(`Error: File ${privateKeyFile} does not exist`)
            return
        }

        try {
            // Read file content
            const fileContent = fs.readFileSync(privateKeyFile, 'utf-8')
            const lines = fileContent.split('\n')

            // Extract private keys from lines matching "Private Key: 0x..."
            let count = 0
            for (const line of lines) {
                const match = line.match(/Private Key:\s*(0x[a-fA-F0-9]+)/)
                if (match && match[1]) {
                    const fullKey = match[1]
                    this.privateKeys.push(fullKey)

                    // Print truncated format: first 5 chars + "..." + last 3 chars
                    const truncated = `[${count}] ${fullKey.substring(0, 5)}...${fullKey.substring(fullKey.length - 3)}`
                    console.log(truncated)
                    count++
                }
            }

            console.log(
                `\nTotal private keys extracted: ${this.privateKeys.length}`
            )
        } catch (error) {
            console.error(`Error reading file: ${error}`)
            throw error
        }
    }

    getPrivateKeys(): string[] {
        return this.privateKeys
    }

    generateK1(outputFile: string, prefundAmount: bigint) {
        console.log(
            `Generating K1 genesis file: ${outputFile} with prefund amount: ${prefundAmount}`
        )

        try {
            // Validate private keys array
            if (this.privateKeys.length === 0) {
                throw new Error(
                    'No private keys available. Please ensure the private key file was loaded correctly.'
                )
            }

            const r1Entries: Array<{ address: string; prefundAmount: bigint }> =
                []

            // Generate addresses from private keys
            for (let i = 0; i < this.privateKeys.length; i++) {
                const pk = this.privateKeys[i]
                try {
                    const address: string = computeAddress(pk)
                    r1Entries.push({ address, prefundAmount })
                } catch (error) {
                    throw new Error(
                        `Failed to compute address for private key [${i}]: ${error.message}`
                    )
                }
            }

            // Check if template file exists
            if (!fs.existsSync(this.templateFile)) {
                throw new Error(
                    `Template file not found: ${this.templateFile}\nPlease ensure the file exists and the path is correct.`
                )
            }

            // Read template file
            let templateContent: string
            try {
                templateContent = fs.readFileSync(this.templateFile, 'utf-8')
            } catch (error) {
                throw new Error(
                    `Failed to read template file ${this.templateFile}: ${error.message}`
                )
            }

            // Parse JSON template
            let genesisTemplate
            try {
                genesisTemplate = JSON.parse(templateContent)
            } catch (error) {
                throw new Error(
                    `Template file ${this.templateFile} is not valid JSON: ${error.message}\nPlease ensure the file contains valid JSON data.`
                )
            }

            // Validate genesis template structure
            if (
                typeof genesisTemplate !== 'object' ||
                genesisTemplate === null
            ) {
                throw new Error(
                    `Template file ${this.templateFile} does not contain a valid genesis object.`
                )
            }

            // Replace the entire alloc with new addresses
            genesisTemplate.alloc = {}
            for (const entry of r1Entries) {
                genesisTemplate.alloc[entry.address] = {
                    balance: `0x${entry.prefundAmount.toString(16)}`,
                }
            }

            // Save the modified genesis to output file
            try {
                fs.writeFileSync(
                    outputFile,
                    JSON.stringify(genesisTemplate, null, 2),
                    'utf-8'
                )
                console.log(
                    `✅ K1 genesis file created successfully: ${outputFile}`
                )
                console.log(`   - Total addresses: ${r1Entries.length}`)
                console.log(
                    `   - Prefund amount per address: ${prefundAmount.toString()} wei`
                )
            } catch (error) {
                throw new Error(
                    `Failed to write output file ${outputFile}: ${error.message}\nPlease check write permissions and disk space.`
                )
            }
        } catch (error) {
            console.error(
                `\n❌ Error generating K1 genesis file: ${error.message}\n`
            )
            throw error
        }
    }

    async generateR1(outputFile: string, prefundAmount: bigint) {
        console.log(
            `Generating R1 genesis file: ${outputFile} with prefund amount: ${prefundAmount}`
        )

        try {
            // Validate private keys array
            if (this.privateKeys.length === 0) {
                throw new Error(
                    'No private keys available. Please ensure the private key file was loaded correctly.'
                )
            }

            const r1Entries: Array<{ address: string; prefundAmount: bigint }> =
                []

            // Import secp256r1 utilities
            let deriveEthereumAddress
            try {
                const utils = await import('../../utils/secp256r1Utils')
                deriveEthereumAddress = utils.deriveEthereumAddress
            } catch (error) {
                throw new Error(
                    `Failed to import secp256r1Utils: ${error.message}\nPlease ensure the secp256r1Utils module exists at '../../utils/secp256r1Utils'.`
                )
            }

            // Import elliptic library
            let EC
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                EC = require('elliptic').ec
            } catch (error) {
                throw new Error(
                    `Failed to import elliptic library: ${error.message}\nPlease ensure 'elliptic' package is installed (npm install elliptic).`
                )
            }

            // Generate addresses from private keys
            for (let i = 0; i < this.privateKeys.length; i++) {
                const privateKey = this.privateKeys[i]
                try {
                    // Clean the private key (remove 0x prefix if present)
                    const cleanPrivateKey = privateKey.startsWith('0x')
                        ? privateKey.slice(2)
                        : privateKey

                    // Validate hex format
                    if (!/^[0-9a-fA-F]+$/.test(cleanPrivateKey)) {
                        throw new Error(
                            'Private key contains invalid hexadecimal characters'
                        )
                    }

                    // Create secp256r1 key pair
                    const ec = new EC('p256')
                    const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
                    const publicKey = keyPair.getPublic()
                    const uncompressedPublicKey = publicKey.encode('hex', false)

                    // Derive Ethereum-compatible address using secp256r1 public key
                    const address = deriveEthereumAddress(uncompressedPublicKey)

                    r1Entries.push({
                        address: address,
                        prefundAmount: prefundAmount,
                    })
                } catch (error) {
                    const keyPreview = `${privateKey.substring(0, 8)}...`
                    throw new Error(
                        `Failed to generate secp256r1 address for private key [${i}] (${keyPreview}): ${error.message}`
                    )
                }
            }

            // Check if template file exists
            if (!fs.existsSync(this.templateFile)) {
                throw new Error(
                    `Template file not found: ${this.templateFile}\nPlease ensure the file exists and the path is correct.`
                )
            }

            // Read template file
            let templateContent: string
            try {
                templateContent = fs.readFileSync(this.templateFile, 'utf-8')
            } catch (error) {
                throw new Error(
                    `Failed to read template file ${this.templateFile}: ${error.message}`
                )
            }

            // Parse JSON template
            let genesisTemplate
            try {
                genesisTemplate = JSON.parse(templateContent)
            } catch (error) {
                throw new Error(
                    `Template file ${this.templateFile} is not valid JSON: ${error.message}\nPlease ensure the file contains valid JSON data.`
                )
            }

            // Validate genesis template structure
            if (
                typeof genesisTemplate !== 'object' ||
                genesisTemplate === null
            ) {
                throw new Error(
                    `Template file ${this.templateFile} does not contain a valid genesis object.`
                )
            }

            // Replace the entire alloc with new addresses
            genesisTemplate.alloc = {}
            for (const entry of r1Entries) {
                genesisTemplate.alloc[entry.address] = {
                    balance: `0x${entry.prefundAmount.toString(16)}`,
                }
            }

            // Save the modified genesis to output file
            try {
                fs.writeFileSync(
                    outputFile,
                    JSON.stringify(genesisTemplate, null, 2),
                    'utf-8'
                )
                console.log(
                    `✅ R1 genesis file created successfully: ${outputFile}`
                )
                console.log(`   - Total addresses: ${r1Entries.length}`)
                console.log(
                    `   - Prefund amount per address: ${prefundAmount.toString()} wei`
                )
            } catch (error) {
                throw new Error(
                    `Failed to write output file ${outputFile}: ${error.message}\nPlease check write permissions and disk space.`
                )
            }
        } catch (error) {
            console.error(
                `\n❌ Error generating R1 genesis file: ${error.message}\n`
            )
            throw error
        }
    }

    async generate(outputFile: string, prefundAmount: bigint) {
        console.log(`Generating genesis file: ${outputFile}`)

        try {
            // Validate private keys array
            if (this.privateKeys.length === 0) {
                throw new Error(
                    'No private keys available. Please ensure the private key file was loaded correctly.'
                )
            }

            const r1Entries: Array<{
                address: string
                prefundAmount: bigint
                description: string
            }> = []

            // Import secp256r1 utilities
            let deriveEthereumAddress
            try {
                const utils = await import('../../utils/secp256r1Utils')
                deriveEthereumAddress = utils.deriveEthereumAddress
            } catch (error) {
                throw new Error(
                    `Failed to import secp256r1Utils: ${error.message}\nPlease ensure the secp256r1Utils module exists at '../../utils/secp256r1Utils'.`
                )
            }

            // Import elliptic library
            let EC
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                EC = require('elliptic').ec
            } catch (error) {
                throw new Error(
                    `Failed to import elliptic library: ${error.message}\nPlease ensure 'elliptic' package is installed (npm install elliptic).`
                )
            }

            // Generate addresses from private keys
            for (let i = 0; i < this.privateKeys.length; i++) {
                const privateKey = this.privateKeys[i]
                try {
                    const addressK1: string = computeAddress(privateKey)
                    r1Entries.push({
                        address: addressK1,
                        prefundAmount,
                        description: i == 0 ? 'ISBEADMIN' : '',
                    })

                    // Clean the private key (remove 0x prefix if present)
                    const cleanPrivateKey = privateKey.startsWith('0x')
                        ? privateKey.slice(2)
                        : privateKey

                    // Validate hex format
                    if (!/^[0-9a-fA-F]+$/.test(cleanPrivateKey)) {
                        throw new Error(
                            'Private key contains invalid hexadecimal characters'
                        )
                    }

                    // Create secp256r1 key pair
                    const ec = new EC('p256')
                    const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
                    const publicKey = keyPair.getPublic()
                    const uncompressedPublicKey = publicKey.encode('hex', false)

                    // Derive Ethereum-compatible address using secp256r1 public key
                    const address = deriveEthereumAddress(uncompressedPublicKey)

                    r1Entries.push({
                        address: address,
                        prefundAmount: prefundAmount,
                        description: i == 0 ? 'ISBEADMIN' : '',
                    })
                } catch (error) {
                    const keyPreview = `${privateKey.substring(0, 8)}...`
                    throw new Error(
                        `Failed to generate secp256r1 address for private key [${i}] (${keyPreview}): ${error.message}`
                    )
                }
            }

            // Check if template file exists
            if (!fs.existsSync(this.templateFile)) {
                throw new Error(
                    `Template file not found: ${this.templateFile}\nPlease ensure the file exists and the path is correct.`
                )
            }

            // Read template file
            let templateContent: string
            try {
                templateContent = fs.readFileSync(this.templateFile, 'utf-8')
            } catch (error) {
                throw new Error(
                    `Failed to read template file ${this.templateFile}: ${error.message}`
                )
            }

            // Parse JSON template
            let genesisTemplate
            try {
                genesisTemplate = JSON.parse(templateContent)
            } catch (error) {
                throw new Error(
                    `Template file ${this.templateFile} is not valid JSON: ${error.message}\nPlease ensure the file contains valid JSON data.`
                )
            }

            // Validate genesis template structure
            if (
                typeof genesisTemplate !== 'object' ||
                genesisTemplate === null
            ) {
                throw new Error(
                    `Template file ${this.templateFile} does not contain a valid genesis object.`
                )
            }

            // Replace the entire alloc with new addresses
            genesisTemplate.alloc = {}
            for (const entry of r1Entries) {
                genesisTemplate.alloc[entry.address] = {
                    balance: `0x${entry.prefundAmount.toString(16)}`,
                    description: entry.description,
                }
            }

            // Save the modified genesis to output file
            try {
                fs.writeFileSync(
                    outputFile,
                    JSON.stringify(genesisTemplate, null, 2),
                    'utf-8'
                )
                console.log(
                    `✅ R1 genesis file created successfully: ${outputFile}`
                )
                console.log(`   - Total addresses: ${r1Entries.length}`)
                console.log(
                    `   - Prefund amount per address: ${prefundAmount.toString()} wei`
                )
            } catch (error) {
                throw new Error(
                    `Failed to write output file ${outputFile}: ${error.message}\nPlease check write permissions and disk space.`
                )
            }
        } catch (error) {
            console.error(
                `\n❌ Error generating R1 genesis file: ${error.message}\n`
            )
            throw error
        }
    }
}
