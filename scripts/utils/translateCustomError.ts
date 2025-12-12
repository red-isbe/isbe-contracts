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
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function decodeError(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    data: string
): Promise<string> {
    // The first 4 bytes are the function selector
    const errorSelector = data.slice(0, 10) // '0x' + 8 hex chars

    // The rest is the encoded error message
    const errorData = '0x' + data.slice(10)

    const abi = (await hre.artifacts.readArtifact(contractName)).abi

    // Find the error definition in the ABI
    const errorFragment = abi.find(
        (item) =>
            item.type === 'error' &&
            hre.ethers
                .id(
                    item.name +
                        '(' +
                        (item.inputs
                            ? item.inputs.map((input) => input.type).join(',')
                            : '') +
                        ')'
                )
                .slice(0, 10) === errorSelector
    )

    if (!errorFragment) {
        return `Unknown error with selector ${errorSelector}`
    }

    // Decode the error parameters using AbiCoder from ethers v6
    const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder()
    const decodedParams = abiCoder.decode(
        errorFragment.inputs.map((input) => input.type),
        errorData
    )

    // Construct a readable error message
    let errorMessage = `${errorFragment.name}(`
    errorFragment.inputs.forEach((input, index: number) => {
        errorMessage += `${input.name}: ${decodedParams[index]}`
        if (index < errorFragment.inputs.length - 1) {
            errorMessage += ', '
        }
    })
    errorMessage += ')'

    return errorMessage
}
