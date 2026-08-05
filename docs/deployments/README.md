# ISBE Deployments

This directory contains deployment documentation for ISBE contracts.

## Archive

Historical deployment logs have been archived to [`./archive/`](./archive/SUMMARY.md).

- **Archive Summary**: Overview of all historical deployments
- **Archived Logs**: Detailed logs from October-November 2025 deployments

## Current Deployment Tools

For current deployment procedures, use the Hardhat tasks:

```bash
# Deploy all ISBE facets and update diamond
npx hardhat updateDiamondFacets --network <network>

# Deploy facets only (no diamond update)
npx hardhat deployFacets --network <network>

# Show current diamond facet configuration
npx hardhat showDiamondFacets --network <network>
```

See `tasks/README.md` for complete task documentation.

## Documentation

- `CLAUDE.md` - Project conventions and patterns
- `tasks/README.md` - Task documentation
- `scripts/deployment/` - Deployment scripts
