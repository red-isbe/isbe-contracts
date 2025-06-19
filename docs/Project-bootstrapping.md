# Project bootstraping

This document aims to describe the project bootstrapping process required for all use cases intended to be deployed on the ISBE network. All use cases must be structured as a project, following the guidelines outlined below.

As part of the validation process, these projects will be subject to audit by the network managers to ensure compliance with the necessary requirements for deployment. Any contract that does not meet the specified requirements will be considered ineligible and, therefore, will not be deployed on the network. The deployment of contracts will always be carried out by the network managers—under no circumstances will it be performed by the clients who own these use cases.

To define the required project bootstrapping, requirements are established at three levels: tooling, testing, and dependencies on the ISBE-contracts project. The requirements for each level are described below.

## Tooling

- **Solidity:** Projects containing contracts intended for deployment on the ISBE network must use Solidity version 0.8.28 or higher in their pragma.
- **Hardhat:** Projects containing contracts intended for deployment on the ISBE network must be built using Hardhat. The required version is 2.23.0 or higher.
- **Node:** Projects containing contracts intended for deployment on the ISBE network must include Node. The required version is v20.0.0 or higher.
- **Solhint:** Projects containing contracts intended for deployment on the ISBE network must include the Solhint tool. The required version is 5.0.5 or higher.
- **Prettier:** Projects containing contracts intended for deployment on the ISBE network must include the Prettier tool. The required version is 3.5.3 or higher.
- **Slither:** Projects containing contracts intended for deployment on the ISBE network must include the Slither tool. The required version is 0.11.0 or higher.

## Testing

All projects containing contracts intended for deployment on the ISBE network must implement tests for those contracts. These tests must ensure their correct functionality, thereby preventing potential bugs. To achieve this, it is essential to establish high coverage requirements. The ISBE network coverage requirements for all use cases intended for deployment are as follows:

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

Any project that does not meet these coverage levels for its contracts will not be deployed on the ISBE network.

## ISBE-contracts project

All projects containing contracts intended for deployment on the network must include the ISBE-contracts project as a dependency. This allows all contracts implemented in that project to be used and extended to support specific use cases. The contracts included in this project have already been audited and their behavior verified by the ISBE network administrators, providing clients with a set of utilities to facilitate the development of their own use cases.

In addition, all deployable contracts that are not part of the ISBE-contracts project must inherit from a Common contract (core/Common.sol) that is provided and ensures minimum requirements within the network. Details about the functionalities included in this contract can be found in the project documentation to ensure proper usage.
