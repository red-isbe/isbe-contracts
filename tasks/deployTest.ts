import { task } from 'hardhat/config'
import { getSigner } from '../scripts/utils/getSigner'
import { deployIsbeFactory } from '../scripts/businessLogic/deployIsbeFactory' // Adjust path if needed
import fs from 'fs'
import path from 'path'
import { deployBusinessLogic } from '../scripts/businessLogic/deployBusinessLogic'
import { pause } from '../scripts/pause/pause'
import { unpause } from '../scripts/pause/unpause'
import { isPaused } from '../scripts/pause/isPaused'
import { getFacets } from '../scripts/diamond/loupe/getFacets'
import { setConfig } from '../scripts/configMgmt/setConfig'
import { getConfig } from '../scripts/configMgmt/getConfig'
import { getFacets as getConfigFacets } from '../scripts/configMgmt/getFacets'
import { pauseIsbe } from '../scripts/globalPause/pauseIsbe'
import { unpauseIsbe } from '../scripts/globalPause/unpauseIsbe'
import { getRoleAdmin } from '../scripts/access/accessControl/getRoleAdmin'
import { getRoleMembers } from '../scripts/access/accessControl/getRoleMembers'
import { getRolesByAccount } from '../scripts/access/accessControl/getRolesByAccount'
/*import { grantRole } from '../scripts/access/accessControl/grantRole'
import { hasRole } from '../scripts/access/accessControl/hasRole'
import { renounceRole } from '../scripts/access/accessControl/renounceRole'
import { revokeRole } from '../scripts/access/accessControl/revokeRole'
import { setRoleAdmin } from '../scripts/access/accessControl/setRoleAdmin'*/
import { getBusinessLogicAddress } from '../scripts/businessLogic/getBusinessLogicAddress'
import { getBusinessLogicVersions } from '../scripts/businessLogic/getBusinessLogicVersions'
import { getBusinessLogics } from '../scripts/businessLogic/getBusinessLogics'
import { deployUseCase } from '../scripts/proxyFactory/deployUseCase'
import { getConfigurationByProxy } from '../scripts/proxyFactory/getConfigurationByProxy'

/**
 npx hardhat deployTest --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --bytecode-path "./artifacts/contracts/hashtimestamp/HashTimestampFacet.sol/HashTimestampFacet.json"
 */

const CONFIG_ID =
    '0x0000000000000000000000000000000000000000000000000000000000000001'

const PAUSE_ROLE =
    '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1'

const DEFAULT_BUSINESS_LOGICS_CODE_PATHS = [
    './artifacts/contracts/proxies/isbeproxy/facets/IsbeCutFacet.sol/IsbeCutFacet.json',
    './artifacts/contracts/proxies/isbeproxy/facets/IsbeLoupeFacet.sol/IsbeLoupeFacet.json',
    './artifacts/contracts/access/accessControl/AccessControlFacet.sol/AccessControlFacet.json',
    './artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json',
]

const DEFAULT_BUSINESS_LOGICS_IDS = [
    '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25',
    '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2',
    '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
    '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',
]

const USE_CASE_ROLES = [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
    '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
]

