import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function getStampedSize(diamond: string, provider: Provider) {
    const contract = getTimeStampingRegistry(diamond, provider)

    console.log('📋 Getting stamped size')
    console.log(`   Diamond: ${diamond}`)

    const size = await contract.getStampedSize()

    console.log(`\n📊 Total Stamped Entries: ${size}`)
    return size
}
