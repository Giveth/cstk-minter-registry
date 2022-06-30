import { MockProvider } from 'ethereum-waffle';
import { Wallet } from 'ethers';

// User indexes:
export const WALLET_USER_INDEXES = {
  OWNER: 0,
  TOKEN_MANAGER: 1,
  ADMIN_FIRST: 2,
  ADMIN_SECOND: 3,
  ADMIN_THIRD: 4,
  ADMIN_FOURTH: 5,
  MEMEBER_FIRST: 6,
  MEMEBER_SECOND: 7,
  PENDING_MEMBER_FIRST: 8,
  PENDING_MEMBER_SECOND: 9,
  DRAIN_VAULT_RECEIVER: 0,
  ESCAPE_HATCH_CALLER: 0,
  ESCAPE_HATCH_DESTINATION: 0,
  OTHER: 10,
};

export class ActorFixture {
  wallets: Wallet[];
  provider: MockProvider;

  constructor(wallets: Wallet[], provider: MockProvider) {
    (this.wallets = wallets), (this.provider = provider);
  }

  owner() {
    return this._getActor(WALLET_USER_INDEXES.OWNER);
  }

  tokenManager() {
    return this._getActor(WALLET_USER_INDEXES.TOKEN_MANAGER);
  }

  deployer() {
    return this.owner();
  }

  adminFirst() {
    return this._getActor(WALLET_USER_INDEXES.ADMIN_FIRST);
  }

  adminSecond() {
    return this._getActor(WALLET_USER_INDEXES.ADMIN_SECOND);
  }

  adminThird() {
    return this._getActor(WALLET_USER_INDEXES.ADMIN_THIRD);
  }

  adminFourth() {
    return this._getActor(WALLET_USER_INDEXES.ADMIN_FOURTH);
  }

  contributorFirst() {
    return this._getActor(WALLET_USER_INDEXES.MEMEBER_FIRST);
  }

  contributorSecond() {
    return this._getActor(WALLET_USER_INDEXES.MEMEBER_SECOND);
  }

  contributors() {
    return [this.contributorFirst(), this.contributorSecond()];
  }

  pendingContributorFirst() {
    return this._getActor(WALLET_USER_INDEXES.PENDING_MEMBER_FIRST);
  }

  pendingContributorSecond() {
    return this._getActor(WALLET_USER_INDEXES.PENDING_MEMBER_SECOND);
  }

  pendingContributors() {
    return [this.pendingContributorFirst(), this.pendingContributorSecond()];
  }

  drainVaultReceiver() {
    return this._getActor(WALLET_USER_INDEXES.DRAIN_VAULT_RECEIVER);
  }

  escapeHatchCaller() {
    return this._getActor(WALLET_USER_INDEXES.ESCAPE_HATCH_CALLER);
  }

  escapeHatchDestination() {
    return this._getActor(WALLET_USER_INDEXES.ESCAPE_HATCH_DESTINATION);
  }

  other() {
    return this._getActor(WALLET_USER_INDEXES.OTHER);
  }

  anyone() {
    return this.other();
  }

  others(cnt: number) {
    if (cnt < 0) {
      throw new Error(`Invalid cnt: ${cnt}`);
    }
    return this.wallets.slice(WALLET_USER_INDEXES.OTHER, WALLET_USER_INDEXES.OTHER + cnt);
  }

  // Actual logic of fetching the wallet
  private _getActor(index: number): Wallet {
    if (index < 0) {
      throw new Error(`Invalid index: ${index}`);
    }
    const account = this.wallets[index];
    if (!account) {
      throw new Error(`Account ID ${index} could not be loaded`);
    }
    return account;
  }
}
