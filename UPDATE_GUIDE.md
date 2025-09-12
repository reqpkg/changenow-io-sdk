# ChangeNow SDK Update Guide

This document provides guidance on how to keep the ChangeNow SDK updated with the latest API changes.

## Current API Coverage

The SDK currently implements **37 endpoints** across two API versions:

### V1 API (15 endpoints)
- Currency management (list, info, currency-specific lists)
- Exchange transactions (create, status)
- Exchange estimates and calculations
- Fixed-rate exchange support
- Transaction management

### V2 API (22 endpoints)  
- Enhanced exchange operations
- Fiat currency integration
- Network fee calculations
- Address validation
- Exchange actions (continue, refund)
- Multi-network support
- Advanced transaction management

## Modern Features Implemented

✅ **Multi-network support** - Handles different blockchain networks  
✅ **Token contracts** - Support for ERC-20, BEP-20, etc.  
✅ **Fiat integration** - Fiat-to-crypto and crypto-to-fiat exchanges  
✅ **Fixed-rate exchanges** - Guaranteed exchange rates  
✅ **Address validation** - Validate wallet addresses  
✅ **Exchange actions** - Continue/refund pending transactions  
✅ **Network fees** - Calculate blockchain transaction fees  
✅ **Legacy ticker support** - Backward compatibility  

## How to Update the SDK

### 1. Check for Official API Updates

Monitor these sources for ChangeNow API updates:
- **Official Documentation**: https://documenter.getpostman.com/view/8180765/SVfTPnM8
- **ChangeNow Website**: https://changenow.io/
- **Partner Communication**: Updates via partners@changenow.io

### 2. Export Updated API Specification

If you have access to the updated Postman collection:

```bash
# Option 1: Using Postman Export
# Export the collection as OpenAPI 3.0 from Postman interface

# Option 2: Using postman-to-openapi converter
npm install -g postman-to-openapi
postman-to-openapi collection.json -o updated-schema.yaml

# Option 3: Using Newman (if collection URL is available)
newman run <collection-url> --export-collection updated-collection.json
```

### 3. Update the Schema

Replace the current schema with the updated one:

```bash
# Backup current schema
cp src/schema.yaml src/schema.yaml.backup

# Replace with updated schema
cp updated-schema.yaml src/schema.yaml
```

### 4. Regenerate the Client

```bash
# Regenerate TypeScript client from updated schema
npm run generate-client

# Verify no breaking changes
npm run build
```

### 5. Test the Updated SDK

```bash
# Run any existing tests
npm test

# Manual testing
node -e "
const sdk = require('./dist/index.mjs');
const client = sdk.createChangeNowSDK('test-key');
console.log('V1 methods:', Object.keys(client.v1).length);
console.log('V2 methods:', Object.keys(client.v2).length);
"
```

### 6. Update Package Version

```bash
# Update version in package.json
npm version patch  # or minor/major depending on changes

# Commit changes
git add .
git commit -m "Update ChangeNow API schema to latest version"

# Tag release
git tag v$(node -p "require('./package.json').version")
```

## Automated Update Detection

Consider implementing automated checks for API updates:

```javascript
// Example: Check for schema changes
const fs = require('fs');
const crypto = require('crypto');

function getSchemaHash() {
  const schema = fs.readFileSync('./src/schema.yaml', 'utf8');
  return crypto.createHash('sha256').update(schema).digest('hex');
}

// Store hash and check periodically
const currentHash = getSchemaHash();
console.log('Current schema hash:', currentHash);
```

## Common Update Scenarios

### Adding New Endpoints
When ChangeNow adds new API endpoints:
1. Update the OpenAPI schema with new paths
2. Regenerate the client  
3. Test new functionality
4. Update documentation

### Modifying Existing Endpoints
When existing endpoints change:
1. Review breaking vs non-breaking changes
2. Update schema accordingly
3. Test backward compatibility
4. Update version appropriately (patch vs minor vs major)

### Adding New Currencies/Networks
ChangeNow frequently adds support for new cryptocurrencies and networks:
1. These are typically handled automatically via dynamic endpoints
2. No schema changes usually required
3. Test with new currency codes

## Troubleshooting

### Schema Validation Errors
```bash
# Validate OpenAPI schema
npx swagger-codegen-cli validate -i src/schema.yaml
```

### Client Generation Issues
```bash
# Clear generated files and regenerate
rm src/client.ts
npm run generate-client
```

### Build Failures
```bash
# Clean build and rebuild
rm -rf dist/
npm run build
```

## Best Practices

1. **Always backup** the current schema before updating
2. **Test thoroughly** after updates, especially with real API keys
3. **Document breaking changes** in changelog
4. **Use semantic versioning** for package releases
5. **Monitor API deprecation notices** from ChangeNow
6. **Keep dependencies updated**, especially `swagger-typescript-api`

## Need Help?

- **ChangeNow API Support**: partners@changenow.io
- **SDK Issues**: Create an issue in this repository
- **Documentation**: Refer to the official ChangeNow API documentation