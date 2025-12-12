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
----------------------------------------------------------------------------------- */
import { ethers } from 'hardhat'
import { ContractFactory } from 'ethers'
import {
    KnownDidTestWrapperFacet,
    IIsbeFactory,
    ISBEPauseFacet__factory,
    ISBEPauseFacet,
    AccessControlFacet,
    AccessControlDidFacet,
} from '../../typechain-types'
import {
    KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY,
    CONFIGURATION_ID_KNOWN_DID_TEST,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
} from '../../utils/constants'
import { getEvent } from '../../scripts/utils/getEvent'

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
    )[0] as {
        args: {
            businessAddress: string
        }
    }
    return contractFactory.attach(businessAddress.args.businessAddress)
}

export async function deployKnownDidTestWrapperUseCaseFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
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
    const accessControlDidFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_DID_RESOLVER_KEY,
        AccessControlDidFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    const KnownDidTestWrapperFacetFactory = await ethers.getContractFactory(
        'KnownDidTestWrapperFacet'
    )

    // Deploy business logic contract
    const knownDidTestWrapperFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY,
        KnownDidTestWrapperFacetFactory
    )

    // Set configuration
    await isbeFactory.setConfiguration(CONFIGURATION_ID_KNOWN_DID_TEST, [
        {
            businessId: KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY,
            version: 1,
        },
    ])

    // Deploy use case
    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_KNOWN_DID_TEST,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    // Attach contract to proxy
    const knownDidTestWrapper = KnownDidTestWrapperFacetFactory.attach(
        proxy
    ) as KnownDidTestWrapperFacet
    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet
    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet
    const accessControlDid = AccessControlDidFacetFactory.attach(
        proxy
    ) as AccessControlDidFacet

    return {
        pause,
        accessControl,
        accessControlDid,
        knownDidTestWrapper,
        isbeCutFacet,
        isbeLoupeFacet,
        pauseFacet,
        accessControlFacet,
        accessControlDidFacet,
        knownDidTestWrapperFacet,
        proxy,
    }
}
