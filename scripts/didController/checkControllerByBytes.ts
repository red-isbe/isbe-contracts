import { Provider, toUtf8Bytes } from 'ethers'
import { getDidController } from '../did/utils'

export async function checkControllerByBytes(
    did: string,
    controller: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidController(diamond, provider)

    console.log('\n🔍 Checking Controller (bytes format)...\n')
    console.log(`  DID:        ${did}`)
    console.log(`  Controller: ${controller}`)
    console.log(`  Diamond:    ${diamond}`)
    console.log('')

    const didBytes = toUtf8Bytes(did)
    const isController = await contract['checkController(bytes,address)'](
        didBytes,
        controller
    )

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                CONTROLLER CHECK RESULT                     ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log(`  Is Controller: ${isController ? '✅ YES' : '❌ NO'}`)
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, controller, isController }
}
