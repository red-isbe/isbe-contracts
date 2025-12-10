import { task } from 'hardhat/config'
import sss from 'shamirs-secret-sharing'
import { ethers } from 'ethers'
import EC from 'elliptic/lib/elliptic/ec/index.js'

task(
    'sss.recover',
    "Recover private key from shares using Shamir's Secret Sharing"
)
    .addParam('shares', 'Comma-separated list of shares')
    .setAction(async (taskArgs) => {
        const { shares } = taskArgs

        try {
            // Parse shares from comma-separated string
            const shareArray = shares
                .split(',')
                .map((share) => sss.Buffer.from(share.trim(), 'hex'))

            const privateKey: sss.Buffer = sss.combine(shareArray)

            // Convert privateKey back to hex string
            const secretHex = privateKey.toString('hex')

            // Generate secp256k1 key pair from recovered private key
            const privateKeyHex = `0x${secretHex}`
            const publicKey = ethers.SigningKey.computePublicKey(
                privateKeyHex,
                true
            )
            const address = ethers.computeAddress(privateKeyHex)

            const ec = new EC('p256')
            // Generate secp256r1 key pair using the same private key
            const secp256r1KeyPair = ec.keyFromPrivate(secretHex, 'hex')

            // Extract public key properly for P-256 curve
            const publicKeyBuffer = secp256r1KeyPair
                .getPublic()
                .encode('hex', true)
            const secp256r1PublicKey = `0x${publicKeyBuffer}`

            // Calculate secp256r1 address manually using uncompressed key
            const publicKeyHex =
                '0x04' +
                secp256r1KeyPair.getPublic().getX().toString('hex', 64) +
                secp256r1KeyPair.getPublic().getY().toString('hex', 64)
            const publicKeyBytes = ethers.getBytes('0x' + publicKeyHex.slice(4))
            const secp256r1Address =
                '0x' + ethers.keccak256(publicKeyBytes).slice(-40)

            // Prepare the result as a valid JSON object
            const result = {
                recoveredPrivateKey: privateKeyHex,
                secp256k1: {
                    publicKey: publicKey,
                    address: address,
                },
                secp256r1: {
                    publicKey: secp256r1PublicKey,
                    address: secp256r1Address,
                },
            }

            // Output as JSON
            console.log(JSON.stringify(result, null, 2))

            return result
        } catch (error) {
            console.log(
                'Error reconstructing private key from shares. Please check your shares.',
                error
            )
            return
        }
    })
