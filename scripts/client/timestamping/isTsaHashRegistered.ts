import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function isTsaHashRegistered(
    tsaHash: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('📋 Checking if TSA hash is registered')
    console.log(`   TSA Hash: ${tsaHash}`)
    console.log(`   Diamond: ${diamond}`)

    const exists = await contract.isTsaHashRegistered(tsaHash)

    console.log(
        `\n📊 Result: ${exists ? '✅ REGISTERED' : '❌ NOT REGISTERED'}`
    )
    return exists
}
