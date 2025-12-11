import { Provider } from 'ethers'
import { getTimeStampingRegistry } from './utils'

export async function getPaginatedStamped(
    pageSize: bigint | number,
    pageIndex: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedPageSize = BigInt(pageSize)
    const normalizedPageIndex = BigInt(pageIndex)
    const contract = getTimeStampingRegistry(diamond, provider)

    console.log('📋 Getting paginated stamped data')
    console.log(`   Page Size: ${normalizedPageSize}`)
    console.log(`   Page Index: ${normalizedPageIndex}`)
    console.log(`   Diamond: ${diamond}`)

    const datas = await contract.getPaginatedStamped(
        normalizedPageSize,
        normalizedPageIndex
    )

    console.log(`\n📊 Found ${datas.length} TSR record(s) on this page:\n`)

    if (datas.length === 0) {
        console.log('   No records found on this page.')
        return datas
    }

    datas.forEach((data, index) => {
        console.log(`   ━━━ Record ${index + 1} ━━━`)
        console.log(`   Original Hash: ${data.originalHash}`)
        console.log(`   TSA Hash: ${data.tsaHash}`)
        console.log(`   External Reference ID: ${data.externalReferenceId}`)
        console.log('')
    })

    return datas
}
