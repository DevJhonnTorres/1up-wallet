Optimize and refactor the wallet creation and authentication flow using best practices only.

Requirements (non-negotiable):
	1.	Authentication methods
	•	Email-based login (passwordless).
	•	Passkeys (WebAuthn).
	•	External wallet connections (EVM wallets such as MetaMask, Rabby, WalletConnect).
	2.	Wallet architecture
	•	Support embedded wallets for users who sign up via email or passkeys.
	•	Support connected wallets for users who prefer self-custody.
	•	Clean separation of state between embedded wallets and externally connected wallets.
	3.	Sponsorship / gas
	•	Assume wallet sponsorship is NOT available with the current Privy-based implementation.
	•	Design the flow so it works without gas sponsorship.
	•	Do not rely on sponsored transactions or assumptions that require Privy paymaster support.
	4.	Implementation standards
	•	Follow current security and UX best practices.
	•	Minimal, composable, and maintainable code.
	•	No experimental or unstable patterns.
	•	Clear error handling and predictable wallet state.
	5.	Scope
	•	Do not add new auth methods beyond the three listed.
	•	Do not redesign the product UI unless required for correctness.
	•	Focus strictly on correctness, optimization, and long-term maintainability.

Deliver a production-ready solution.
