import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setRecord(
    node: string,
    owner: string,
    resolver: string,
    ttl: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting ENS record:')
    console.log(`   Node: ${node}`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Resolver: ${resolver}`)
    console.log(`   TTL: ${ttl} seconds`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setRecord',
        [node, owner, resolver, BigInt(ttl)],
        200000n
    )

    console.log('\n✅ ENS record set successfully')
}
