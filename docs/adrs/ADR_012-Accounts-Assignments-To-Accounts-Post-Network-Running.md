# ADR 012: Post-Network Account Assignment Strategy for the 0x15BE Contract

## Summary

This ADR defines how the **five pre‑generated accounts** (produced by `npx hardhat generate‑env --count 5`) and a **separate Gas‑Station key** are mapped to the different governance, administrative and operational roles of the `0x15BE` diamond contract. All role‑granting, validation and balance‑transfer actions must be executed **exclusively through a Dockerised Hardhat environment**. The approach guarantees a deterministic, auditable, and fully automated role‑assignment process for every network deployment (dev, test, staging or production).

---

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision Drivers](#decision-drivers)
- [Scope](#scope)
- [Proposal](#proposal)
    - [Role Assignment Model](#role-assignment-model)
    - [Completed Example Role‑Account Mapping](#completed-example-role‑account-mapping)
- [Hardhat Tasks Available](#hardhat-tasks-available)
- [Execution Workflow](#execution-workflow)
- [Dockerised Execution Strategy](#dockerised-execution-strategy)
    - [Docker Image Generation](#docker-image-generation)
    - [Standardised Execution Pattern](#standardised-execution-pattern)
    - [CI/CD Integration](#cicd-integration)
- [Alternatives Considered](#alternatives-considered)
- [Risks & Trade‑offs](#risks--trade‑offs)
    - [Docker‑Specific Considerations](#docker‑specific-considerations)
- [Benefits](#benefits)
    - [Docker‑Specific Benefits](#docker‑specific-benefits)
- [Decision](#decision)
- [Implementation Plan](#implementation-plan)
    - [Docker‑Specific Implementation Steps](#docker‑specific-implementation-steps)
- [Assumptions](#assumptions)
    - [Docker‑Specific Assumptions](#docker‑specific-assumptions)
- [Glossary](#glossary)

---

## Status

**Proposed** – awaiting review and approval.

## Context

When a Besu network is started, only the **genesis account** (the first private key in the generated `.env`) receives the `DEFAULT_ADMIN_ROLE` on the `0x15BE` diamond contract. All other accounts are empty, which means they cannot perform any governance, configuration, business‑logic deployment, metadata management, DID‑registry updates, or other essential operations.

The repository ships a **deterministic set of 100 pre‑generated accounts** for DEV environments, but for production we only need **five of them** (the first five generated keys). The remaining accounts are reserved for future extensions.

Roles required by the `0x15BE` contract are **not** assigned in genesis; they must be granted after the network is live. The `isbe‑contracts` repo already provides a rich suite of Hardhat tasks that can interact with the deployed contracts in a fully typed, gas‑optimised manner.

## Decision Drivers

| Driver                         | Why it matters                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Deterministic & repeatable** | Every deployment must end up with the same role-to-account mapping.                                  |
| **Zero manual steps**          | Reduces human error and speeds up CI pipelines.                                                      |
| **Full CI/CD compatibility**   | The process must run inside Docker containers that CI runners can spin up.                           |
| **Auditable & verifiable**     | Each `grantRole` call is logged; `hasRole` validation guarantees success.                            |
| **Recoverable**                | If a step fails we can re-run the Docker command without side-effects.                               |
| **Support for both curves**    | The generator can emit `secp256k1` (default) or `secp256r1` accounts – the ADR must work for either. |

## Scope

The ADR covers:

- **Post‑network role assignment** for all operational and governance roles.
- **Dockerised execution** of the Hardhat tasks that perform the assignments, validation, admin hand‑over and balance transfer.
- **Transfer of administrative control** from the genesis account to a multisig wallet.

The ADR **does NOT** cover:

- Changes to the smart‑contract role definitions.
- Modifications to the genesis configuration file.
- Any back‑office UI or off‑chain role‑management tooling.

---

## Proposal

### Role Assignment Model

The network uses **five generated accounts** (Account 1–5) plus a **separate Gas‑Station key** supplied at deployment time. The mapping is **deterministic**:

| Block                         | Account # (generated) | Private‑key source                         | Assigned contract roles                                                                                                           |
| ----------------------------- | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **DEFAULT_ADMIN** (ephemeral) | 1 (genesis)           | First key generated by `generate‑env`      | `DEFAULT_ADMIN_ROLE` (temporarily)                                                                                                |
| **GDPR**                      | 2                     | Second generated key                       | `PAUSER_ROLE`<br>`GOVERNANCE_MANAGER_ROLE`<br>`ISBE_PAUSER_ROLE`                                                                  |
| **USE‑CASE**                  | 3                     | Third generated key                        | `BUSINESS_LOGIC_DEPLOYER_ROLE`<br>`GOVERNANCE_CONFIGURATION_MANAGER_ROLE`<br>`PROXY_DEPLOYER_ROLE`                                |
| **IDENTITY**                  | 4                     | Fourth generated key                       | `DID_REGISTRY_ROLE`<br>`TRUSTED_ISSUERS_REGISTRY_ROLE`<br>`ENS_MANAGER_ROLE`                                                      |
| **OPERATIONAL**               | 5                     | Fifth generated key                        | `CLIENT_FILTERING_ROLE`<br>`BESU_NODE_MANAGER_ROLE`<br>`ANCHORER_ROLE`<br>`METADATA_MANAGER_ROLE`<br>`TIMESTAMPING_REGISTRY_ROLE` |
| **GAS‑STATION**               | – (external)          | **Provided manually** (not part of `.env`) | _No contract roles_ – receives the leftover ether from Account 1 and funds subsequent transactions.                               |

_The `DEFAULT_ADMIN_ROLE` is **ephemeral** – after the multisig wallet receives the role it is renounced by Account 1. The remaining ether of Account 1 is transferred to the Gas‑Station address._

### Completed Example Role‑Account Mapping

| Block             | Account (index in the generated list) | Roles granted (bytes32 identifiers)                                                                                               |
| ----------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **DEFAULT_ADMIN** | 1                                     | `DEFAULT_ADMIN_ROLE` (temporary)                                                                                                  |
| **GDPR**          | 2                                     | `PAUSER_ROLE`<br>`GOVERNANCE_MANAGER_ROLE`<br>`ISBE_PAUSER_ROLE`                                                                  |
| **USE‑CASE**      | 3                                     | `BUSINESS_LOGIC_DEPLOYER_ROLE`<br>`GOVERNANCE_CONFIGURATION_MANAGER_ROLE`<br>`PROXY_DEPLOYER_ROLE`                                |
| **IDENTITY**      | 4                                     | `DID_REGISTRY_ROLE`<br>`TRUSTED_ISSUERS_REGISTRY_ROLE`<br>`ENS_MANAGER_ROLE`                                                      |
| **OPERATIONAL**   | 5                                     | `CLIENT_FILTERING_ROLE`<br>`BESU_NODE_MANAGER_ROLE`<br>`ANCHORER_ROLE`<br>`METADATA_MANAGER_ROLE`<br>`TIMESTAMPING_REGISTRY_ROLE` |
| **GAS‑STATION**   | – (external)                          | _No roles_ – receives the remaining balance of Account 1                                                                          |

> **Note** – The remaining accounts (6–100) are left untouched and can be used for future extensions or test accounts.

## Hardhat Tasks Available

The `isbe‑contracts` repository already ships the following relevant tasks (all callable from inside the Docker container):

| Task                                                                         | Purpose                                                                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `grantRole`                                                                  | Calls `AccessControl.grantRole(bytes32, address)` on the diamond.                                           |
| `revokeRole`                                                                 | Calls `AccessControl.revokeRole`.                                                                           |
| `renounceRole`                                                               | Calls `AccessControl.renounceRole`.                                                                         |
| `hasRole`                                                                    | Reads the role mapping for validation.                                                                      |
| `send` (custom)                                                              | Sends ether from one account to another – used for the genesis‑to‑gas‑station transfer.                     |
| `validate‑generated‑env`                                                     | Checks that the `.env` file contains valid private keys and that the primary account matches the first key. |
| _Deployment & inspection tasks_ (e.g. `deploy`, `getRoleMembers`, `inspect`) | Available for debugging or additional checks.                                                               |

## Execution Workflow

All steps are performed **inside the Docker image** to guarantee identical environments.

| Step   | Action                                                                                                                                                            | Hardhat command (run inside Docker)                                                                                                                                                                                                         | Notes                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **1**  | **Build Docker image** (`docker build -t isbe‑contracts:latest .`).                                                                                               | –                                                                                                                                                                                                                                           | Image contains Node 22, Hardhat, all tasks and utilities.                                           |
| **2**  | **Generate accounts** (`npx hardhat generate‑env --count 5 --dual`).                                                                                              | –                                                                                                                                                                                                                                           | Produces `.env.secp256k1` and `.env.secp256r1`. The first five keys correspond to the blocks above. |
| **3**  | **Export env vars** (e.g. `ISBE_URL`, `CHAIN_ID`, `CURVE`, `GDPR_ADDRESS`, `USE_CASE_ADDRESS`, `IDENTITY_ADDRESS`, `OPERATIONAL_ADDRESS`, `GAS_STATION_ADDRESS`). | –                                                                                                                                                                                                                                           | `*_ADDRESS` values are taken from the generated `.env`.                                             |
| **4**  | **Grant GDPR roles** to Account 2.                                                                                                                                | `npx hardhat grantRole --role <PAUSER_ROLE> --account $GDPR_ADDRESS …`<br>`npx hardhat grantRole --role <GOVERNANCE_MANAGER_ROLE> --account $GDPR_ADDRESS …`<br>`npx hardhat grantRole --role <ISBE_PAUSER_ROLE> --account $GDPR_ADDRESS …` | All three calls are executed in the same Docker run (or sequential runs).                           |
| **5**  | **Grant USE‑CASE roles** to Account 3.                                                                                                                            | Similar three `grantRole` calls with the appropriate role identifiers.                                                                                                                                                                      |                                                                                                     |
| **6**  | **Grant IDENTITY roles** to Account 4.                                                                                                                            | Similar three `grantRole` calls.                                                                                                                                                                                                            |                                                                                                     |
| **7**  | **Grant OPERATIONAL roles** to Account 5.                                                                                                                         | Five `grantRole` calls (client‑filtering, BESU‑node‑manager, anchorer, metadata‑manager, timestamping‑registry).                                                                                                                            |                                                                                                     |
| **8**  | **Validate assignments** – run `hasRole` for every role‑account pair.                                                                                             | `npx hardhat hasRole --role <ROLE> --account <ADDRESS>` for each mapping.                                                                                                                                                                   |                                                                                                     |
| **9**  | **Transfer remaining ether** from the genesis account (Account 1) to the Gas‑Station address.                                                                     | `npx hardhat send --to $GAS_STATION_ADDRESS --value all --from $ACCOUNT_PRIVATE_KEY` (a custom `send` task is provided).                                                                                                                    |                                                                                                     |
| **10** | **Hand over `DEFAULT_ADMIN_ROLE`** to the multisig wallet.                                                                                                        | `npx hardhat grantRole --role <DEFAULT_ADMIN_ROLE> --account $MULTISIG_ADDRESS`.                                                                                                                                                            |                                                                                                     |
| **11** | **Renounce all roles** from Account 1 (including the admin role).                                                                                                 | `npx hardhat renounceRole --role <ROLE> --account $ACCOUNT_PRIVATE_KEY` for each role held by the genesis account.                                                                                                                          |                                                                                                     |
| **12** | **Final validation** – confirm the multisig now holds `DEFAULT_ADMIN_ROLE` and that Account 1 has no roles.                                                       | `hasRole` checks.                                                                                                                                                                                                                           |                                                                                                     |
| **13** | **Persist logs** – Docker container stdout/stderr are captured by the CI system for audit.                                                                        | –                                                                                                                                                                                                                                           |

All steps **must** be run with the same Docker image to keep the environment immutable.

## Dockerised Execution Strategy

### Docker Image Generation

```dockerfile
# Dockerfile – role‑assignment execution image
FROM node:22-alpine

WORKDIR /app

# Install dependencies (npm ci ensures lock‑file exactness)
COPY package*.json ./
RUN npm ci

# Copy the whole Hardhat project (config, tasks, contracts, utils, etc.)
COPY hardhat.config.ts ./
COPY tsconfig.json ./
COPY artifacts/      ./artifacts/
COPY config/         ./config/
COPY cache/          ./cache/
COPY deployment-configs/ ./deployment-configs/
COPY scripts/        ./scripts/
COPY tasks/          ./tasks/
COPY typechain-types/ ./typechain-types/
COPY types/          ./types/
COPY utils/          ./utils/

# Entrypoint – every `docker run …` will invoke Hardhat directly
ENTRYPOINT ["npx", "hardhat"]

```

Build with:

```bash
docker build -t isbe-contracts:latest .

```

### Standardised Execution Pattern

All role‑granting commands share a common pattern. Below is a **template** that the CI job (or a developer) can copy‑paste, filling the concrete values:

```bash
docker run --rm \
  -e ISBE_URL=$ISBE_URL \
  -e CHAIN_ID=$CHAIN_ID \
  -e CURVE=$CURVE \
  -e GDPR_ADDRESS=$GDPR_ADDRESS \
  -e USE_CASE_ADDRESS=$USE_CASE_ADDRESS \
  -e IDENTITY_ADDRESS=$IDENTITY_ADDRESS \
  -e OPERATIONAL_ADDRESS=$OPERATIONAL_ADDRESS \
  -e GAS_STATION_ADDRESS=$GAS_STATION_ADDRESS \
  -e MULTISIG_ADDRESS=$MULTISIG_ADDRESS \
  -v $(pwd)/config:/config \   # mount the folder that contains the generated .env files
  isbe-contracts:latest \
  grantRole \
    --role 0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1 \
    --account $GDPR_ADDRESS \
    --diamond 0x00000000000000000000000000000000000015BE \
    --network isbe

```

The same pattern is repeated for each role, swapping `--role` and `--account` accordingly.

### CI/CD Integration

A minimal GitHub‑Actions (or Azure‑Pipelines, GitLab‑CI…) job could look like:

```yaml
jobs:
    assign-roles:
        runs-on: ubuntu-latest
        container:
            image: isbe-contracts:latest
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4

            - name: Generate accounts (5 keys)
              run: npx hardhat generate-env --count 5 --dual

            - name: Export env vars
              run: |
                  source .env.secp256k1   # or .env.secp256r1, depending on the network
                  echo "GDPR_ADDRESS=$ACCOUNT_2" >> $GITHUB_ENV
                  echo "USE_CASE_ADDRESS=$ACCOUNT_3" >> $GITHUB_ENV
                  echo "IDENTITY_ADDRESS=$ACCOUNT_4" >> $GITHUB_ENV
                  echo "OPERATIONAL_ADDRESS=$ACCOUNT_5" >> $GITHUB_ENV
                  echo "GAS_STATION_ADDRESS=${{ secrets.GAS_STATION_ADDRESS }}" >> $GITHUB_ENV
                  echo "MULTISIG_ADDRESS=${{ secrets.MULTISIG_ADDRESS }}" >> $GITHUB_ENV
                  echo "ISBE_URL=${{ secrets.ISBE_URL }}" >> $GITHUB_ENV
                  echo "CHAIN_ID=${{ secrets.CHAIN_ID }}" >> $GITHUB_ENV
                  echo "CURVE=secp256k1" >> $GITHUB_ENV   # or secp256r1

            - name: Grant all roles
              run: |
                  # GDPR
                  npx hardhat grantRole --role $PAUSER_ROLE          --account $GDPR_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $GOVERNANCE_MANAGER_ROLE --account $GDPR_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $ISBE_PAUSER_ROLE      --account $GDPR_ADDRESS          --diamond $DIAMOND --network isbe
                  # USE‑CASE
                  npx hardhat grantRole --role $BUSINESS_LOGIC_DEPLOYER_ROLE      --account $USE_CASE_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $GOVERNANCE_CONFIGURATION_MANAGER_ROLE --account $USE_CASE_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $PROXY_DEPLOYER_ROLE               --account $USE_CASE_ADDRESS          --diamond $DIAMOND --network isbe
                  # IDENTITY
                  npx hardhat grantRole --role $DID_REGISTRY_ROLE               --account $IDENTITY_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $TRUSTED_ISSUERS_REGISTRY_ROLE   --account $IDENTITY_ADDRESS          --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $ENS_MANAGER_ROLE                --account $IDENTITY_ADDRESS          --diamond $DIAMOND --network isbe
                  # OPERATIONAL
                  npx hardhat grantRole --role $CLIENT_FILTERING_ROLE   --account $OPERATIONAL_ADDRESS --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $BESU_NODE_MANAGER_ROLE --account $OPERATIONAL_ADDRESS --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $ANCHORER_ROLE          --account $OPERATIONAL_ADDRESS --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $METADATA_MANAGER_ROLE  --account $OPERATIONAL_ADDRESS --diamond $DIAMOND --network isbe
                  npx hardhat grantRole --role $TIMESTAMPING_REGISTRY_ROLE --account $OPERATIONAL_ADDRESS --diamond $DIAMOND --network isbe
                  # ADMIN hand‑over
                  npx hardhat grantRole --role $DEFAULT_ADMIN_ROLE --account $MULTISIG_ADDRESS --diamond $DIAMOND --network isbe
                  # Balance transfer to gas‑station
                  npx hardhat send --to $GAS_STATION_ADDRESS --value all --from $ACCOUNT_PRIVATE_KEY --network isbe
                  # Renounce admin from genesis
                  npx hardhat renounceRole --role $DEFAULT_ADMIN_ROLE --account $ACCOUNT_PRIVATE_KEY --diamond $DIAMOND --network isbe
```

_(All role identifiers such as `$PAUSER_ROLE` are environment variables that contain the `bytes32` hash of the role name – they can be exported from a constants file or retrieved with a helper task.)_

## Alternatives Considered

| Alternative                                             | Reason for rejection                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Manual UI‑based role assignment**                     | Not auditable, not repeatable, requires human interaction.                                                                        |
| **Embedding all role grants in the genesis file**       | Roles differ per deployment (e.g., multisig address, gas‑station address) and the genesis format does not support `grantRole`.    |
| **Custom ad‑hoc scripts (bash / node without Hardhat)** | Hardhat already supplies contract‑aware tooling, type‑safety, automatic ABI handling and network‑specific signing.                |
| **Direct Hardhat CLI on host machine**                  | Breaks the "single source of truth" guarantee – host‑specific versions could diverge, making reproducing a deployment impossible. |

## Risks & Trade‑offs

- **Wrong env‑var values** – could grant roles to the wrong address. Mitigated by step 8 (validation with `hasRole`).
- **Docker image availability** – a broken image would block deployments. Mitigated by storing the image in a trusted registry and version‑pinning it in CI.
- **Partial failure** – if a `grantRole` call fails, the network may be left in a partially configured state. The workflow is **idempotent**; re‑running the Docker command will re‑grant any missing roles.
- **Gas‑Station key leakage** – the private key for the gas‑station is supplied out‑of‑band; it must be stored in a secret manager (Vault, Azure Key Vault, GitHub Secrets, etc.).

### Docker‑Specific Considerations

- **Image Registry Dependency** – ensure the registry has high availability and that the image is scanned for vulnerabilities before promotion.
- **Resource Limits** – the container must have enough CPU / memory to sign and broadcast transactions (usually negligible).
- **Network Connectivity** – the container must be able to reach the RPC endpoint (`ISBE_URL`).

## Benefits

- **Full traceability** – every role assignment is a Docker‑run logged in CI.
- **Deterministic state** – the same five generated keys always map to the same functional blocks.
- **Zero‑touch for operators** – after the image is built, the only required input is the Gas‑Station private key and the multisig address.
- **Easy rollback** – rebuilding an older Docker tag reproduces the exact previous state.

### Docker‑Specific Benefits

- **Environment consistency** – identical Node, Hardhat and library versions across dev / test / prod.
- **Version pinning** – the image tag is the single source of truth for tooling versions.
- **Isolation** – no host‑side configuration can affect the transaction signing.
- **Scalability** – the same image can be used in parallel pipelines for multiple networks.

## Decision

**Adopt the Docker‑only Hardhat workflow described above**, using the five‑account generation scheme and the six‑block mapping (including a separate Gas‑Station account). All post‑network role assignments will be performed via the `grantNetworkPermissions.sh` script (or the equivalent series of Hardhat commands) inside the `isbe‑contracts:latest` Docker image.

## Implementation Plan

1.  **Docker image** – build and publish `isbe-contracts:latest` (or a versioned tag).
2.  **Update `grantNetworkPermissions.sh`**:
    - Add an 8th positional argument (`GAS_STATION_ADDRESS`).
    - After the last `grantRole` call, invoke a `send` task that transfers the full balance of the genesis account to `$GAS_STATION_ADDRESS`.
    - Add a final `grantRole` for `DEFAULT_ADMIN_ROLE` → multisig and a `renounceRole` for the genesis account.
3.  **CI pipeline** – add steps that (a) generate the five accounts, (b) export the derived addresses into environment variables, (c) run the Docker commands that perform steps 4‑12 from the workflow table.
4.  **Documentation** – update the ADR (this file) and the repository `README` with the new block description and the required Gas‑Station secret.
5.  **Testing** – spin up a local Besu node, run the full Docker workflow, verify that every `hasRole` returns `true` for the expected mappings, and that the Gas‑Station receives the expected ether balance.
6.  **Security review** – ensure the Gas‑Station private key is stored only in a secret manager and never written to disk by the CI job.

### Docker‑Specific Implementation Steps

| Step                     | Action                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Image build pipeline** | `docker build -t registry.example.com/isbe‑contracts:<git‑sha> .` and push to a private registry.                                       |
| **Image scanning**       | Run Trivy / Clair on the image; block promotion on high‑severity findings.                                                              |
| **Rollback procedure**   | Keep the previous image tag (`<git‑sha>-prev`) in the registry; CI can fall back by changing the image reference.                       |
| **Run‑book**             | Provide a short markdown file that shows how to execute the script locally for debugging (`docker run … grantNetworkPermissions.sh …`). |

## Assumptions

- The network uses **secp256k1** unless `CURVE=secp256r1` is explicitly set.
- The genesis file assigns `DEFAULT_ADMIN_ROLE` **only** to the first generated account (Account 1).
- CI/CD infrastructure can run Docker containers and has access to the required secrets (Gas‑Station private key, multisig address, RPC URL).
- The five generated accounts have enough native ether to pay for all role‑granting transactions.

### Docker‑Specific Assumptions

- Docker runtime is available on every runner / host that will execute the workflow.
- The private registry that stores `isbe‑contracts` is reachable from the CI environment.
- Network connectivity to the Besu RPC endpoint is reliable from inside the container.

---

## Glossary

| Term                               | Definition                                                                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0x15BE**                         | The core diamond contract that implements the ISBE access‑control model.                                                                                                           |
| **Facet**                          | A modular contract that is attached to the diamond via the EIP‑2535 diamond standard.                                                                                              |
| **Hardhat Task**                   | A CLI command defined in `tasks/` that can interact with contracts, generate files, etc.                                                                                           |
| **Multisig Wallet**                | A contract (e.g., Gnosis Safe) that requires multiple signatures to execute admin actions.                                                                                         |
| **Role Identifier**                | The `bytes32` hash that identifies an access‑control role in the diamond.                                                                                                          |
| **ISBE**                           | Internal name for the **I**ntegrated **S**mart‑contract **B**usiness **E**cosystem.                                                                                                |
| **Dockerised Execution**           | Running Hardhat tasks inside a Docker container to guarantee environment reproducibility.                                                                                          |
| **Gas‑Station Account**            | An account (external to the generated five) that receives the leftover ether from the genesis account and is used to fund subsequent transactions. It holds **no contract roles**. |
| **DEFAULT_ADMIN_ROLE (ephemeral)** | The admin role initially held by the genesis account; it is transferred to the multisig after the other roles are granted and the remaining balance is moved.                      |

### Final Note

All the changes above bring the ADR fully in line with the **six‑block model** (DEFAULT‑ADMIN, GDPR, USE‑CASE, IDENTITY, OPERATIONAL, GAS‑STATION) and with the **five‑account generation limit** enforced by `generate‑env`. The document now reflects the exact commands, Docker image, and CI steps needed to reliably initialise a new ISBE network.

Feel free to open a PR with this updated ADR, adjust any role‑identifier constants to match the exact values used in the contract, and then proceed with the implementation steps. Happy deploying!
