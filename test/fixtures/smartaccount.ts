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
import { ethers } from 'hardhat'
import { Signer, ContractFactory } from 'ethers'
import {
    AccessControlFacet,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    IIsbeFactory,
    SmartAccountFacet__factory,
    OwnableFacet,
} from '../../typechain-types'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY,
    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    OWNABLE_RESOLVER_KEY,
} from '../../utils/constants'
import { getEvent } from '../../scripts/utils/getEvent'
import { SmartAccount } from 'typechain-types/contracts/accountabstraction/smartaccount'

async function deployBusinessLogicFromFactory(
    isbeFactory: IIsbeFactory,
    resolverKey: string,
    contractFactory: ContractFactory
) {
    const deployTx = await (
        await isbeFactory.deploy(resolverKey, contractFactory.bytecode)
    ).wait()
    if (!deployTx) {
        throw new Error('Deployment transaction failed')
    }

    const businessAddress = deployTx.logs.filter(
        (log) =>
            log.topics[0] ===
            '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
    )[0] as unknown as {
        args: {
            businessAddress: string
        }
    }
    return contractFactory.attach(businessAddress.args.businessAddress)
}

export async function deploySmartAccountUseCaseFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    owner: Signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean = false,
    init_BusinessIds: string[] = [],
    init_CallData: string[] = []
) {
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
    const OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
    const SmartAccountFacetFactory =
        await ethers.getContractFactory('SmartAccountFacet')

    const isbeCutFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    const isbeLoupeFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )
    const accessControlFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_DID_RESOLVER_KEY,
        AccessControlDidFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    const ownableFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        OWNABLE_RESOLVER_KEY,
        OwnableFacetFactory
    )
    const smartAccountFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY,
        SmartAccountFacetFactory
    )

    await isbeFactory.setConfiguration(
        CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
        [
            {
                businessId: OWNABLE_RESOLVER_KEY,
                version: 1,
            },
            {
                businessId: ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY,
                version: 1,
            },
        ]
    )

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const smartAccount = SmartAccountFacet__factory.connect(
        proxy,
        owner
    ) as SmartAccount
    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet
    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    const ownable = OwnableFacetFactory.attach(proxy) as OwnableFacet
    await ownable.initializeOwnable(owner)

    return {
        smartAccount,
        pause,
        accessControl,
        smartAccountFacet,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        ownable,
        ownableFacet,
    }
}
