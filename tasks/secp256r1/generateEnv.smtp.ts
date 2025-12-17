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
// tasks/secp256r1/generateEnv.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { randomBytes } from 'crypto'
import { int, string } from 'hardhat/internal/core/params/argumentTypes'
import { CypherNotifier } from '../../scripts/utils/CypherNotifier'
import { encryptAES } from '../../scripts/utils/aes'

const ROLES = [
    'DEFAULT_ADMIN_ROLE',
    'GDPR_OPERATIONS',
    'USE_CASE',
    'IDENTITY_MANAGEMENT',
    'OPERATIONAL_MANAGEMENT',
    'GAS_STATION',
    'FREE',
]
interface PublicKeyData {
    publicKey: string
    address: string
}

interface AdministrativeData {
    role: string
    privateKey: string
    secp256k1: PublicKeyData
    secp256r1: PublicKeyData
}

interface AllocData {
    balance: string
    comment: string
}

const ALLOC = {
    balance:
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    comment: 'ISBE managed ACCOUNT',
} as AllocData

interface NotificationData {
    email: string
    phone: string
}

/**
 * Task to generate a random .env file with configurable parameters
 Example:
 npx hardhat generate-env-smtp \
 --count 128 \
 --custodian-email "custodian@redisbe.es" \
 --custodian-phone "34666123456" \
 --genesis-email "genesis@redisbe.es" \
 --genesis-phone "347779876123" \
 --infra-email "infra@redisbe.es" \
 --infra-phone "34600543678" \
 --smtp-host "sandbox.smtp.mailtrap.io" \
 --smtp-port 2525 \
 --smtp-user "26021d7ed97f61" \
 --smtp-pass "9d2bac79238d34" \
 --vonage-api-key "vanageApiKey" \
 --vonage-api-secret "vanageApiSecret"
 */
task(
    'generate-env-smtp',
    `Generate:
    
* The set of private random private keys to build a network.
* That list of private keys with its metadata is cyphered and will be sent to the secrect custodian.
* A json object will be generated with addresses for secp256k1 and secp256r1 to improve the genesis generation and will be sent to the genesis generator team.
* The first 6 generated accounts must be send cyphered to the infrastructure team.`
)
    .addParam(
        'count',
        'Number of private keys to generate',
        undefined,
        int,
        false
    )
    .addParam(
        'custodianEmail',
        'Email of the custodian',
        undefined,
        string,
        false
    )
    .addParam(
        'custodianPhone',
        'Phone number to send SMS',
        undefined,
        string,
        false
    )
    .addParam(
        'genesisEmail',
        'Email of the genesis generator',
        undefined,
        string,
        false
    )
    .addParam(
        'genesisPhone',
        'Phone of the genesis generator',
        undefined,
        string,
        false
    )
    .addParam('infraEmail', 'Email of the infra team', undefined, string, false)
    .addParam(
        'infraPhone',
        'Phone number of the infra team to receive SMS',
        undefined,
        string,
        false
    )
    .addParam('smtpHost', 'SMTP host', undefined, string, false)
    .addParam('smtpPort', 'SMTP port', undefined, int, false)
    .addParam('smtpUser', 'SMTP username', undefined, string, false)
    .addParam('smtpPass', 'SMTP password', undefined, string, false)
    .addParam('vonageApiKey', 'Vonage API Key', undefined, string, false)
    .addParam('vonageApiSecret', 'Vonage API Secret', undefined, string, false)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🔐 Generating Random .env Configuration')
        console.log('='.repeat(45))
        console.log('')

        const count = parseInt(taskArgs.count)

        if (count < 1 || count > 500) {
            throw new Error('Count must be between 1 and 500')
        }

        const cypherNotifier = new CypherNotifier(
            taskArgs.smtpHost,
            taskArgs.smtpPort,
            taskArgs.smtpUser,
            taskArgs.smtpPass,
            taskArgs.vonageApiKey,
            taskArgs.vonageApiSecret
        )
        const custodian: NotificationData = {
            email: taskArgs.custodianEmail,
            phone: taskArgs.custodianPhone,
        }
        const genesis: NotificationData = {
            email: taskArgs.genesisEmail,
            phone: taskArgs.genesisPhone,
        }
        const infra: NotificationData = {
            email: taskArgs.infraEmail,
            phone: taskArgs.infraPhone,
        }
        return await handleDualMode(
            hre,
            count,
            cypherNotifier,
            custodian,
            genesis,
            infra
        )
    })

/**
 * Handle dual mode - create both secp256k1 and secp256r1 files with same private keys
 */