task('deployTest', 'deploys a governance factory and tests all the scripts')
    .addParam('businessId', 'The business ID')
    .addParam('bytecodePath', 'Path to the business logic bytecode')
    .setAction(async (taskArgs, hre) => {
        const { businessId, bytecodePath } = taskArgs

        // deploy governance
        console.log('GOVERNANCE')

        const accountAddress = process.env.ACCOUNT_ADDRESS ?? ''

        const GovernanceAddress = await deployIsbeFactory(
            hre,
            accountAddress,
            '0x'
        )
        console.log('ISBE Factory deployed at:', GovernanceAddress)

        // getting signer
        const signer = getSigner(hre)

        // check governance facets and selectors
        const resultGovernanceFacets = await getFacets(
            GovernanceAddress,
            signer
        )

        console.log('Diamond facets:')

        for (let i = 0; i < resultGovernanceFacets.facets.length; i++) {
            console.log(
                '  Facet :',
                resultGovernanceFacets.facets[i].facetAddress
            )
            for (
                let j = 0;
                j < resultGovernanceFacets.facets[i].functionSelectors.length;
                j++
            ) {
                console.log(
                    '     Selector : ',
                    resultGovernanceFacets.facets[i].functionSelectors[j]
                )
            }
        }

        // check governance accesses and roles
        const resultRolesByAccount = await getRolesByAccount(
            accountAddress,
            GovernanceAddress,
            signer
        )

        for (let i = 0; i < resultRolesByAccount.roles.length; i++) {
            const resultRoleMembers = await getRoleMembers(
                resultRolesByAccount.roles[i],
                GovernanceAddress,
                signer
            )
            const resultRoleAdmin = await getRoleAdmin(
                resultRolesByAccount.roles[i],
                GovernanceAddress,
                signer
            )

            console.log('Governance Role : ' + resultRolesByAccount.roles[i])
            console.log('    Role Admin : ' + resultRoleAdmin.roleAdmin)
            console.log('    Members : ' + resultRoleMembers.members)
        }

        // pause and unpause governance
        const resultPauseGovernance = await pause(GovernanceAddress, signer)

        console.log('Governance Pause result:', resultPauseGovernance)

        const resultIsPauseGovernance = await isPaused(
            GovernanceAddress,
            signer
        )

        if (resultIsPauseGovernance.isPaused == false)
            throw Error('Governance pause did not work')

        const resultUNPauseGovernance = await unpause(GovernanceAddress, signer)

        console.log('Governance Unpause result:', resultUNPauseGovernance)

        const resultIsPauseGovernance_2 = await isPaused(
            GovernanceAddress,
            signer
        )

        if (resultIsPauseGovernance_2.isPaused == true)
            throw Error('Governance unpause did not work')

        console.log('')
        console.log('')
        console.log('')

        // deploy default business logics
        console.log('BUSINESS LOGICS')

        for (let i = 0; i < DEFAULT_BUSINESS_LOGICS_CODE_PATHS.length; i++) {
            const bytecodeContentDefault = fs
                .readFileSync(
                    path.resolve(DEFAULT_BUSINESS_LOGICS_CODE_PATHS[i]),
                    'utf8'
                )
                .trim()

            const bytecodeDefault = JSON.parse(bytecodeContentDefault).bytecode

            const resultDeployDefaultBL = await deployBusinessLogic(
                DEFAULT_BUSINESS_LOGICS_IDS[i],
                bytecodeDefault,
                GovernanceAddress,
                signer
            )

            console.log('Default deployment result:', resultDeployDefaultBL)

            const resultBLVersion = await getBusinessLogicVersions(
                DEFAULT_BUSINESS_LOGICS_IDS[i],
                GovernanceAddress,
                signer
            )

            const resultBLAddress = await getBusinessLogicAddress(
                DEFAULT_BUSINESS_LOGICS_IDS[i],
                GovernanceAddress,
                '1',
                signer
            )

            if (
                resultBLAddress.businessAddress !=
                resultDeployDefaultBL.businessAddress
            )
                throw new Error(
                    'BL address not the same ' +
                        resultBLAddress.businessAddress +
                        ' != ' +
                        resultDeployDefaultBL.businessAddress
                )
            if (
                resultBLVersion.businessIdVersions[0] !=
                resultDeployDefaultBL.businessAddress
            )
                throw new Error(
                    'BL address version not the same ' +
                        resultBLVersion.businessIdVersions[0] +
                        ' != ' +
                        resultDeployDefaultBL.businessAddress
                )
        }

        // deploy custom business logic
        const bytecodeContent = fs
            .readFileSync(path.resolve(bytecodePath), 'utf8')
            .trim()

        const bytecode = JSON.parse(bytecodeContent).bytecode

        const resultDeployBL = await deployBusinessLogic(
            businessId,
            bytecode,
            GovernanceAddress,
            signer
        )

        console.log('Deployment result:', resultDeployBL)

        const resultBLs = await getBusinessLogics(GovernanceAddress, signer)

        console.log('All Business Ids : ' + resultBLs.businessId)

        console.log('')
        console.log('')
        console.log('')

        // set configuration
        console.log('CONFIGURATION MANAGEMENT')

        const resultSetConfiguration = await setConfig(
            CONFIG_ID,
            [resultDeployBL.businessId],
            [Number.parseInt(resultDeployBL.version.toString())],
            GovernanceAddress,
            signer
        )

        console.log('Set Configuration result:')
        console.log('   configId: ' + resultSetConfiguration.configurationId)
        console.log(
            '   businessData: ' + resultSetConfiguration.businessData[0]
        )
        console.log('   version: ' + resultSetConfiguration.version)

        const resultGetConfiguration = await getConfig(
            CONFIG_ID,
            Number.parseInt(resultSetConfiguration.version.toString()),
            GovernanceAddress,
            signer
        )

        console.log('Configuration : ' + CONFIG_ID)

        for (let i = 0; i < resultGetConfiguration.businessData.length; i++) {
            console.log(
                '   business Id: ' +
                    resultGetConfiguration.businessData[i].businessId
            )
            console.log(
                '   business version: ' +
                    resultGetConfiguration.businessData[i].version
            )
        }

        const resultConfigFacets = await getConfigFacets(
            CONFIG_ID,
            Number.parseInt(resultSetConfiguration.version.toString()),
            GovernanceAddress,
            signer
        )

        for (let i = 0; i < resultConfigFacets.facets.length; i++) {
            console.log('   Facet :', resultConfigFacets.facets[i].facetAddress)
            for (
                let j = 0;
                j < resultConfigFacets.facets[i].functionSelectors.length;
                j++
            ) {
                console.log(
                    '     Selector : ',
                    resultConfigFacets.facets[i].functionSelectors[j]
                )
            }
        }

        console.log('')
        console.log('')
        console.log('')

        // deploy use case
        console.log('PROXY FACTORY')

        const resultDeployUseCase = await deployUseCase(
            CONFIG_ID,
            Number.parseInt(resultSetConfiguration.version.toString()),
            [PAUSE_ROLE],
            [[accountAddress]],
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x',
            GovernanceAddress,
            signer
        )

        const UseCaseAddress = resultDeployUseCase.proxy

        console.log('Deployed Use Case result:')
        console.log('  Configuration ID:', resultDeployUseCase.configurationId)
        console.log('  Version:', resultDeployUseCase.version)
        console.log('  RBACs:', JSON.stringify(resultDeployUseCase.rbacs))
        console.log('  Proxy Address:', UseCaseAddress)

        const resultUseCaseConfig = await getConfigurationByProxy(
            UseCaseAddress,
            GovernanceAddress,
            signer
        )

        if (resultUseCaseConfig.configurationId != CONFIG_ID)
            throw new Error(
                'Config ID not the same for deployed use case' +
                    resultUseCaseConfig.configurationId +
                    ' != ' +
                    CONFIG_ID
            )

        if (
            resultUseCaseConfig.version !=
            Number.parseInt(resultSetConfiguration.version.toString())
        )
            throw new Error(
                'Config Version not the same for deployed use case' +
                    resultUseCaseConfig.version +
                    ' != ' +
                    Number.parseInt(resultSetConfiguration.version.toString())
            )

        // check use case accesses and roles

        for (let i = 0; i < USE_CASE_ROLES.length; i++) {
            const resultUseCaseRoleMembers = await getRoleMembers(
                USE_CASE_ROLES[i],
                UseCaseAddress,
                signer
            )
            const resultUseCaseRoleAdmin = await getRoleAdmin(
                USE_CASE_ROLES[i],
                UseCaseAddress,
                signer
            )

            console.log('Use Case Role : ' + USE_CASE_ROLES[i])
            console.log('    Role Admin : ' + resultUseCaseRoleAdmin.roleAdmin)
            console.log('    Members : ' + resultUseCaseRoleMembers.members)
        }

        // pause and unpause use case
        const resultPauseISBE = await pauseIsbe(
            UseCaseAddress,
            GovernanceAddress,
            signer
        )

        console.log('UseCase Pause result:', resultPauseISBE)

        const resultUNPauseISBE = await unpauseIsbe(
            UseCaseAddress,
            GovernanceAddress,
            signer
        )

        console.log('UseCase UnPause result:', resultUNPauseISBE)
    })
