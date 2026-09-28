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
import { ZeroAddress } from 'ethers'
import { deployGovernance } from './governance'
import { CONFIGURATION_ID_DID_REGISTRY } from '../../utils/constants'
import { EllipticType } from '../types/identity'
import {
    IServiceDidRegistry__factory,
    IServiceDidRegistry,
} from '../../typechain-types'

/**
 * Service DID Registry fixtures.
 *
 * The facet is NOT part of the governance diamond that `deployGovernance` builds: that
 * list is fixed in the constructor. It is added here afterwards, through the diamond's
 * own cut surface, which is what an upgrade of a live 0x15BE would do — so these
 * fixtures double as the upgrade simulation the acceptance criteria ask for, and leave
 * every shared fixture untouched.
 *
 * Two cuts are needed. `diamondCut` registers the selectors; `interfaceCut` registers
 * the ERC-165 interface id, which `diamondCut` alone does not do.
 */

/** Enum value of IDiamond.ItemCutAction.Add */
const ITEM_CUT_ACTION_ADD = 0

/**
 * Governance diamond with the facet cut in but NOT yet initialised, so that
 * `initializeServiceDidRegistry` can itself be the subject of a test.
 */
export async function deployServiceDidRegistryFixture() {
    const [admin, other, third] = await ethers.getSigners()

    const gov = await deployGovernance(
        admin,
        undefined,
        CONFIGURATION_ID_DID_REGISTRY
    )
    const governanceAddress = await gov.governanceContract.getAddress()

    // The organisational registry has to be live before any service identity can be
    // registered: registration requires an existing parent DID.
    await gov.didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)

    // ---- deploy the facet and its storage probe, as an upgrade would ----
    const facetFactory = await ethers.getContractFactory(
        'ServiceDidRegistryTestWrapperFacet'
    )
    const serviceDidRegistryFacet = await facetFactory.deploy()
    await serviceDidRegistryFacet.waitForDeployment()
    const facetAddress = await serviceDidRegistryFacet.getAddress()

    const probeFactory = await ethers.getContractFactory(
        'ServiceDidStorageProbeFacet'
    )
    const storageProbeFacet = await probeFactory.deploy()
    await storageProbeFacet.waitForDeployment()
    const probeAddress = await storageProbeFacet.getAddress()
    const probeSelector = storageProbeFacet.interface.getFunction(
        'forceServiceDidExists'
    )!.selector

    const newSelectors = await serviceDidRegistryFacet.selectorsIntrospection()
    const newInterfaces =
        await serviceDidRegistryFacet.interfacesIntrospection()

    // ---- selectors already present, captured before the cut ----
    // Reported here rather than left to the cut's own revert, so that a collision names
    // the offending selector instead of surfacing as an opaque bytes4.
    const selectorsBeforeCut = (await gov.diamondLoupe.facets()).flatMap(
        (facet) => [...facet.functionSelectors]
    )

    // ---- cut both in ----
    const diamondCut = gov.diamondCutAccessControl.connect(admin)
    await diamondCut.diamondCut(
        [
            {
                facetAddress,
                action: ITEM_CUT_ACTION_ADD,
                items: [...newSelectors],
            },
            {
                facetAddress: probeAddress,
                action: ITEM_CUT_ACTION_ADD,
                items: [probeSelector],
            },
        ],
        ZeroAddress,
        '0x'
    )
    await diamondCut.interfaceCut([
        {
            facetAddress,
            action: ITEM_CUT_ACTION_ADD,
            items: [...newInterfaces],
        },
    ])

    const serviceDidRegistry: IServiceDidRegistry =
        IServiceDidRegistry__factory.connect(governanceAddress, admin)

    // The probe reaches the diamond's storage through the diamond itself.
    const storageProbe = probeFactory
        .attach(governanceAddress)
        .connect(admin) as typeof storageProbeFacet

    return {
        ...gov,
        admin,
        other,
        third,
        governanceAddress,
        serviceDidRegistryFacet,
        serviceDidRegistry,
        storageProbe,
        facetAddress,
        newSelectors: [...newSelectors],
        newInterfaces: [...newInterfaces],
        selectorsBeforeCut,
    }
}

/** Same as above, with the facet already initialised. */
export async function deployInitializedServiceDidRegistryFixture() {
    const base = await deployServiceDidRegistryFixture()

    const registry = base.serviceDidRegistryFacet.attach(
        base.governanceAddress
    ) as typeof base.serviceDidRegistryFacet
    await registry.connect(base.admin).initializeServiceDidRegistry()

    return base
}

/**
 * Governance diamond with the facet deployed but NOT cut, so that the cut itself can be
 * exercised as the subject of a test rather than as setup.
 */
export async function deployGovernanceWithoutServiceFacetFixture() {
    const [admin, other] = await ethers.getSigners()

    const gov = await deployGovernance(
        admin,
        undefined,
        CONFIGURATION_ID_DID_REGISTRY
    )
    await gov.didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)

    const facetFactory = await ethers.getContractFactory(
        'ServiceDidRegistryTestWrapperFacet'
    )
    const serviceDidRegistryFacet = await facetFactory.deploy()
    await serviceDidRegistryFacet.waitForDeployment()

    return {
        ...gov,
        admin,
        other,
        governanceAddress: await gov.governanceContract.getAddress(),
        serviceDidRegistryFacet,
        facetAddress: await serviceDidRegistryFacet.getAddress(),
        itemCutActionAdd: ITEM_CUT_ACTION_ADD,
    }
}
