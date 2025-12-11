import { Provider, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadAccessControlDidFactory() {
    const { AccessControlDidGovernanceFacet__factory } =
        await import('../../typechain-types')
    return AccessControlDidGovernanceFacet__factory
}

export async function getAccessControlDid(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const AccessControlDidGovernanceFacet__factory =
        await loadAccessControlDidFactory()
    return AccessControlDidGovernanceFacet__factory.connect(
        diamond,
        signerOrProvider
    )
}

export async function executeAccessControlDidWrite(
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const AccessControlDidGovernanceFacet__factory =
        await loadAccessControlDidFactory()
    return executeDidWrite(
        AccessControlDidGovernanceFacet__factory,
        diamond,
        signatureProvider,
        method,
        args,
        gasLimit
    )
}
