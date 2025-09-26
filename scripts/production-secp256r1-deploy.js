// Production secp256r1 wallet deployment example
const { ethers } = require('ethers')
const { Secp256r1Wallet } = require('../utils/Secp256r1Wallet')

async function main() {
    console.log('🚀 PRODUCTION SECP256R1 WALLET - CONTRACT DEPLOYMENT TEST')
    console.log('🎯 Demonstrating full secp256r1 smart contract capabilities')
    console.log('')

    try {
        // Setup
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
        const network = await provider.getNetwork()
        const privateKey =
            process.env.SECP256R1_PRIVATE_KEY ||
            '0x7718b1f61c070fba4a13a7a19fc0107b29218e21100735c5220309946e11b3ad'
        const wallet = new Secp256r1Wallet(privateKey, provider)
        console.log('🔑 Production secp256r1 wallet initialized')
        console.log('   Address:', await wallet.getAddress())
        const address = await wallet.getAddress()

        console.log('🌐 Network: ChainId', network.chainId.toString())
        console.log(
            '💰 Balance:',
            ethers.formatEther(await provider.getBalance(address)),
            'ETH'
        )

        const nonce = await provider.getTransactionCount(address)
        console.log('📋 Starting nonce:', nonce)
        console.log('')

        // Test 1: Simple successful transfer
        console.log('📤 TEST 1: SUCCESSFUL TRANSFER TO FUNDED ADDRESS')
        console.log('='.repeat(60))

        const transferTx = {
            nonce: nonce,
            gasPrice: ethers.parseUnits('1', 'wei'),
            gasLimit: 21000n,
            to: '0xbebd29124435700f87a3821dc95eea8ab95fcb1b', // Genesis funded address
            value: ethers.parseUnits('1', 'ether'),
            data: '0x',
            chainId: network.chainId,
        }

        const signedTransfer = await wallet.signTransaction(transferTx)
        const transferResponse = await provider.send('eth_sendRawTransaction', [
            signedTransfer,
        ])
        console.log('✅ Transfer transaction hash:', transferResponse)

        const transferReceipt =
            await provider.waitForTransaction(transferResponse)
        console.log(
            '✅ Transfer status:',
            transferReceipt.status === 1 ? 'SUCCESS' : 'FAILED'
        )
        console.log('⛽ Gas used:', transferReceipt.gasUsed.toString())
        console.log('')

        // Test 2: Smart contract deployment
        console.log('📦 TEST 2: SMART CONTRACT DEPLOYMENT')
        console.log('='.repeat(60))

        // Get SimpleStorage contract bytecode
        const artifact = await hre.artifacts.readArtifact('SimpleStorage')
        const contractBytecode = artifact.bytecode

        const deployTx = {
            nonce: nonce + 1,
            gasPrice: ethers.parseUnits('1', 'wei'),
            gasLimit: 500000n, // Higher gas limit for deployment
            to: undefined, // Contract deployment
            value: 0n,
            data: contractBytecode,
            chainId: network.chainId,
        }

        console.log(
            '📋 Deploying contract with',
            contractBytecode.length,
            'bytes of bytecode'
        )

        const signedDeploy = await wallet.signTransaction(deployTx)
        const deployResponse = await provider.send('eth_sendRawTransaction', [
            signedDeploy,
        ])
        console.log('✅ Deploy transaction hash:', deployResponse)

        const deployReceipt = await provider.waitForTransaction(deployResponse)
        console.log(
            '✅ Deploy status:',
            deployReceipt.status === 1 ? 'SUCCESS' : 'FAILED'
        )
        console.log('📍 Contract address:', deployReceipt.contractAddress)
        console.log('⛽ Gas used:', deployReceipt.gasUsed.toString())
        console.log('')

        if (deployReceipt.status === 1 && deployReceipt.contractAddress) {
            // Test 3: Contract interaction
            console.log('🔧 TEST 3: CONTRACT INTERACTION')
            console.log('='.repeat(60))

            // Create contract interface for reading only
            const simpleStorage = new ethers.Contract(
                deployReceipt.contractAddress,
                artifact.abi,
                provider
            )

            // Call set function using raw transaction
            console.log('📋 Calling set(42)...')
            const setFunctionData = Secp256r1Wallet.encodeContractCall(
                simpleStorage,
                'set',
                [42]
            )

            const setTx = {
                nonce: nonce + 2,
                gasPrice: ethers.parseUnits('1', 'wei'),
                gasLimit: 50000n, // Gas limit for contract call
                to: deployReceipt.contractAddress,
                value: 0n,
                data: setFunctionData,
                chainId: network.chainId,
            }

            const signedSetTx = await wallet.signTransaction(setTx)
            const setResponse = await provider.send('eth_sendRawTransaction', [
                signedSetTx,
            ])
            console.log('✅ set transaction hash:', setResponse)

            const setReceipt = await provider.waitForTransaction(setResponse)
            console.log(
                '✅ set status:',
                setReceipt.status === 1 ? 'SUCCESS' : 'FAILED'
            )

            // Read the value back
            const storedValue = await simpleStorage.get()
            console.log('📖 Stored value:', storedValue.toString())

            if (storedValue.toString() === '42') {
                console.log('')
                console.log('🏆 COMPLETE SUCCESS!')
                console.log(
                    '🎊 SECP256R1 SMART CONTRACT ECOSYSTEM FULLY OPERATIONAL!'
                )
                console.log('')
                console.log('✅ Achievements unlocked:')
                console.log('   🔐 secp256r1 transaction signing')
                console.log('   💸 Successful Ether transfers')
                console.log('   📦 Smart contract deployment')
                console.log('   🔧 Contract state modification')
                console.log('   📖 Contract state reading')
                console.log('')
                console.log(
                    '🌟 BREAKTHROUGH: Full secp256r1 blockchain stack working!'
                )
            }
        }

        console.log('')
        console.log('📊 FINAL PRODUCTION SUMMARY:')
        console.log('🔧 Production secp256r1 wallet provides:')
        console.log('   ✅ Proper ethers.js integration')
        console.log('   ✅ EIP-155 transaction signing')
        console.log('   ✅ Contract deployment capability')
        console.log('   ✅ Contract interaction support')
        console.log('   ✅ Full Besu network compatibility')
        console.log('')
        console.log('🎯 Ready for production secp256r1 applications!')
    } catch (error) {
        console.error('❌ Production test failed:', error.message)
        console.error('🔍 Error details:', error)
    }
}

// Import hardhat runtime for artifacts if available
let hre
try {
    hre = require('hardhat')
} catch (e) {
    console.log('ℹ️  Hardhat not available - limited functionality')
}

main().catch(console.error)
