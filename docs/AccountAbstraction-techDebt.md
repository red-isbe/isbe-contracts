# Account Abstraction Technical Debt

Account Abstraction has been adapted to the current ISBE needs and architecture. Beyond the custom extensions tha may be introduced in the future, several adjustments and deviations from the standard have resulted in technical debt.

The following items summarize the identified technical debt:

- Replace `block.timestamp` with it corresponding function (`EntryPointInternal.sol` line 702)
- Replace `solhint-disable` statements at file level with the corresponding line statements
- Replace `EntryPoint`'s EIP712 usage (`EntryPointInternal.sol`) with our custom implementation (`ERC712Internal`)
- Move `EntryPoint`'s constants (`entryPointConstants.sol`) to it's corresponding place
- Change global imports to named imports
- Create a role to execute EntryPoint's `handleOps` function
- Implement required task to manage AA contracts
