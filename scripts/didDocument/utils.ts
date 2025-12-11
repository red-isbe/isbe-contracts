import { Provider, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadDidDocumentFactory() {
    const { DidDocumentDetailedFacet__factory } =
        await import('../../typechain-types')
    return DidDocumentDetailedFacet__factory
}

export async function getDidDocumentFacet(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const DidDocumentDetailedFacet__factory = await loadDidDocumentFactory()
    return DidDocumentDetailedFacet__factory.connect(diamond, signerOrProvider)
}

export async function executeDidDocumentWrite(
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const DidDocumentDetailedFacet__factory = await loadDidDocumentFactory()
    return executeDidWrite(
        DidDocumentDetailedFacet__factory,
        diamond,
        signatureProvider,
        method,
        args,
        gasLimit
    )
}

export const EllipticTypeNames: Record<number, string> = {
    0: 'NONE',
    1: 'SECP_256_K1',
    2: 'SECP_256_R1',
}
