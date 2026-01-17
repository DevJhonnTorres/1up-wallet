# Funding wallets with Apple Pay and Google Pay

export const CardOnrampMainnetOnly = () => <Warning>
    Card and fiat on-ramp purchases are supported on mainnets only. On testnets (e.g. Polygon Amoy,
    Sepolia), on-ramps cannot purchase testnet tokens, so this flow will not be shown or will fail.
  </Warning>;

Privy makes it easy to allow your users to fund their embedded wallets with convenient payment methods like Apple Pay and Google Pay via `@privy-io/expo` and on the web through `@privy-io/react-auth`.

This guide will walk you through setting up Privy's funding flows, allowing your users to fund their wallets quickly and easily in under two minutes.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8618b999fb1d2f574e78d2710c196ffd" alt="card-based-funding" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/card-based-funding.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=42ed6f4ea44caa3ee9bfa2c74a9aaf7a 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=36fd0fb3832e66ce9691b4340a62b4fc 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=25b7d28cb776c85fceb703b3afc8a0e1 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=98b27a3b139fc6810454bdd5f90ff940 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e3770184c30dc57b847612231045f3b3 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e597b1c7834bb0338a0c15d28442756c 2500w" />

<CardOnrampMainnetOnly />

## 1. Enable debit card funding in the Dashboard

