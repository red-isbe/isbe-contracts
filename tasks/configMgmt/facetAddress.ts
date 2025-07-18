import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddress } from '../../scripts/configMgmt/getFacetAddress'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat facetAddress --network localhost \
 --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
 --config-version 1 \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
    --selector "0x34a23402"
 */

dotenv.config()

task('facetAddress', 'Returns facet address from config management')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The version number')
    .addParam('factory', 'The factory contract address')
    .addParam('selector', 'The selector bytes4')
    .setAction(
        async (
            taskArgs: {
                configId: string
                version: number
                factory: string
                selector: string
            },
            hre
        ) => {
            const { configId, version, factory, selector } = taskArgs

            const signer = await getSigner(hre)

            const result = await getFacetAddress(
                configId,
                version,
                factory,
                selector,
                signer
            )

            console.log('Facet address:', result)
        }
    )
