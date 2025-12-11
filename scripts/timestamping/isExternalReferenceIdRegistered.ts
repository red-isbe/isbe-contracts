import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function isExternalReferenceIdRegistered(
    externalReferenceId: string,
    diamond: string,
    provider: Provider
) {
    const contract = getTimeStampingRegistry(diamond, provider)

    console.log('📋 Checking if external reference ID is registered')
    console.log(`   External Reference ID: ${externalReferenceId}`)
    console.log(`   Diamond: ${diamond}`)

    const exists =
        await contract.isExternalReferenceIdRegistered(externalReferenceId)

    console.log(
        `\n📊 Result: ${exists ? '✅ REGISTERED' : '❌ NOT REGISTERED'}`
    )
    return exists
}
