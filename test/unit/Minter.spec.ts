import { expect } from 'chai';
import { BigNumber, BigNumberish, constants, utils, Wallet } from 'ethers';
import { ActorFixture, MinterFixture, createFixtureLoader, provider, minterFixture } from '../shared';
import { LoadFixtureFunction } from '../types';

const { AddressZero } = constants;
const { parseEther } = utils;

let loadFixture: LoadFixtureFunction;

describe('unit/Minter', () => {
  const actors = new ActorFixture(provider.getWallets(), provider);
  let context: MinterFixture;

  before('loader', async () => {
    loadFixture = createFixtureLoader(provider.getWallets(), provider);
  });

  beforeEach('create fixture loader', async () => {
    context = await loadFixture(minterFixture);
  });

  describe('#receive', () => {
    describe('fails when', () => {
      it('receiving ether', async () => {
        await expect(actors.anyone().sendTransaction({ to: context.minter.address, value: parseEther('1.0') })).to.be
          .reverted;
      });
    });
  });

  describe('#bridgeDonation', () => {
    let subject: (_sender: string, _amount: BigNumberish, _homeTX: string, sender: Wallet) => Promise<any>;
    const testAmount = parseEther('100');
    const testHomeTx = 'TESTTESTTESTTEST';

    before(() => {
      subject = (_sender: string, _amount: BigNumberish, _homeTX: string, sender: Wallet) =>
        context.minter.connect(sender).bridgeDonation(_sender, _amount, _homeTX);
    });

    describe('works and', () => {
      it('emits a donation bridged event', async () => {
        await expect(subject(actors.anyone().address, testAmount, testHomeTx, actors.adminFirst()))
          .to.emit(context.minter, 'DonationBridged')
          .withArgs(actors.anyone().address, testAmount, testHomeTx);
      });
    });

    describe('fails when', () => {
      it('not called by an admin', async () => {
        await expect(subject(actors.anyone().address, testAmount, testHomeTx, actors.anyone())).to.be.revertedWith(
          'AdminRole: caller does not have the Admin role'
        );
      });
    });
  });

  describe('#setRatio', async () => {
    let subject: (_numerator: BigNumberish, _denominator: BigNumberish, _sender: Wallet) => Promise<any>;
    let testNumerator: BigNumber;
    let testDenominator: BigNumber;
    let testRatio: BigNumber;

    before(() => {
      subject = (_numerator: BigNumberish, _denominator: BigNumberish | string, _sender: Wallet) =>
        context.minter.connect(_sender).setRatio(_numerator, _denominator);

      testNumerator = BigNumber.from(1);
      testDenominator = BigNumber.from(10);
      testRatio = testNumerator.div(testDenominator);
    });

    describe('works and', () => {
      it('emits the ratio changed event', async () => {
        await expect(subject(1, 10, actors.adminFirst())).to.emit(context.minter, 'RatioChanged').withArgs(1, 10);
      });

      it('changes the ratio', async () => {
        await subject(1, 10, actors.adminFirst());
        expect(await context.minter.numerator()).to.be.eq(testNumerator);
        expect(await context.minter.denominator()).to.be.eq(testDenominator);
        expect(await context.minter.ratio()).to.be.eq(testRatio);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(1, 10, actors.anyone())).to.be.reverted;
      });
    });
  });

  describe('#changeDAOContract', () => {
    let subject: (_daoContract: string, _sender: Wallet) => Promise<any>;
    let check: () => Promise<string>;
    let testDAO: string;

    before(() => {
      subject = (_daoContract: string, _sender: Wallet) =>
        context.minter.connect(_sender).changeDAOContract(_daoContract);

      check = context.minter.dao;

      testDAO = actors.anyone().address;
    });

    describe('works and', () => {
      it('emits the dao contract changed event', async () => {
        await expect(subject(testDAO, actors.adminFirst()))
          .to.emit(context.minter, 'DAOContractChanged')
          .withArgs(testDAO, actors.adminFirst().address);
      });

      it('changes the dao contract', async () => {
        await subject(testDAO, actors.adminFirst());
        expect(await check()).to.be.eq(testDAO);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(testDAO, actors.anyone())).to.be.reverted;
      });

      it('trying to set zero address as dao contract', async () => {
        await expect(subject(AddressZero, actors.adminFirst())).to.be.reverted;
      });
    });
  });

  describe('#changeTokenContract', () => {
    let subject: (string, _sender: Wallet) => Promise<any>;
    let check: () => Promise<string>;
    let testToken: string;

    before(() => {
      subject = (_tokenContract: string, _sender: Wallet) =>
        context.minter.connect(_sender).changeTokenContract(_tokenContract);

      check = context.minter.token;

      testToken = actors.anyone().address; // any address
    });

    describe('works and', () => {
      it('emits the contract changed event', async () => {
        await expect(subject(testToken, actors.adminFirst()))
          .to.emit(context.minter, 'TokenContractChanged')
          .withArgs(testToken, actors.adminFirst().address);
      });

      it('changes the token contract', async () => {
        await subject(testToken, actors.adminFirst());
        expect(await check()).to.be.eq(testToken);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(testToken, actors.anyone())).to.be.reverted;
      });

      it('trying to set zero address as the cstk token contract', async () => {
        await expect(subject(AddressZero, actors.adminFirst())).to.be.reverted;
      });
    });
  });

  describe('#changeRegistry', () => {
    let subject: (_registryContract: string, _sender: Wallet) => Promise<any>;
    let check: () => Promise<string>;
    let testRegistry: string;

    before(() => {
      subject = (_registryContract: string, _sender: Wallet) =>
        context.minter.connect(_sender).changeRegistry(_registryContract);

      check = context.minter.registry;

      testRegistry = actors.anyone().address;
    });

    describe('works and', () => {
      it('emits the registry contract changed event', async () => {
        await expect(subject(testRegistry, actors.adminFirst()))
          .to.emit(context.minter, 'RegistryContractChanged')
          .withArgs(testRegistry, actors.adminFirst().address);
      });

      it('changes the registry contract', async () => {
        await subject(testRegistry, actors.adminFirst());
        expect(await check()).to.be.eq(testRegistry);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(testRegistry, actors.anyone())).to.be.reverted;
      });

      it('trying to set zero address as the registry contract', async () => {
        await expect(subject(AddressZero, actors.adminFirst())).to.be.reverted;
      });
    });
  });
});
