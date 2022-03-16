import { createFixtureLoader, provider } from '../shared/provider';
import { AdminRoleMock, IERC20, Registry } from '../../typechain-types';
import { ActorFixture, tokenFixture } from '../shared';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, ContractFactory, Wallet } from 'ethers';
import { LoadFixtureFunction } from '../types';

let loadFixture: LoadFixtureFunction;

const { AddressZero } = ethers.constants;

describe('unit/Deployment', () => {
  const actors = new ActorFixture(provider.getWallets(), provider);
  let factory: ContractFactory;

  describe('AdminRole', () => {
    let deploy: (_params: Wallet[]) => Promise<Contract>;

    before(async () => {
      factory = await ethers.getContractFactory('AdminRoleMock');
      deploy = (_params: Wallet[]) => factory.connect(actors.deployer()).deploy(_params.map((p) => p.address));
    });

    it('deploys and has an address', async () => {
      const admin = (await deploy([])) as AdminRoleMock;
      expect(admin.address).to.be.a.string;
    });

    it('does not revert if deployer is in the list of admins', async () => {
      await expect(deploy([actors.deployer()])).to.not.be.reverted;
    });

    it('sets the initial state', async () => {
      const admin = (await deploy([actors.adminFirst(), actors.adminSecond()])) as AdminRoleMock;

      expect(await admin.owner()).to.be.eq(actors.owner().address);
      expect(await admin.isAdmin(actors.adminFirst().address)).to.be.true;
      expect(await admin.isAdmin(actors.adminSecond().address)).to.be.true;
    });
  });

  describe('Registry', () => {
    let cstkToken: IERC20;
    let deploy: (_admins: Wallet[], _cstkTokenAddress: string) => Promise<Contract>;

    before(async () => {
      loadFixture = createFixtureLoader(provider.getWallets(), provider);
      factory = await ethers.getContractFactory('Registry');
      deploy = (_admins: Wallet[], _cstkTokenAddress: string) =>
        factory.connect(actors.deployer()).deploy(
          _admins.map((a) => a.address),
          _cstkTokenAddress
        );
    });

    beforeEach('create fixture loader', async () => {
      const { token } = await loadFixture(tokenFixture);
      cstkToken = token;
    });

    it('deploys and has an address', async () => {
      const registry = (await deploy([], cstkToken.address)) as Registry;
      expect(registry.address).to.be.a.string;
    });
  });

  describe('Minter', () => {
    let deploy: (
      _authorizedKeys: string[],
      _daoAddress: string,
      _registryAddress: string,
      _cstkTokenAddress: string
    ) => Promise<Contract>;

    before(async () => {
      factory = await ethers.getContractFactory('Minter');
      deploy = (_authorizedKeys: string[], _daoAddress: string, _registryAddress: string, _cstkTokenAddress: string) =>
        factory.connect(actors.deployer()).deploy(_authorizedKeys, _daoAddress, _registryAddress, _cstkTokenAddress);
    });

    it('deploys and has an address', async () => {
      const minter = await deploy([], AddressZero, AddressZero, AddressZero);
      expect(minter.address).to.be.a.string;
    });
  });
});
