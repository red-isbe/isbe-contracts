import { task } from 'hardhat/config'

import { getFacets } from '../../scripts/configMgmt/getFacets'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat facets --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
 --config-version 1 \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('facets', 'Returns facets from config management')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The version number')
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                version: number
                factory: string
            },
            hre
        ) => {
            const { configId, version, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await getFacets(configId, version, factory, signer)

            console.log('Diamond facets:')

            for (let i = 0; i < result.facets.length; i++) {
                console.log('  Facet :', result.facets[i].facetAddress)
                for (
                    let j = 0;
                    j < result.facets[i].functionSelectors.length;
                    j++
                ) {
                    console.log(
                        '     Selector : ',
                        result.facets[i].functionSelectors[j]
                    )
                }
            }
        }
    )
