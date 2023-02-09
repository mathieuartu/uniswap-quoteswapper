import { computePoolAddress, FACTORY_ADDRESS, FeeAmount, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk'
import { Token, TradeType, CurrencyAmount } from '@uniswap/sdk-core'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import ISwapRouterABI from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json'
import { AbiCoder, ethers, JsonRpcProvider, Wallet } from 'ethers'
import JSBI from 'jsbi'
import { uniswapContractAddresses, ERC20_ABI } from '../config'

export type UniswapGetQuoteResponse = Awaited<ReturnType<UniswapQuoteSwapper['getQuote']>>

export default class UniswapQuoteSwapper {
    private rpcEndpointUrl: string
    private wallet: {
        address: string
        privateKey: string
    }

    private provider: JsonRpcProvider
    private signer: Wallet
    private chainId: number

    constructor({
        rpcEndpointUrl,
        wallet,
        chainId = 1,
    }: {
        rpcEndpointUrl: string
        chainId?: number
        wallet: {
            address: string
            privateKey: string
        }
    }) {
        this.rpcEndpointUrl = rpcEndpointUrl
        this.wallet = wallet
        this.chainId = chainId

        this.provider = new JsonRpcProvider(this.rpcEndpointUrl)
        this.signer = new Wallet(this.wallet.privateKey, this.provider)
    }

    private async getTokenInfo(tokenAddress: string) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const decimals = (await tokenContract.decimals()).toString()

        return { decimals }
    }

    private async getPoolInfo({ tokenA, tokenB }: { tokenA: Token; tokenB: Token }) {
        const poolAddress = computePoolAddress({
            factoryAddress: FACTORY_ADDRESS,
            tokenA,
            tokenB,
            fee: FeeAmount.MEDIUM,
        })

        const contract = new ethers.Contract(poolAddress, IUniswapV3PoolABI.abi, this.provider)

        const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
            contract.token0(),
            contract.token1(),
            contract.fee(),
            contract.tickSpacing(),
            contract.liquidity(),
            contract.slot0(),
        ])

        const poolInfo = {
            token0,
            token1,
            fee,
            tickSpacing,
            liquidity,
            sqrtPriceX96: slot0[0],
            tick: slot0[1],
            poolAddress,
        }

        return poolInfo
    }

    public async approveTokenSpending({ tokenAddress }: { tokenAddress: string }): Promise<string> {
        const provider = this.provider
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

        const connectedContract = tokenContract.connect(this.signer) as unknown as {
            approve: (a: string, b: string) => Promise<{ hash: string }>
        }
        const send = await connectedContract.approve(uniswapContractAddresses.router.v2, '100000000000000000000')

        return send.hash
    }

    public async getQuote({
        from,
        to,
        amount,
        slippage,
    }: {
        slippage: number
        from: string
        to: string
        amount: number
    }) {
        const [fromToken, toToken] = await Promise.all([this.getTokenInfo(from), this.getTokenInfo(to)])

        const tokenA = new Token(this.chainId, from, parseInt(fromToken.decimals))
        const tokenB = new Token(this.chainId, to, parseInt(toToken.decimals))

        const amountIn = Math.floor(amount * Math.pow(10, fromToken.decimals))
        const amountInReadable = amount

        const poolInfo = await this.getPoolInfo({ tokenA, tokenB })

        const pool = new Pool(
            tokenA,
            tokenB,
            parseInt(poolInfo.fee.toString()),
            poolInfo.sqrtPriceX96.toString(),
            poolInfo.liquidity.toString(),
            parseInt(poolInfo.tick.toString())
        )

        const swapRoute = new Route([pool], tokenA, tokenB)

        const { calldata } = SwapQuoter.quoteCallParameters(
            swapRoute,
            CurrencyAmount.fromRawAmount(tokenA, amountIn),
            TradeType.EXACT_INPUT,
            {
                useQuoterV2: true,
            }
        )

        const quoteCallReturnData = await this.provider.call({
            to: uniswapContractAddresses.quoter.v2,
            data: calldata,
        })

        const amountOut = AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData)
        const amountOutReadable = parseInt(amountOut.toString()) / Math.pow(10, toToken.decimals)
        const amountOutWithSlippage = JSBI.BigInt(
            Math.floor(parseInt(amountOut.toString()) - parseInt(amountOut.toString()) * slippage)
        ).toString()
        const amountOutWithSlippageReadable = parseInt(amountOutWithSlippage) / Math.pow(10, toToken.decimals)

        return {
            tokenA,
            tokenB,
            amountIn: amountIn.toString(),
            amountInReadable,
            amountOut: amountOut.toString(),
            amountOutReadable,
            amountOutWithSlippage,
            amountOutWithSlippageReadable,
            poolInfo,
            fee: poolInfo.fee,
        }
    }

    public async swapQuote(quote: Awaited<ReturnType<UniswapQuoteSwapper['getQuote']>>) {
        const { amountIn, tokenA, tokenB, fee, amountOutWithSlippage } = quote
        const swapRouterAddress = uniswapContractAddresses.router.v2

        const swapRouterContract = new ethers.Contract(swapRouterAddress, ISwapRouterABI.abi, this.provider)

        const params = {
            tokenIn: tokenA.address,
            tokenOut: tokenB.address,
            fee,
            recipient: this.wallet.address,
            deadline: Math.floor(Date.now() / 1000) + 60000,
            amountIn,
            amountOutMinimum: amountOutWithSlippage,
            sqrtPriceLimitX96: 0,
        }

        const connectedContract = swapRouterContract.connect(this.signer) as unknown as {
            exactInputSingle: (a: typeof params, b: { gasLimit: string }) => Promise<{ hash: string }>
        }

        const transaction = await connectedContract.exactInputSingle(params, {
            gasLimit: '1000000',
        })

        return transaction.hash
    }
}
