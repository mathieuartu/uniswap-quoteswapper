import UniswapQuoteSwapper from '../../entities/uniswap-quoteswapper'

const arbitraryWallet = {
    address: '0x9f0F3809515628EF90216e1b989C160c25FfB5ef',
    privateKey: '0xe819dc6d391491e22f84f78f6f03da2f88f65b99ecad4a0bc726d006c9f49554',
}

const emptyConfig = {
    rpcEndpointUrl: '',
    wallet: {
        address: '',
        privateKey: '',
    },
}

const correctConfig = {
    rpcEndpointUrl: 'https://eth.rpc.blxrbdn.com',
    wallet: arbitraryWallet,
}

describe('UniswapQuoteSwapper', () => {
    describe('constructor', () => {
        it('Should throw an error when the arguments are empty', () => {
            expect(() => new UniswapQuoteSwapper(emptyConfig)).toThrow()
        })
        it('Should not throw an error when the arguments are correct', () => {
            expect(() => new UniswapQuoteSwapper(correctConfig)).not.toThrow()
        })

        it('Should throw an error when the arguments are not in the expected format', () => {
            expect(
                () =>
                    new UniswapQuoteSwapper({
                        ...correctConfig,
                        wallet: {
                            ...arbitraryWallet,
                            privateKey: 'nothing',
                        },
                    })
            ).toThrow()
        })
    })

    const uqs = new UniswapQuoteSwapper(correctConfig)

    describe('getQuote', () => {
        it('should return a quote when params are correct', async () => {
            const quoteParams = {
                from: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amount: 100,
                slippage: 0.01,
            }

            await expect(uqs.getQuote(quoteParams)).resolves.toHaveProperty('amountOutReadable')
        })
        it('should throw with incorrect params', async () => {
            const quoteParams = {
                from: '',
                to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amount: 100,
                slippage: 0.01,
            }

            await expect(uqs.getQuote(quoteParams)).rejects.toThrow()
        })
    })

    describe('approveTokenSpending', () => {
        it('should return a hash if succesful', async () => {
            await expect(
                uqs.approveTokenSpending({ tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' })
            ).resolves.toBeTruthy()
        })
    })

    describe('swapQuote', () => {
        it('should return a hash if succesful', async () => {
            const quote = await uqs.getQuote({
                from: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amount: 100,
                slippage: 0.01,
            })
            await expect(uqs.swapQuote(quote)).resolves.toBeTruthy()
        })
    })
})
