import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Secp256r1Wallet } from '../../utils/Secp256r1Wallet'
import {
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    CLIENT_FILTERING_ROLE,
    DEFAULT_ADMIN_ROLE,
    DID_REGISTRY_ROLE,
    ENS_MANAGER_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
    TIMESTAMPING_REGISTRY_ROLE,
    BESU_NODE_MANAGER_ROLE,
    ANCHORER_ROLE,
    METADATA_MANAGER_ROLE,
} from '../../test/constants'

/**
 * secp256r1-compatible deployment function that uses raw transactions
 * instead of Hardhat's ContractFactory.deploy() which doesn't work with custom signers
 */
export async function deployIsbeFactorySecp256r1(
    hre: HardhatRuntimeEnvironment,
    accountAddress: string,
    initCalldata: string = '0x'
): Promise<string> {
    console.log('🚀 Using secp256r1-compatible deployment approach...')

    const ethers = hre.ethers
    const network = hre.network
    const networkConfig = hre.config.networks[network.name] as {
        secp256r1Accounts: Array<{ privateKey: string }>
    }

    // Get secp256r1 account
    const secp256r1Account = networkConfig.secp256r1Accounts[0]
    const privateKey = secp256r1Account.privateKey.startsWith('0x')
        ? secp256r1Account.privateKey
        : '0x' + secp256r1Account.privateKey

    // Create secp256r1 wallet
    const wallet = new Secp256r1Wallet(privateKey, ethers.provider)
    const deployerAddress = await wallet.getAddress()

    console.log(`🔐 Using secp256r1 wallet: ${deployerAddress}`)

    // Deploy all facets using raw transactions
    console.log('📦 Deploying facets...')

    const facetDeployments = [
        'BusinessLogicFactoryFacet',
        'ProxyFactoryFacet',
        'GlobalIsbePauseFacet',
        'AccessControlGovernanceFacet',
        'ISBEPauseFacet',
        'DiamondCutAccessControlFacet',
        'DiamondLoupeFacet',
        'ConfigurationManagementFacet',
        'DidDocumentDetailedFacet',
        'DidControllerFacet',
        'DidVerificationMethodFacet',
        'DidVerificationRelationshipFacet',
        'EnsRegistryFacet',
        'TimeStampingRegistryFacet',
        'ClientFilteringFacet',
        'BesuNodeManagerFacet',
        'AnchoringCoreFacet',
    ]

    const facetAddresses: string[] = []

    for (const facetName of facetDeployments) {
        console.log(`   Deploying ${facetName}...`)

        // Get fresh nonce for each deployment to avoid race conditions
        const nonce = await ethers.provider.getTransactionCount(deployerAddress)
        console.log(`   📋 Using nonce: ${nonce}`)

        // Get contract artifact
        const artifact = await hre.artifacts.readArtifact(facetName)

        // Create deployment transaction
        const deployTx = {
            nonce: nonce,
            gasPrice: 0n,
            gasLimit: 5000000n,
            to: undefined, // Contract deployment
            value: 0n,
            data: artifact.bytecode,
            chainId: (await ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(deployTx)
        const response = await ethers.provider.send('eth_sendRawTransaction', [
            signedTx,
        ])

        // Wait for deployment using manual polling
        let receipt = null
        let attempts = 0
        const maxAttempts = 60 // 60 attempts with 1 second delay = 1 minute timeout

        while (!receipt && attempts < maxAttempts) {
            try {
                receipt = await ethers.provider.getTransactionReceipt(response)
                if (receipt) break
            } catch {
                // Transaction not yet mined
            }
            await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
            attempts++
        }

        if (!receipt) {
            throw new Error(`Timeout waiting for ${facetName} deployment`)
        }

        if (receipt.status !== 1) {
            throw new Error(`Failed to deploy ${facetName}`)
        }

        facetAddresses.push(receipt.contractAddress)
        console.log(
            `   ✅ ${facetName} deployed at: ${receipt.contractAddress}`
        )
    }

    // Now deploy the diamond proxy (EIP2535AccessControl)
    console.log('💎 Deploying diamond proxy...')

    const proxyArtifact = await hre.artifacts.readArtifact(
        'EIP2535AccessControl'
    )

    // Encode constructor arguments according to the EIP2535AccessControl constructor
    // constructor(address[] memory _facets, DiamondArgs memory _args)
    const constructorTypes = [
        'address[]',
        'tuple(tuple(bytes32 role, address[] members)[] rbacs, address init, bytes initCalldata)',
    ]

    const diamondArgs = {
        rbacs: [
            {
                role: DEFAULT_ADMIN_ROLE,
                members: [accountAddress],
            },
            {
                role: ISBE_ROLE,
                members: [accountAddress],
            },
            {
                role: PROXY_DEPLOYER_ROLE,
                members: [accountAddress],
            },
            {
                role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
                members: [accountAddress],
            },
            {
                role: BUSINESS_LOGIC_DEPLOYER_ROLE,
                members: [accountAddress],
            },
            {
                role: ISBE_PAUSER_ROLE,
                members: [accountAddress],
            },
            {
                role: GOVERNANCE_MANAGER_ROLE,
                members: [accountAddress],
            },
            {
                role: DID_REGISTRY_ROLE,
                members: [accountAddress],
            },
            {
                role: ENS_MANAGER_ROLE,
                members: [accountAddress],
            },
            {
                role: CLIENT_FILTERING_ROLE,
                members: [accountAddress],
            },
            {
                role: TIMESTAMPING_REGISTRY_ROLE,
                members: [accountAddress],
            },
            {
                role: BESU_NODE_MANAGER_ROLE,
                members: [accountAddress],
            },
            {
                role: ANCHORER_ROLE,
                members: [accountAddress],
            },
            {
                role: METADATA_MANAGER_ROLE,
                members: [accountAddress],
            },
        ],
        init: ethers.ZeroAddress,
        initCalldata: initCalldata,
    }

    const constructorArgs = [facetAddresses, diamondArgs]

    // Encode constructor arguments
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    const encodedArgs = abiCoder.encode(constructorTypes, constructorArgs)

    // Combine bytecode with constructor arguments
    const deploymentBytecode = proxyArtifact.bytecode + encodedArgs.slice(2)

    // Get fresh nonce for proxy deployment
    const proxyNonce =
        await ethers.provider.getTransactionCount(deployerAddress)
    console.log(`   📋 Using nonce for proxy: ${proxyNonce}`)

    const proxyDeployTx = {
        nonce: proxyNonce,
        gasPrice: 0n,
        gasLimit: 5000000n,
        to: undefined,
        value: 0n,
        data: deploymentBytecode,
        chainId: (await ethers.provider.getNetwork()).chainId,
    }

    const signedProxyTx = await wallet.signTransaction(proxyDeployTx)
    const proxyResponse = await ethers.provider.send('eth_sendRawTransaction', [
        signedProxyTx,
    ])

    // Wait for proxy deployment using manual polling
    let proxyReceipt = null
    let attempts = 0
    const maxAttempts = 60

    while (!proxyReceipt && attempts < maxAttempts) {
        try {
            proxyReceipt =
                await ethers.provider.getTransactionReceipt(proxyResponse)
            if (proxyReceipt) break
        } catch {
            // Transaction not yet mined
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
        attempts++
    }

    if (!proxyReceipt) {
        throw new Error('Timeout waiting for diamond proxy deployment')
    }

    if (proxyReceipt.status !== 1) {
        throw new Error('Failed to deploy diamond proxy')
    }

    console.log(`✅ Diamond proxy deployed at: ${proxyReceipt.contractAddress}`)

    return proxyReceipt.contractAddress
}
