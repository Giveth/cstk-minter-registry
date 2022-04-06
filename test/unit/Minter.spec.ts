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

  describe('#pay', () => {
    let subject: (_beneficiary: Wallet | string, _sender: Wallet, _value: BigNumberish) => Promise<any>;
    let setRatio: (_nominator: BigNumberish, _denominator: BigNumberish) => Promise<any>;
    let testSent: BigNumber;
    let testMinted: BigNumber;

    before(() => {
      subject = (_beneficiary: Wallet | string, _sender: Wallet, _value: BigNumberish) =>
        context.minter
          .connect(_sender)
          .pay(typeof _beneficiary === 'string' ? _beneficiary : _beneficiary.address, { value: _value });

      setRatio = (_nominator: BigNumberish, _denominator: BigNumberish) =>
        context.minter.connect(actors.adminFirst()).setRatio(_nominator, _denominator);

      testSent = parseEther('1.0');
      testMinted = testSent.div(2);
    });

    beforeEach(async () => {
      await await setRatio('1', '2'); // Ratio 1/2
    });

    describe('works and', () => {
      it('emits a payment received event', async () => {
        await expect(subject(actors.contributorFirst(), actors.anyone(), testSent))
          .to.emit(context.minter, 'PaymentReceived')
          .withArgs(actors.contributorFirst().address, testSent);
      });

      it('emits a noop minted event', async () => {
        await expect(subject(actors.contributorFirst(), actors.anyone(), testSent))
          .to.emit(context.minter, 'NoopMinted')
          .withArgs(actors.contributorFirst().address, testMinted);
      });

      it('transfers all ETH to the collector', async () => {
        await subject(actors.contributorFirst(), actors.anyone(), testSent);
        expect(await provider.getBalance(context.state.collector)).to.be.eq(testSent);
      });
    });

    describe('fails when', () => {
      it('trying to pay 0 ETH', async () => {
        await expect(subject(actors.anyone(), actors.anyone(), '0')).to.be.reverted;
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

  describe('#changeCollector', () => {
    let subject: (_collector: Wallet | string, _sender: Wallet) => Promise<any>;

    before(() => {
      subject = (_collector: Wallet | string, _sender: Wallet) =>
        context.minter
          .connect(_sender)
          .changeCollector(typeof _collector === 'string' ? _collector : _collector.address);
    });

    describe('works and', () => {
      it('emits the collector changed event', async () => {
        await expect(subject(actors.anyone(), actors.adminFirst()))
          .to.emit(context.minter, 'CollectorChanged')
          .withArgs(actors.anyone().address, actors.adminFirst().address);
      });

      it('changes the collector', async () => {
        await subject(actors.anyone(), actors.adminFirst());
        expect(await context.minter.collector()).to.be.eq(actors.anyone().address);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(actors.anyone(), actors.anyone())).to.be.reverted;
      });

      it('trying to set zero address as collector', async () => {
        await expect(subject(AddressZero, actors.adminFirst())).to.be.reverted;
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

  describe('#changeCSTKTokenContract', () => {
    let subject: (string, _sender: Wallet) => Promise<any>;
    let check: () => Promise<string>;
    let testCSTKToken: string;

    before(() => {
      subject = (_cstkTokenContract: string, _sender: Wallet) =>
        context.minter.connect(_sender).changeCSTKTokenContract(_cstkTokenContract);

      check = context.minter.cstkToken;

      testCSTKToken = actors.anyone().address; // any address
    });

    describe('works and', () => {
      it('emits the cstk contract changed event', async () => {
        await expect(subject(testCSTKToken, actors.adminFirst()))
          .to.emit(context.minter, 'CSTKTokenContractChanged')
          .withArgs(testCSTKToken, actors.adminFirst().address);
      });

      it('changes the cstk token contract', async () => {
        await subject(testCSTKToken, actors.adminFirst());
        expect(await check()).to.be.eq(testCSTKToken);
      });
    });

    describe('fails when', () => {
      it('not called by an admin address', async () => {
        await expect(subject(testCSTKToken, actors.anyone())).to.be.reverted;
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
