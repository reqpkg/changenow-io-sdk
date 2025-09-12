# ChangeNow.io SDK

TypeScript SDK for the [ChangeNow.io](https://changenow.io) cryptocurrency exchange API. This library provides a typed interface to ChangeNow's REST API with both v1 and v2 endpoint support.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Prerequisites and Environment

- Requires Node.js (tested with v20.19.5) and npm (tested with v10.8.2)
- Uses ES modules exclusively (`"type": "module"` in package.json)

### Bootstrap, Build, and Development

- Install dependencies: `npm install` -- takes <1 second if cached, 12 seconds fresh install, produces some deprecation warnings (normal)
- Build distribution: `npm run build` -- takes 2-3 seconds using unbuild. Creates ES module files in `dist/`
- Regenerate API client: `npm run generate-client` -- takes 1-2 seconds using swagger-typescript-api

### Available Scripts

- `npm run build` - Builds the distribution files using unbuild
- `npm run generate-client` - Regenerates `src/client.ts` from `src/schema.yaml` OpenAPI specification

### Code Formatting

- Uses reqprettier for code formatting with import sorting
- Format code: `npx prettier --write .`
- Check formatting: `npx prettier --check .` (currently reports 6 files with formatting issues)
- **Note**: Prettier configuration has some warnings but is functional

## Repository Structure

### Key Files and Directories

- `src/index.ts` - Main SDK entry point, exports `createChangeNowSDK` function
- `src/client.ts` - Generated API client (2831 lines, auto-generated from OpenAPI spec)
- `src/schema.yaml` - OpenAPI 3.0.3 specification for ChangeNow API
- `dist/` - Built distribution files (ES modules and TypeScript declarations)
- `build.config.ts` - Unbuild configuration
- `tsconfig.json` - TypeScript configuration (ES6 target, ESNext modules)

### Generated Files

- `src/client.ts` is auto-generated. Do not edit manually.
- Always run `npm run generate-client` after modifying `src/schema.yaml`
- `dist/` directory is created during build process

## Validation and Testing

### Manual Validation Scenarios

Since this is an SDK library with no test suite, always validate changes by:

1. **Build validation**: Run `npm run build` and verify no errors
2. **SDK instantiation test**:
   ```javascript
   import { createChangeNowSDK } from "./dist/index.mjs";
   const sdk = createChangeNowSDK("test-api-key");
   console.log("v1 methods:", Object.keys(sdk.v1).slice(0, 5));
   console.log("v2 methods:", Object.keys(sdk.v2).slice(0, 5));
   ```
3. **Type checking**: Verify TypeScript compilation with `npx tsc --noEmit`
4. **Import verification**: Test that the built module can be imported in both CommonJS and ES module contexts

### No Tests or CI

- This repository has no test suite (Jest, Mocha, etc.)
- No GitHub Actions workflows or CI/CD pipelines
- No automated linting beyond prettier formatting
- Validation relies entirely on manual testing and TypeScript compilation

## Development Workflows

### Adding New API Endpoints

1. Update `src/schema.yaml` with new OpenAPI definitions
2. Run `npm run generate-client` to regenerate the client
3. Update `src/index.ts` if needed to expose new methods
4. Run `npm run build` to create distribution files
5. Test manually by importing and using the new endpoints

### Making Changes to Core SDK

1. Edit `src/index.ts` (main entry point)
2. Run `npm run build` to build distribution
3. Test manually with a simple import script
4. Format code with `npx prettier --write .`

### Common Issues and Solutions

- **Build errors**: Usually TypeScript compilation issues, check `tsconfig.json` settings
- **Import errors**: Verify ES module syntax and `package.json` type declaration
- **API client outdated**: Run `npm run generate-client` to sync with latest schema
- **Formatting issues**: Run `npx prettier --write .` before committing

## SDK Usage Patterns

### Basic SDK Initialization

```javascript
import { createChangeNowSDK } from "changenow-io-sdk";
const sdk = createChangeNowSDK("your-api-key");
```

### Available API Versions

- `sdk.v1` - Version 1 API methods (listOfAvailableCurrencies, createExchangeTransaction, etc.)
- `sdk.v2` - Version 2 API methods (estimate, marketinfo, transactionStatus1, etc.)

### API Key Requirement

- All API calls require a valid ChangeNow API key
- Get API key from [ChangeNow affiliate account](https://changenow.io/affiliate)
- API key is passed as header `X-Changenow-Api-Key`

## Common Commands Output Reference

### Repository Root Contents

```
.github/        - GitHub configuration (only dependabot.yml)
.gitignore      - Git ignore rules
LICENSE         - MIT license
README.md       - Basic usage documentation
build.config.ts - Unbuild configuration
package.json    - Project configuration and dependencies
src/            - Source TypeScript files
tsconfig.json   - TypeScript compiler configuration
```

### Package.json Key Information

- Name: `changenow-io-sdk`
- Type: ES module only
- Main export: `dist/index.mjs`
- TypeScript declarations: `dist/index.d.mts`
- Dependencies: Only development dependencies (unbuild, swagger-typescript-api, etc.)

### Build Output (dist/)

- `index.mjs` - Main ES module bundle (~147kB)
- `index.d.mts` - TypeScript module declarations
- `index.d.ts` - Additional TypeScript declarations

Always verify changes work by building and manually testing the SDK instantiation and method availability.
