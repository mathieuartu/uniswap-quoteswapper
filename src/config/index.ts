export const uniswapContractAddresses = {
    quoter: {
        v1: '0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6',
        v2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
    router: {
        v2: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        v3: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    },
}

export const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address _spender, uint256 _value) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint amount)',
]
