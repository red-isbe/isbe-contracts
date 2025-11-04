# Admin Module

Role management for deployed tokens.

## RoleManager

Manage role-based access control on deployed tokens.

```typescript
import { RoleManager, ISBE_ROLES } from './RoleManager';

const roleManager = new RoleManager(tokenAddress, signer);

// Grant roles
await roleManager.grantRole(ISBE_ROLES.MINTER_ROLE, address);
await roleManager.grantRole(ISBE_ROLES.PAUSER_ROLE, address);

// Revoke roles
await roleManager.revokeRole(ISBE_ROLES.MINTER_ROLE, address);

// Check roles
const hasRole = await roleManager.hasRole(ISBE_ROLES.MINTER_ROLE, address);
```

### Available Roles

```typescript
const ISBE_ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MINTER_ROLE: '0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace',
  BURNER_ROLE: '0x7a8dc7dd7c89c7e1f9c620f8f3c6f759ba0034a63c96f84c6b92884e17e1679a',
  PAUSER_ROLE: '0xb1fab2c1c269da68d99437f207f7494db47a1c06dc5a0bf34468f4d77dbef673',
  SNAPSHOT_ROLE: '0x5fdbd35e8da83ee755d5e62a539e5ed7f47126abede0b8b10f9ea43dc6eed07f',
  CONTROLLER_ROLE: '0xd8fe00000000000000000000000000000000000000000000000000000000005',
  CAP_ROLE: '0xb2d2bfbe419e2d9628d4c43e1e189c5cc2396c2bb9ec8c5e4a8ee1f75f3f2633'
};
```

### Methods

- `grantRole(role, account)` - Grant role to account
- `revokeRole(role, account)` - Revoke role from account
- `hasRole(role, account)` - Check if account has role
- `getRoleAdmin(role)` - Get admin role for a role
- `renounceRole(role, account)` - Renounce own role
```
