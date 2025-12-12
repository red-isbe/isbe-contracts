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
import { Signer, ContractFactory } from 'ethers'
import {
    ERC721TestWrapperFacet,
    ERC721Facet,
    ERC721CappedFacet,
    ERC721SnapshotFacet,
    ERC721BurnableFacet,
    ERC721ControllerFacet,
    ERC721EnumerableFacet,
    ERC721RoyaltyFacet,
    ERC721ConsecutiveFacet,
    AccessControlFacet,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    IIsbeFactory,
} from '../../typechain-types'
import {
    ERC721_RESOLVER_KEY,
    ERC721_TEST_WRAPPER_RESOLVER_KEY,
    ERC721_CAPPED_RESOLVER_KEY,
    ERC721_SNAPSHOT_RESOLVER_KEY,
    ERC721_BURNABLE_RESOLVER_KEY,
    ERC721_CONTROLLER_RESOLVER_KEY,
    ERC721_ENUMERABLE_RESOLVER_KEY,
    ERC721_ROYALTY_RESOLVER_KEY,
    ERC721_CONSECUTIVE_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    CONFIGURATION_ID_ERC721,
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

export async function deployERC721UseCasesFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    owner: Signer,
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
    const ERC721FacetFactory = await ethers.getContractFactory('ERC721Facet')
    const ERC721TestWrapperFacetFactory = await ethers.getContractFactory(
        'ERC721TestWrapperFacet'
    )
    const ERC721CappedFacetFactory =
        await ethers.getContractFactory('ERC721CappedFacet')
    const ERC721SnapshotFacetFactory = await ethers.getContractFactory(
        'ERC721SnapshotFacet'
    )
    const ERC721BurnFacetFactory = await ethers.getContractFactory(
        'ERC721BurnableFacet'
    )
    const ERC721ControllerFacetFactory = await ethers.getContractFactory(
        'ERC721ControllerFacet'
    )
    const ERC721EnumerableFacetFactory = await ethers.getContractFactory(
        'ERC721EnumerableFacet'
    )
    const ERC721RoyaltyFacetFactory =
        await ethers.getContractFactory('ERC721RoyaltyFacet')
    const ERC721ConsecutiveFacetFactory = await ethers.getContractFactory(
        'ERC721ConsecutiveFacet'
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

    const erc721Facet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_RESOLVER_KEY,
        ERC721FacetFactory
    )
    const erc721TestWrapperFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_TEST_WRAPPER_RESOLVER_KEY,
        ERC721TestWrapperFacetFactory
    )
    const erc721CappedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_CAPPED_RESOLVER_KEY,
        ERC721CappedFacetFactory
    )
    const erc721SnapshotFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_SNAPSHOT_RESOLVER_KEY,
        ERC721SnapshotFacetFactory
    )
    const erc721BurnFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_BURNABLE_RESOLVER_KEY,
        ERC721BurnFacetFactory
    )
    const erc721ControllerFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_CONTROLLER_RESOLVER_KEY,
        ERC721ControllerFacetFactory
    )
    const erc721EnumerableFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_ENUMERABLE_RESOLVER_KEY,
        ERC721EnumerableFacetFactory
    )
    const erc721RoyaltyFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_ROYALTY_RESOLVER_KEY,
        ERC721RoyaltyFacetFactory
    )
    const erc721ConsecutiveFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC721_CONSECUTIVE_RESOLVER_KEY,
        ERC721ConsecutiveFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC721, [
        {
            businessId: ERC721_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_TEST_WRAPPER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CAPPED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_SNAPSHOT_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_BURNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_ENUMERABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_ROYALTY_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CONSECUTIVE_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ERC721,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const erc721 = ERC721FacetFactory.attach(proxy) as ERC721Facet
    const erc721TestWrapper = ERC721TestWrapperFacetFactory.attach(
        proxy
    ) as ERC721TestWrapperFacet
    const erc721Capped = ERC721CappedFacetFactory.attach(
        proxy
    ) as ERC721CappedFacet
    const erc721Snapshot = ERC721SnapshotFacetFactory.attach(
        proxy
    ) as ERC721SnapshotFacet
    const erc721Burn = ERC721BurnFacetFactory.attach(
        proxy
    ) as ERC721BurnableFacet
    const erc721Controller = ERC721ControllerFacetFactory.attach(
        proxy
    ) as ERC721ControllerFacet
    const erc721Enumerable = ERC721EnumerableFacetFactory.attach(
        proxy
    ) as ERC721EnumerableFacet
    const erc721Royalty = ERC721RoyaltyFacetFactory.attach(
        proxy
    ) as ERC721RoyaltyFacet
    const erc721Consecutive = ERC721ConsecutiveFacetFactory.attach(
        proxy
    ) as ERC721ConsecutiveFacet

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    return {
        erc721,
        erc721TestWrapper,
        erc721Capped,
        erc721Snapshot,
        erc721Burn,
        erc721Controller,
        erc721Enumerable,
        erc721Royalty,
        erc721Consecutive,
        pause,
        accessControl,
        erc721Facet,
        erc721TestWrapperFacet,
        erc721CappedFacet,
        erc721SnapshotFacet,
        erc721BurnFacet,
        erc721ControllerFacet,
        erc721EnumerableFacet,
        erc721RoyaltyFacet,
        erc721ConsecutiveFacet,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}
