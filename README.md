# Membership Dapp contracts

Here are the contracts for the membership dapp.

## Setting up

You may create a `.env` file in the project root by copying `.env.example`.

You *should* set the `INFURA_API_KEY` env variable to a valid Infura API key.

## Compiling the code

Run `yarn compile` to compile contracts using Hardhat 👷

## Testing and auditing

### Local tests

Run `yarn test` to run the full test suite.

### Coverage report

Run `yarn coverage` to generate a code coverage report using `hardhat coverage`

### Contract sizes

Run `yarn size-contracts` to compute the size of each compiled contract.

## Deploying

Before deploying, you **MUST** set the `DEPLOYER_PRIVATE_KEY` to the private key of the account you want to deploy from.

Please make sure to confirm all parameters before confirming via interactive prompt!

You can deploy to the appropriate network by running the `yarn deploy:<contract>:<network>` command.

Available contracts;
- `minter`

Available networks:
- `void` - dry run against a local Hardhat instance
- `goerli` - testnet
- `gnosis` - mainnet on Gnosis chain
