# ETH Cali Wallet

A secure and easy-to-use Ethereum wallet application built with Next.js and Privy for authentication. This wallet allows users to access web3 easily with **native gas sponsorship by Privy**, supporting multiple tokens across Base, Ethereum, Optimism, and Unichain networks.

## 🌟 Features

### 🔐 **Easy Authentication**
- Login with email via Privy
- Automatic embedded wallet creation
- ZKPassport personhood verification (scan QR with passport)
- Export private keys functionality

### 💰 **Multi-Token Support**
- **ETH**: Native Ethereum on Base
- **USDC**: USD Coin (Native Circle USDC)
- **EURC**: Euro Coin (Circle's EUR stablecoin)

### 🚀 **Advanced Features**
- Real-time balance fetching from multiple networks
- **Privy native gas sponsorship** for all transactions
- QR code scanning for easy address input
- Transaction history with block explorer integration
- Responsive design with dark/light mode support
- Beautiful modern UI with TailwindCSS
- **Universal transaction sponsorship** (NFTs, transfers, faucet claims)

### 🔗 **Network Support**
- **Base Mainnet** (Chain ID: 8453) - Primary network with gas sponsorship
- **Ethereum Mainnet** (Chain ID: 1) - Gas sponsorship enabled
- **Optimism** (Chain ID: 10) - Gas sponsorship enabled  
- **Unichain** (Chain ID: 130) - Gas sponsorship enabled
- BaseScan, Etherscan, and OP Mainnet explorer integration
- Real-time price data from CoinGecko

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ETHcali/eth-cali-wallet.git
   cd eth-cali-wallet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` (or `.env`) file with your configuration:
   ```env
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   ```

   **Note**: Gas sponsorship is configured through the [Privy Dashboard](https://dashboard.privy.io). Enable gas sponsorship and add credits for supported networks.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
eth-cali-wallet/
├── components/
│   ├── shared/           # Reusable UI components
│   ├── wallet/           # Wallet-specific components
│   ├── faucet/           # Faucet functionality components
│   └── sybil/           # ZKPassport verification components
├── pages/
│   ├── api/             # Backend API endpoints
│   ├── index.tsx        # Landing page + Dashboard
│   ├── wallet.tsx       # Wallet interface
│   ├── faucet.tsx       # ETH faucet for verified users
│   └── sybil.tsx        # ZKPassport sybil-resistance verification
├── hooks/               # Custom React hooks
│   ├── useTokenBalances.ts
│   └── useTokenPrices.ts
├── utils/               # Utility functions
│   ├── contracts.ts     # Smart contract interactions
│   ├── tokenUtils.ts    # Token formatting utilities
│   └── zkpassport.ts    # ZKPassport KYC integration
├── types/               # TypeScript definitions
├── frontend/            # Contract ABIs and addresses
│   ├── abis/           # Smart contract ABIs
│   └── [network]/      # Network-specific contract addresses
├── contexts/           # React contexts
├── public/             # Static assets
└── styles/             # CSS and styling
```

## 💳 Supported Tokens

| Token | Contract Address | Decimals | Network |
|-------|------------------|----------|---------|
| **ETH** | Native | 18 | Base, Ethereum, Optimism, Unichain |
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 | Base |
| **USDC** | `0xA0b86a33E6417c47A0c2c0d2d9b6B3Cf8E3B8d3C` | 6 | Optimism |
| **EURC** | `0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` | 6 | Base |
| **EURC** | `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c` | 6 | Ethereum |

**🎯 All token transfers are gas-sponsored across supported networks!**
## 📋 Application Flow

### **1. Landing & Authentication** (`/` - index.tsx)
- Clean landing page with ETH CALI branding
- One-click authentication via Privy (email, passkey, or external wallet)
- Dashboard with module navigation after login

### **2. Main Modules**

**💳 Wallet Module** (`/wallet` - wallet.tsx)
- View token balances across multiple networks
- Send ETH and USDC with gas sponsorship
- QR code scanner for easy address input
- Real-time balance updates and transaction history

**🚀 Faucet Module** (`/faucet` - faucet.tsx)  
- ETH faucet for verified users only
- Requires ZKPassport NFT ownership
- Gas-sponsored claiming process
- Admin controls for faucet management

**🔒 Sybil Verification** (`/sybil` - sybil.tsx)
- ZKPassport identity verification using passport NFC
- Mint soulbound NFT proving unique personhood
- Zero-knowledge proof generation (face match + document verification)
- Gas-sponsored NFT minting

### **3. User Journey**
1. **Connect**: User logs in with email, passkey, or wallet
2. **Verify**: Complete ZKPassport verification to prove unique identity  
3. **Mint**: Receive soulbound NFT as proof of sybil-resistance
4. **Claim**: Access ETH faucet with verified identity
5. **Transact**: Send tokens with zero gas fees across networks- **Styling**: TailwindCSS with dark mode support  
- **Authentication**: Privy (Email, Passkey, External Wallets)
- **Gas Sponsorship**: Privy Native Gas Sponsorship with TEE
- **Personhood**: ZKPassport SDK with QR scanning
- **Blockchain**: Viem, Multi-network support (Base, Ethereum, Optimism, Unichain)
- **Deployment**: Vercel

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel link
   ```

2. **Set Environment Variables** in Vercel Dashboard:
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`

**Gas Sponsorship Setup:**
- Enable gas sponsorship in [Privy Dashboard](https://dashboard.privy.io)
- Configure supported networks (Base, Ethereum, Optimism, Unichain)
- Add sponsorship credits to your account balance

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Live Demo
🌐 **[wallet.ethcali.org](https://wallet.ethcali.org)**

## 🔐 Security Features

- **TEE Execution**: Trusted Execution Environment for secure sponsorship
- **Embedded Wallets**: Secure key management via Privy
- **Universal Gas Sponsorship**: Privy's native sponsorship infrastructure
- **Multi-Network Security**: Secure transactions across multiple blockchains
- **Contract Verification**: All token contracts verified on block explorers

## 🛠️ Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub**: [https://github.com/ETHcali/eth-cali-wallet](https://github.com/ETHcali/eth-cali-wallet)
- **Live Demo**: [https://wallet.ethcali.org](https://wallet.ethcali.org)
- **ETH CALI**: [Learn more about ETH CALI](https://ethcali.org)

## 💡 About ETH CALI

This wallet is proudly sponsored by ETH CALI, making web3 accessible to everyone through gas-free transactions and easy-to-use interfaces.

---

**Built with ❤️ by the ETH CALI community** 
