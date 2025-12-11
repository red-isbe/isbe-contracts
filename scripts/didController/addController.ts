import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadDidControllerFactory() {
    const { DidControllerFacet__factory } =
        await import('../../typechain-types')
    return DidControllerFacet__factory
}

export async function addController(
    did: string,
    controller: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔐 Adding Controller...\n')
    console.log(`  DID:        ${did}`)
    console.log(`  Controller: ${controller}`)
    console.log(`  Diamond:    ${diamond}`)
    console.log(`  Curve:      ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidControllerFacet__factory = await loadDidControllerFactory()

    await executeDidWrite(
        DidControllerFacet__factory,
        diamond,
        signatureProvider,
        'addController',
        [did, controller],
        500000n
    )

    console.log('\n✅ Controller added')
    return { did, controller }
}
