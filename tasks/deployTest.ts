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

/**
 npx hardhat deployTest --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --bytecode-path "./artifacts/contracts/hashtimestamp/HashTimestampFacet.sol/HashTimestampFacet.json"
 */

const CONFIG_ID =
    '0x0000000000000000000000000000000000000000000000000000000000000001'

const DEFAULT_BUSINESS_LOGICS_CODE_PATHS = [
    './artifacts/contracts/proxies/eip2535/facets/DiamondCutAccessControlFacet.sol/DiamondCutAccessControlFacet.json',
    './artifacts/contracts/proxies/eip2535/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json',
    './artifacts/contracts/access/accessControl/AccessControlFacet.sol/AccessControlFacet.json',
    './artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json',
]

const DEFAULT_BUSINESS_LOGICS_IDS = [
    '0xb1733495acec04f904af52509bd68775ca2e4aa31f6948d02cccd2af2adee890',
    '0xa081a7fa2e40735a4006bc6a225e18158879b54064ab1f60045661349931c41b',
    '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
    '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',
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

        // deploy use case

        //..................................

        // pause and unpause use case
        /*const resultPauseISBE = await pauseIsbe(proxyAddress, factory, signer)

        console.log('UseCase Pause result:', resultPauseISBE)

        const resultUNPauseISBE = await unpauseIsbe(
            proxyAddress,
            factory,
            signer
        )

        console.log('UseCase UnPause result:', resultUNPauseISBE)*/
    })