async function handleDualMode(
    hre: HardhatRuntimeEnvironment,
    count: number,
    cypherNotifier: CypherNotifier,
    custodian: NotificationData,
    genesis: NotificationData,
    infra: NotificationData
) {
    console.log('🔄 Dual Mode: Creating environment private keys')
    console.log('📋 Configuration:')
    console.log(`   • Number of accounts: ${count}`)
    console.log(`   • Custodian contact data: ${JSON.stringify(custodian)}`)
    console.log(`   • Genesis contact data: ${JSON.stringify(genesis)}`)
    console.log(`   • Infrastructure contact data: ${JSON.stringify(infra)}`)
    console.log('')

    // Generate base private keys
    console.log('🔧 Generating private keys...')
    const basePrivateKeys = generatePrivateKeys(count)

    // Create administrative accounts
    console.log('🔧 Creating administrative accounts...')
    const administrativeAccounts = createAdministrativeAccounts(
        hre,
        basePrivateKeys
    )

    // Create secp256r1 accounts
    console.log('🔧 Creating secp256r1 accounts with same private keys...')
    await createSecp256r1Accounts(administrativeAccounts, basePrivateKeys)

    // Send notifications
    await sendNotifications(
        cypherNotifier,
        administrativeAccounts,
        custodian,
        genesis,
        infra
    )

    // Display summary
    displayNotificationSummary(custodian, genesis, infra)
}

function generatePrivateKeys(count: number): string[] {
    const keys: string[] = []
    for (let i = 0; i < count; ++i) {
        keys.push('0x' + randomBytes(32).toString('hex'))
    }
    return keys
}

function createAdministrativeAccounts(
    hre: HardhatRuntimeEnvironment,
    privateKeys: string[]
): AdministrativeData[] {
    const alloc = {
        secp256k1: {},
        secp256r1: {},
    }
    const accounts: AdministrativeData[] = []
    let pos = 0

    for (const privateKey of privateKeys) {
        const wallet = new hre.ethers.Wallet(privateKey)
        alloc.secp256k1[wallet.address] = ALLOC
        accounts.push({
            role: ROLES[pos],
            privateKey,
            secp256k1: {
                publicKey: wallet.signingKey.publicKey,
                address: wallet.address,
            },
            secp256r1: {
                publicKey: '',
                address: '',
            },
        })
        if (pos < 6) ++pos
    }

    return accounts
}
// Avoid overly verbose descriptions or unnecessary details.
async function createSecp256r1Accounts(
    accounts: AdministrativeData[],
    privateKeys: string[]
): Promise<void> {
    const { deriveEthereumAddress } = await import('../../utils/secp256r1Utils')
    // eslint-disable-next-line
    const EC = require('elliptic').ec
    const ec = new EC('p256')
    let pos = 0

    for (const privateKey of privateKeys) {
        try {
            const cleanPrivateKey = privateKey.startsWith('0x')
                ? privateKey.slice(2)
                : privateKey
            const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
            const publicKey = keyPair.getPublic()
            const uncompressedPublicKey = publicKey.encode('hex', false)
            const address = deriveEthereumAddress(uncompressedPublicKey)

            accounts[pos].secp256r1.address = address
            accounts[pos].secp256r1.publicKey = '0x'.concat(
                uncompressedPublicKey
            )
        } catch (error) {
            console.warn(
                `⚠️  Could not generate secp256r1 address for key ${privateKey.substring(0, 8)}...`,
                error.message
            )
        }
        ++pos
    }
}

async function sendNotifications(
    notifier: CypherNotifier,
    accounts: AdministrativeData[],
    custodian: NotificationData,
    genesis: NotificationData,
    infra: NotificationData
): Promise<void> {
    const alloc = {
        secp256k1: {},
        secp256r1: {},
    }

    // Populate alloc with secp256k1 addresses
    accounts.forEach((account) => {
        alloc.secp256k1[account.secp256k1.address] = ALLOC
    })

    // Populate alloc with secp256r1 addresses
    accounts.forEach((account) => {
        if (account.secp256r1.address) {
            alloc.secp256r1[account.secp256r1.address] = ALLOC
        }
    })

    console.log('. Sending custodian data')
    await notifier.sendCypheredNotification(
        encryptAES(JSON.stringify(accounts, null, 2)),
        custodian.email,
        custodian.phone
    )

    console.log('. Sending genesis data')
    await notifier.sendCypheredNotification(
        encryptAES(JSON.stringify(alloc, null, 2)),
        genesis.email,
        genesis.phone
    )

    console.log('. Sending infra data')
    await notifier.sendCypheredNotification(
        encryptAES(JSON.stringify(accounts.slice(0, 6), null, 2)),
        infra.email,
        infra.phone
    )

    console.log('✅ Successfully notified!')
}

function displayNotificationSummary(
    custodian: NotificationData,
    genesis: NotificationData,
    infra: NotificationData
): void {
    console.log('')
    console.log('📊 Sent Notifications')
    console.log('='.repeat(45))
    console.log('')

    console.log(
        `Email with cyphered private keys was sent to ${custodian.email}`
    )
    console.log(
        `SMS with key to recover the private keys was sent to ${custodian.phone}`
    )
    console.log(
        `Email with alloc data for genesis was sent to ${genesis.email}`
    )
    console.log(
        `SMS with key to recover the alloc data for genesis was sent to ${genesis.phone}`
    )
    console.log(`Email with operative private keys was sent to ${infra.email}`)
    console.log(
        `SMS with key to recover operative private keys was sent to ${infra.phone}`
    )
}
