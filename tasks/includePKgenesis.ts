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
import { pkmanagement } from '../scripts/genesisGenerator'
import { task } from 'hardhat/config'

task(
    'genesis:modifyAllocations',
    'Include enerate privatekeys in genesis files'
)
    .addParam('templatefile', 'Template JSON file to use for r1 curve')
    .addParam('outputfile', 'Generated Output JSON file for r1 curve')
    .addParam('pkfile', 'File containing private keys to include')
    .addOptionalParam('amount', 'Amount of prefuunding')
    .setAction(async (taskArgs) => {
        const { templatefile, outputfile, pkfile } = taskArgs

        let prefund: bigint = 999999999999999999999999999999999999999999n
        if (taskArgs.amount) {
            prefund = BigInt(taskArgs.amount)
        }

        console.info(
            '---------------------------------------------------------------------'
        )
        console.info('🚀    ISBE Genesis Private Key inclusion started...')
        console.info(
            '---------------------------------------------------------------------'
        )
        console.info(`📄 Using r1 template file: ${templatefile}`)
        console.info(`📄 Using r1 output file: ${outputfile}`)
        console.info(`📄 Using private key file: ${pkfile}`)
        console.info(`📄 Using prefund amount: ${prefund}`)

        const pkm: pkmanagement = new pkmanagement(templatefile, pkfile)

        console.info('🚀 Generating genesis file with private keys...')
        await pkm.generate(outputfile, prefund)
    })
