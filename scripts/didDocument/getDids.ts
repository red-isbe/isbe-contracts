import { Provider } from 'ethers'
import { getDidDocumentFacet } from './utils'

export async function getDids(
    page: number,
    pageSize: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidDocumentFacet(diamond, provider)

    console.log('\n🔍 Getting DIDs (Paginated)...\n')
    console.log(`  Page:      ${page}`)
    console.log(`  Page Size: ${pageSize}`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const result = await contract.getDids(page, pageSize)
    const [items, total, howMany, prev, next] = result

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                   REGISTERED DIDs                         ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📊 Pagination Info:')
    console.log(`   Total DIDs:     ${total.toString()}`)
    console.log(`   Items Returned: ${howMany.toString()}`)
    console.log(`   Current Page:   ${page}`)
    console.log(`   Previous Page:  ${prev.toString()}`)
    console.log(`   Next Page:      ${next.toString()}`)

    console.log('\n📋 DIDs:')
    if (items.length === 0) {
        console.log('   (none)')
    } else {
        items.forEach((did: string, index: number) => {
            const globalIndex = page * pageSize + index
            console.log(`   [${globalIndex}] ${did}`)
        })
    }

    console.log('\n═══════════════════════════════════════════════════════════')

    return {
        items,
        total: total.toString(),
        howMany: howMany.toString(),
        prev: prev.toString(),
        next: next.toString(),
    }
}
