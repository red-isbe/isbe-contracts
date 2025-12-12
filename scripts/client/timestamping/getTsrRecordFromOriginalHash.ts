import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function getTsrRecordFromOriginalHash(
    originalHash: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('📋 Getting TSR record for original hash')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   Diamond: ${diamond}`)

    try {
        const [tsrData, authority, requester] =
            await contract.getTsrRecordFromOriginalHash(originalHash)

        console.log('\n📊 TSR Record:')
        console.log(`   Original Hash: ${tsrData.originalHash}`)
        console.log(`   TSA Hash: ${tsrData.tsaHash}`)
        console.log(`   External Reference ID: ${tsrData.externalReferenceId}`)
        console.log(`   Authority: ${authority}`)
        console.log(`   Requester: ${requester}`)

        return { tsrData, authority, requester }
    } catch (error) {
        if (error instanceof Error && error.message.includes('HashNotFound')) {
            console.log('\n❌ Hash not found in the registry')
            return null
        }
        throw error
    }
}
