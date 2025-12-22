/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
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
