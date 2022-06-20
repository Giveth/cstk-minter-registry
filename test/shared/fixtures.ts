import { BigNumberish } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { Fixture } from 'ethereum-waffle';

import {
  AdminRoleMock,
  Registry,
  AdminRoleMock__factory,
  TestERC20__factory,
  TestMintable__factory,
  Registry__factory,
  IERC20,
  TestNoopMinter__factory,
  IMintable,
  IMinter,
} from '../../typechain-types';

import { ActorFixture } from './actors';
import { provider } from './provider';
import { toAddr } from './toAddr';

const { parseEther } = ethers.utils;

const { abi: RegistryABI, bytecode: RegistryBytecode } = Registry__factory;
const { abi: AdminRoleMockABI, bytecode: AdminRoleMockBytecode } = AdminRoleMock__factory;
const { abi: TestMintableABI, bytecode: TestMintableBytecode } = TestMintable__factory;
const { abi: TestERC20ABI, bytecode: TestERC20Bytecode } = TestERC20__factory;
const { abi: TestMinterABI, bytecode: TestMinterBytecode } = TestNoopMinter__factory;

export type AdminRoleMockFixture = {
  adminRole: AdminRoleMock;
  admins: string[];
};

export const adminRoleMockFixture: Fixture<AdminRoleMockFixture> = async ([wallet]) => {
  const actors = new ActorFixture(provider.getWallets(), provider);
  const admins = [actors.adminFirst().address, actors.adminSecond().address];
  const adminRole = (await waffle.deployContract(
    wallet,
    {
      bytecode: AdminRoleMockBytecode,
      abi: AdminRoleMockABI,
    },
    [admins]
  )) as AdminRoleMock;

  return {
    adminRole,
    admins,
  };
};

export type TokenFixture = {
  token: IERC20;
  params: {
    amountToMint: BigNumberish;
  };
  state: {
    totalSupply: BigNumberish;
  };
};

export const tokenFixture: Fixture<TokenFixture> = async ([wallet]) => {
  const amountToMint = parseEther('100000000'); // 100B
  const token = (await waffle.deployContract(
    wallet,
    {
      bytecode: TestERC20Bytecode,
      abi: TestERC20ABI,
    },
    [amountToMint]
  )) as IERC20;

  return {
    token,
    params: {
      amountToMint,
    },
    state: {
      totalSupply: amountToMint,
    },
  };
};

export type RegistryContributor = {
  address: string;
  maxTrust: BigNumberish;
  pendingBalance: BigNumberish;
};

export type RegistryFixture = {
  registry: Registry;
  token: IERC20;
  params: {
    admins: string[];
    cstkTokenAddress: string;
  };
  state: {
    pendingContributors: RegistryContributor[];
    contributors: RegistryContributor[];
    everyone: RegistryContributor[];
  };
};

export const registryFixture: Fixture<RegistryFixture> = async ([wallet]) => {
  const registerContributors = async (_contributors: RegistryContributor[], _registry: Registry) => {
    await _registry.registerContributors(
      _contributors.length,
      _contributors.map((c) => c.address),
      _contributors.map((c) => c.maxTrust),
      _contributors.map((c) => c.pendingBalance)
    );
  };
  const actors = new ActorFixture(provider.getWallets(), provider);
  const admins = [actors.adminFirst().address, actors.adminSecond().address];

  const { token } = await tokenFixture([wallet], provider);

  const registry = (await waffle.deployContract(
    wallet,
    {
      bytecode: RegistryBytecode,
      abi: RegistryABI,
    },
    [admins, token.address]
  )) as Registry;

  const contributors = <RegistryContributor[]>[
    {
      address: toAddr(actors.contributorFirst()),
      maxTrust: '1000',
      pendingBalance: '0',
    },
    {
      address: toAddr(actors.contributorSecond()),
      maxTrust: '2000',
      pendingBalance: '0',
    },
  ];
  await registerContributors(contributors, registry);

  const pendingContributors = <RegistryContributor[]>[
    {
      address: toAddr(actors.pendingContributorFirst()),
      maxTrust: '1000',
      pendingBalance: '1000',
    },
    {
      address: toAddr(actors.pendingContributorSecond()),
      maxTrust: '2000',
      pendingBalance: '2000',
    },
  ];
  await registerContributors(pendingContributors, registry);

  const everyone = contributors.concat(pendingContributors);

  return {
    registry,
    token,
    params: {
      admins,
      cstkTokenAddress: token.address,
    },
    state: {
      contributors,
      pendingContributors,
      everyone,
    },
  };
};

export type MinterFixture = {
  minter: IMinter;
  token: IERC20;
  dao: IMintable;
  params: {
    authorizedKeys: string[];
    daoAddress: string;
    registryAddress: string;
    cstkTokenAddress: string;
  };
  state: {
    numerator: BigNumberish;
    denominator: BigNumberish;
  };
};

export const minterFixture: Fixture<MinterFixture> = async ([wallet]) => {
  const actors = new ActorFixture(provider.getWallets(), provider);
  const admins = [actors.adminFirst().address, actors.adminSecond().address];

  const { registry, token } = await registryFixture([wallet], provider);

  const dao = (await waffle.deployContract(wallet, {
    abi: TestMintableABI,
    bytecode: TestMintableBytecode,
  })) as IMintable;

  const minter = (await waffle.deployContract(
    wallet,
    {
      abi: TestMinterABI,
      bytecode: TestMinterBytecode,
    },
    [admins, dao.address, registry.address, token.address]
  )) as IMinter;

  const numerator = 500;
  const denominator = 1000;
  await minter.setRatio(numerator, denominator);

  return {
    minter,
    token,
    dao,
    params: {
      authorizedKeys: admins,
      daoAddress: dao.address,
      registryAddress: registry.address,
      cstkTokenAddress: token.address,
    },
    state: {
      numerator,
      denominator,
    },
  };
};
