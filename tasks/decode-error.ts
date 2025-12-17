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
// tasks/decode-error.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Interface } from '@ethersproject/abi'

task('decode-error', 'Decode error from IIsbeFactory')
    .addParam('error', 'The error data (hex string)')
    .addParam('factory', 'IIsbeFactory contract address')
    .setAction(
        async (
            args: { error: string; factory: string },
            hre: HardhatRuntimeEnvironment
        ) => {
            try {
                // Get the IIsbeFactory artifact and create interface
                const factoryArtifact =
                    await hre.artifacts.readArtifact('IIsbeFactory')
                const iface = new Interface(factoryArtifact.abi)

                // Parse the error
                const error = iface.parseError(args.error)

                // Output the decoded error
                console.log(`\nDecoded IIsbeFactory Error:`)
                console.log(`========================`)
                console.log(`Error Name: ${error.name}`)
                console.log(`Error Signature: ${error.signature}`)

                if (error.args.length > 0) {
                    console.log(`\nError Arguments:`)
                    error.args.forEach((arg, i) => {
                        console.log(`  [${i}] ${arg}`)
                    })
                } else {
                    console.log(`\nNo arguments for this error.`)
                }

                // Additional helpful information
                console.log(`\nContract Address: ${args.factory}`)
                console.log(`Error Data: ${args.error}`)
            } catch (err) {
                console.error('\nError decoding the error data:')
                console.error(err.message)

                // Try to provide helpful suggestions
                if (err.message.includes('no matching error')) {
                    console.error('\nPossible causes:')
                    console.error('1. The error data might be malformed')
                    console.error(
                        '2. The error might not be defined in IIsbeFactory'
                    )
                    console.error(
                        '3. The error might be from a different contract'
                    )
                }

                process.exit(1)
            }
        }
    )
