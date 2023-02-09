# 🦄 UniswapQuoteSwapper

![Unit tests](https://github.com/mathieuartu/uniswap-quoteswapper/actions/workflows/unit-test.yml/badge.svg)
![Lint](https://github.com/mathieuartu/uniswap-quoteswapper/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/mathieuartu/uniswap-quoteswapper/actions/workflows/build.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/uniswap-quoteswapper/latest.svg)](https://www.npmjs.com/package/uniswap-quoteswapper/v/latest)
[![npm bundle size (scoped version)](https://img.shields.io/bundlephobia/minzip/uniswap-quoteswapper/latest.svg)](https://bundlephobia.com/result?p=uniswap-quoteswapper@latest)

A simple class to get swap estimates and execute trades on UniSwap programmaticaly

## Installation

```
npm i uniswap-quoteswapper
```

## Usage

```typescript
import UniswapQuoteSwapper from 'uniswap-quoteswapper'

const uqs = new UniswapQuoteSwapper({
    rpcEndpointUrl: 'RPC_ENDPOINT_URL',
    wallet: {
        address: 'YOUR_PUBLIC_ADDRESS',
        privateKey: 'YOUR_PRIVATE_KEY',
    },
})(async () => {
    const quote = await uqs.getQuote({
        from: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amount: 100,
        slippage: 0.01,
    })
    // quote = { amountOutReadable: 0.0023, ... }
    const approveTxHash = await uqs.approveTokenSpending({ tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' })
    const swapTxHash = await uqs.swapQuote(quote)
})()
```

UniswapQuoteSwapper needs two things to work :

-   Public or private JSON-RPC url
-   Your public and private key in order to sign the transactions
