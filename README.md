# isbe-contracts

Repository of certified and audited utilities for use in the ISBE network

## Requirements

- Node version 20.X.X

## User Roles

In this repository we can find two different users:

- Admin users: These users must maintain the project and allow access to other users with the specific role defined. These users are smart contract working group coordinators (IoBuilders). Also, at least on of these users must review any change to be applied to this repository from other admin or collab users.

- Collab users: These users have read permissions to the repository. They can also submit pull requests in order to contribute to the repository. These pull requests must be validated by admin users.

## Changes Procedure

In order to include any change in this repository, we need to follow these steps:

- Create a new branch from main branch
- Branch names must follow this pattern:
    - feat/[IssueId]-XXX
    - fix/[IssueId]-XXX
    - docs/[IssueId]-XXX
    - release/[IssueId]-XXX
- Commits must be signed to be pushed.
- Create pull request (PR) to merge into main branch
- Send PR link in smart contract working group channel
- Approve PR by admin users
- Merge PR (by the user that created the PR) (\*)
- Remove the branch

> IssueId: This ID represents the [project](https://github.com/orgs/alastria/projects/21) issue related to the changes you are applying.

(\*) Any commit pushed after the PR was approved must be approved as well before merging.

## Code best practices

- Testing coverage 100% (lines and branches).
- Runs Slither without critical vulnerabilities.
- Run Prettier and Linter before committing changes.
- Run Npm Audit before committing changes.
- Include NatSpec documentation in interface contract (also in implementation contracts if something not defined in interface)
