import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setSubnodeRecord(
    node: string,
    label: string,
    owner: string,
    resolver: string,
    ttl: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting subnode record:')
    console.log(`   Parent Node: ${node}`)
    console.log(`   Label: ${label}`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Resolver: ${resolver}`)
    console.log(`   TTL: ${ttl} seconds`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setSubnodeRecord',
        [node, label, owner, resolver, BigInt(ttl)],
        200000n
    )

    console.log('\n✅ Subnode record set successfully')
}
