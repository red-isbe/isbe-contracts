import { ethers } from 'hardhat'
import { deployGovernance } from './governance'
import {
    ERC20_RESOLVER_KEY,
    ERC20_CAPPED_RESOLVER_KEY,
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    CONFIGURATION_ID_ERC20,
} from '../../utils/constants'

/**
 * Common fixture for basic ERC20 deployment without initialization
 * This is the lightest fixture - just deploys the contracts
 */
export async function deployBasicERC20Fixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()
    const otherAccountAddress = await otherAccount.getAddress()

    const result = await deployGovernance(owner, [], CONFIGURATION_ID_ERC20)

    return {
        owner,
        otherAccount,
        ownerAddress,
        otherAccountAddress,
        erc20: result.erc20,
        erc20Snapshot: result.erc20Snapshot,
        erc20Burnable: result.erc20Burnable,
        erc20Capped: result.erc20Capped,
        erc20Controller: result.erc20Controller,
        accessControl: result.accessControl,
        erc20Facet: result.erc20Facet,
    }
}

/**
 * Fixture for initialized ERC20 with standard name, symbol, decimals and cap
 */
export async function deployInitializedERC20Fixture(
    name = 'ISBE stable token',
    symbol = 'isbe',
    decimals = 2,
    cap = 1000
) {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()
    const otherAccountAddress = await otherAccount.getAddress()

    const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
    const CappedFactory = await ethers.getContractFactory('ERC20CappedFacet')

    const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
    const data = [
        ERC20Factory.interface.encodeFunctionData('initializeErc20', [
            name,
            symbol,
            decimals,
        ]),
        CappedFactory.interface.encodeFunctionData('initializeCap', [cap]),
    ]

    const result = await deployGovernance(
        owner,
        [],
        CONFIGURATION_ID_ERC20,
        false,
        '0x',
        businessIds,
        data
    )

    return {
        owner,
        otherAccount,
        ownerAddress,
        otherAccountAddress,
        erc20: result.erc20,
        erc20Snapshot: result.erc20Snapshot,
        erc20Burnable: result.erc20Burnable,
        erc20Capped: result.erc20Capped,
        erc20Controller: result.erc20Controller,
        accessControl: result.accessControl,
        erc20Facet: result.erc20Facet,
    }
}

/**
 * Fixture for initialized ERC20 in paused state
 */
export async function deployPausedERC20Fixture(
    name = 'ISBE stable token',
    symbol = 'isbe',
    decimals = 2,
    cap = 1000
) {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()
    const otherAccountAddress = await otherAccount.getAddress()

    const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
    const CappedFactory = await ethers.getContractFactory('ERC20CappedFacet')

    const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
    const data = [
        ERC20Factory.interface.encodeFunctionData('initializeErc20', [
            name,
            symbol,
            decimals,
        ]),
        CappedFactory.interface.encodeFunctionData('initializeCap', [cap]),
    ]

    const result = await deployGovernance(
        owner,
        [],
        CONFIGURATION_ID_ERC20,
        true, // init_pause = true
        '0x',
        businessIds,
        data
    )

    return {
        owner,
        otherAccount,
        ownerAddress,
        otherAccountAddress,
        erc20: result.erc20,
        erc20Snapshot: result.erc20Snapshot,
        erc20Burnable: result.erc20Burnable,
        erc20Capped: result.erc20Capped,
        erc20Controller: result.erc20Controller,
        accessControl: result.accessControl,
        erc20Facet: result.erc20Facet,
    }
}

/**
 * Fixture for fully prepared ERC20 with all roles granted
 */
export async function deployPreparedERC20Fixture(
    name = 'ISBE stable token',
    symbol = 'isbe',
    decimals = 2,
    cap = 1000
) {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()
    const otherAccountAddress = await otherAccount.getAddress()

    const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
    const CappedFactory = await ethers.getContractFactory('ERC20CappedFacet')

    const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
    const data = [
        ERC20Factory.interface.encodeFunctionData('initializeErc20', [
            name,
            symbol,
            decimals,
        ]),
        CappedFactory.interface.encodeFunctionData('initializeCap', [cap]),
    ]

    const result = await deployGovernance(
        owner,
        [],
        CONFIGURATION_ID_ERC20,
        false,
        '0x',
        businessIds,
        data
    )

    // Grant all necessary roles
    await result.accessControl.grantRole(MINTER_ROLE, ownerAddress)
    await result.accessControl.grantRole(CAP_ROLE, ownerAddress)
    await result.accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)
    await result.accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

    return {
        owner,
        otherAccount,
        ownerAddress,
        otherAccountAddress,
        erc20: result.erc20,
        erc20Snapshot: result.erc20Snapshot,
        erc20Burnable: result.erc20Burnable,
        erc20Capped: result.erc20Capped,
        erc20Controller: result.erc20Controller,
        accessControl: result.accessControl,
        erc20Facet: result.erc20Facet,
    }
}

/**
 * Lightweight fixture for basic contract deployment without governance
 * Use this for unit tests that don't need the full ISBE infrastructure
 */
export async function deployLightweightERC20Fixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()
    const otherAccountAddress = await otherAccount.getAddress()

    // Deploy simple ERC20 for unit tests
    const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
    const erc20 = await ERC20Factory.deploy()
    await erc20.waitForDeployment()

    return {
        owner,
        otherAccount,
        ownerAddress,
        otherAccountAddress,
        erc20,
    }
}

/**
 * Utility to get standard test signers with addresses
 */
export async function getTestSigners() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
    return {
        owner,
        otherAccount,
        thirdAccount,
        ownerAddress: await owner.getAddress(),
        otherAccountAddress: await otherAccount.getAddress(),
        thirdAccountAddress: await thirdAccount.getAddress(),
    }
}
