import { Provider } from 'ethers'
import { getDidController } from '../did/utils'

export async function checkControllerByDid(
    did: string,
    controller: string,
    diamond: string,
    provider: Provider
) {
    const contract = getDidController(diamond, provider)

    console.log('\n🔍 Checking Controller (bytes32 format)...\n')
    console.log(`  DID:        ${did}`)
    console.log(`  Controller: ${controller}`)
    console.log(`  Diamond:    ${diamond}`)
    console.log('')

    const isController = await contract['checkController(bytes32,address)'](
        did,
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
