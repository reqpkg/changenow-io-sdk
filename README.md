# 🪙 [changenow.io](https://changenow.app.link/referral?link_id=a573e3fc331990) (crypto exchange) SDK

[changenow.io](https://changenow.app.link/referral?link_id=a573e3fc331990) (crypto exchange) SDK with TypeScript support

## Installation

```bash
npm i changenow-io-sdk
```

## Usage

### Initial

```js
import { createChangeNowSDK } from 'changenow-io-sdk'

const changeNowSDK = createChangeNowSDK('[API_KEY]')
```

### Execute

```js
changeNowSDK.v2.listOfAvailableCurrencies1() // or another methods
```

## API Coverage

This SDK provides comprehensive coverage of the ChangeNow API with **37 endpoints**:

- **V1 API** (15 endpoints): Core exchange functionality, currency management, transaction handling
- **V2 API** (22 endpoints): Enhanced features, fiat integration, network management, address validation

### Key Features

✅ **Multi-network support** - Bitcoin, Ethereum, BSC, Polygon, and more  
✅ **Fiat integration** - Fiat-to-crypto and crypto-to-fiat exchanges  
✅ **Fixed-rate exchanges** - Guaranteed exchange rates  
✅ **Address validation** - Validate wallet addresses before transactions  
✅ **Exchange actions** - Continue, refund, and manage pending transactions  
✅ **Network fees** - Calculate blockchain transaction fees  
✅ **Modern TypeScript** - Full type safety and IntelliSense support

## Keeping the SDK Updated

To check if your SDK version is up-to-date:

```bash
npm run check-updates
```

For detailed update instructions, see [UPDATE_GUIDE.md](./UPDATE_GUIDE.md).

## Development

### Generate Client from Schema

```bash
npm run generate-client
```

### Build

```bash
npm run build
```

### Check for Updates

```bash
npm run check-updates
```
