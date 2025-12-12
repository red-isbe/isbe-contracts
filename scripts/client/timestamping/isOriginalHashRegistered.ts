import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function isOriginalHashRegistered(
    originalHash: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('📋 Checking if original hash is registered')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   Diamond: ${diamond}`)

    const exists = await contract.isOriginalHashRegistered(originalHash)

    console.log(
        `\n📊 Result: ${exists ? '✅ REGISTERED' : '❌ NOT REGISTERED'}`
    )
    return exists
}