In the [Privy
Dashboard](https://dashboard.privy.io/apps?page=funding), enable **Pay with card** on the **User management > Account funding** page.

With this option enabled, if Apple Pay or Google Pay is available on your user's device, Privy will provide users the option to purchase with those methods.

Choose your desired network across EVM and Solana and set a recommended amount for users to fund. Users can update the amount manually if they choose.

## 2. Prompt the user to fund

### `@privy-io/react-auth`

Prompt the user to fund by calling `fundWallet`

<Tabs>
  <Tab title="Fund with EVM">
    | Parameter | Type                                                | Description                                                                                                                                                                                                                                                                               |
    | --------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `chain`   | [`Chain`](https://viem.sh/docs/chains/introduction) | Optional. A [`viem/chains`](https://viem.sh/docs/chains/introduction) object for the network on which users should fund their accounts. Defaults to the network you configured in the Privy Dashboard.                                                                                    |
    | `asset`   | `'native-currency' \| 'USDC' \| {erc20: string}`    | Optional. The asset you'd like the user to fund their accounts with. Set `'native-currency'` to fund with the `chain`'s native currency (e.g. ETH), `'USDC'` to fund with USDC, or a token address in the `erc20` field to fund with an arbitrary ERC20. Defaults to `'native-currency'`. |
    | `amount`  | `string`                                            | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard.                                                                                                                        |

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/react-auth';
    // Replace this with your desired network
    import {base} from 'viem/chains'
    ...
    // `fundWallet` from the useFundWallet() hook
    fundWallet('your-wallet-address-here', {
      chain: base,
      amount: '0.01' // Since no `asset` is set, defaults to 'native-currency' (ETH)
    })
    ```
  </Tab>

  <Tab title="Fund with SOL">
    | Parameter | Type            | Description                                                                                                                                                        |
    | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `cluster` | `SolanaCluster` | Optional. An object for the cluster on which users should fund their accounts. Defaults to `mainnet-beta`.                                                         |
    | `amount`  | `string`        | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard. |

    As an example, you can configure the cluster and amount to fund like so:

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/react-auth/solana';
    ...
    // `fundWallet` from the useFundWallet() hook
    const {fundWallet} = useFundWallet();
    fundWallet('your-wallet-address-here', {
      cluster: {name: 'devnet'},
      amount: '0.01', // SOL
    });
    ```
  </Tab>
</Tabs>

### `@privy-io/expo`

<Tabs>
  <Tab title="Fund with EVM">
    | Parameter | Type                                                | Description                                                                                                                                                                                                                                                                               |
    | --------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `address` | `string`                                            | The destination address to fund.                                                                                                                                                                                                                                                          |
    | `chain`   | [`Chain`](https://viem.sh/docs/chains/introduction) | Optional. A [`viem/chains`](https://viem.sh/docs/chains/introduction) object for the network on which users should fund their accounts. Defaults to the network you configured in the Privy Dashboard.                                                                                    |
    | `asset`   | `'native-currency' \| 'USDC' \| {erc20: string}`    | Optional. The asset you'd like the user to fund their accounts with. Set `'native-currency'` to fund with the `chain`'s native currency (e.g. ETH), `'USDC'` to fund with USDC, or a token address in the `erc20` field to fund with an arbitrary ERC20. Defaults to `'native-currency'`. |
    | `amount`  | `string`                                            | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard.                                                                                                                        |

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/expo/ui';
    // Replace this with your desired network
    import {base} from 'viem/chains'
    ...
    // `fundWallet` from the useFundWallet() hook
    fundWallet({
      address: '0x2F3eb40872143b77D54a6f6e7Cc120464C764c09',
      asset: "USDC",
      chain: base,
      amount: '1'
    })
    ```
  </Tab>

  <Tab title="Fund with SOL">
    | Parameter | Type            | Description                                                                                                                                                        |
    | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `cluster` | `SolanaCluster` | Optional. An object for the cluster on which users should fund their accounts. Defaults to `mainnet-beta`.                                                         |
    | `amount`  | `string`        | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard. |

    As an example, you can configure the cluster and amount to fund like so:

    ```tsx  theme={"system"}
    import {useFundSolanaWallet} from '@privy-io/expo/ui';
    ...
    // `fundWallet` from the useFundSolanaWallet() hook
    const {fundWallet} = useFundSolanaWallet();
    fundWallet({
      address: 'address'
      amount: '0.01', // SOL
    });
    ```
  </Tab>
</Tabs>

## Resources

<CardGroup cols={1}>
  <Card title="Funding starter template" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-next-funding" arrow>
    Complete starter repository showcasing Privy's funding hooks and wallet funding flows.
  </Card>
</CardGroup>

## All set!

Users can now fund their wallets with Apple Pay and Google Pay natively within the application.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.privy.io/llms.txt


# Configuring funding methods

To enable various funding flows for your users, visit the and select your app from the **App Dropdown** in the sidebar. Then, navigate to the [Account Funding](https://dashboard.privy.io/apps?page=funding) page for your selected app.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=05f3b82931eb42e2f75df17f1e7c3eb6" alt="Fundingupdate PNG" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/funding/config-funding.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=737f2440881b2f0a60b4cf2dfb62cca2 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fd4ecc46ce52e27aa5c427642fe0f1cf 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c58720c8c97d4372cf166ad74d9b6642 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=755f499baa5c783e2045d0338d449615 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=20b7e0ddafaf0dcbe0bade9b2bb1ea9b 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f2ec010e91b359103bb2f91d1ec1925d 2500w" />

## Enable funding methods

<Tip>
  Set up Privy UIs in your app with [this guide](/authentication/user-authentication/ui-component),
  as they are required to be integrated in your app for Privy's funding flows.
</Tip>

To enable funding in your app, select which funding methods you would like to allow by selecting the corresponding option in the Dashboard.

Privy will present the options you enable here for your users to select from during a funding flow.

<Info>
  We are actively working on bringing **Transfer from external wallet** to React Native, but this is
  currently **not** yet supported. Enabling this method on your dashboard will not provide this
  option to users.
</Info>

## Set a default chain and amount

Once you have selected your funding methods, you can select the chain your users will use. When EVM is selected you'll need to select a **default network**. Both for EVM or Solana you'll need an **amount** that users should fund their wallets with. Users can update the amount manually if they choose, before confirming.

During funding flows, Privy will prompt users to fund their wallets with the **native currency of your default chain** (e.g. ETH on Ethereum Mainnet, POL on Polygon, SOL on Solana) with the funding amount you specify here.

<Tip>
  You can also prompt users to fund their wallets with USDC or other ERC20 tokens by setting a
  funding asset [in code](/wallets/funding/prompting-users-to-fund/evm).
</Tip>

You can always change these values in the Dashboard later or even override them in your app's code.

## \[For bank transfer method] Set provider API keys

If using the bank transfer funding method, you will be prompted to set your onramp provider API keys in the Dashboard. For Bridge, you can request API access through [Bridge's website](https://bridge.xyz/).

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7c9bc691f29634777c9872ef445f4171" alt="Bridge keys PNG" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/funding/bridge.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=5b27b846917b54e8d9a7a6b613569254 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b8a2422a32657b4c4d8916a505c4d185 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8b66c0759e37e2f07c53b9aaba0fd8a8 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9e6aaceddf39709593c9ebdc31ae089e 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c6e1a4d515b6b42c225ae4180faa48fb 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ae4da1651e414b3442ffc62de529306f 2500w" />


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.privy.io/llms.txt