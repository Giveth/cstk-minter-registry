import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { MinterTypes } from '../../types/contracts/Minter';

const { AddressZero } = ethers.constants;
const { isAddress } = ethers.utils;

export const DEFAULT_PARAMS: MinterTypes.ConstructionParams = {
  authorizedKeys: ['0x839395e20bbB182fa440d08F850E6c7A8f6F0780', '0xa32aECda752cF4EF89956e83d60C04835d4FA867'],
  cstkToken: '0xc4fbe68522ba81a28879763c3ee33e08b13c499e',
  dao: '0xa18effbceb3b6bfd914bac1c08103fc93b5d4b45',
  registry: '0x28512FB7681c8615aef25a8EF3bcb90aFAC502cB',
};

export type MinterRatio = {
  numerator: BigNumber;
  denominator: BigNumber;
};
export const DEFAULT_RATIO = {
  numerator: BigNumber.from('5'),
  denominator: BigNumber.from('2000000000000000000'),
};

export const DEFAULT_OWNER: string = '0x839395e20bbB182fa440d08F850E6c7A8f6F0780';

const checkAddress = (addr) => isAddress(addr) && addr !== AddressZero;

export const checkConstructionParams = (p: MinterTypes.ConstructionParams) => {
  if (p.authorizedKeys.length === 0) {
    throw new Error('Must input authorized keys');
  }
  for (const ak of p.authorizedKeys) {
    if (!checkAddress(ak)) {
      throw new Error(`Authorized key ${ak} invalid`);
    }
  }
  if (!checkAddress(p.cstkToken)) {
    throw new Error('CSTK token address invalid');
  }
  if (!checkAddress(p.dao)) {
    throw new Error('DAO address invalid');
  }
  if (!checkAddress(p.registry)) {
    throw new Error('Registry address invalid');
  }
};

export const checkRatio = (ratio: MinterRatio) => {
  if (!ratio.numerator.gt('0')) {
    throw new Error('Invalid numerator');
  }
  if (!ratio.denominator.gt('0')) {
    throw new Error('Invalid denominator');
  }
};

export const getDefaultConstructionParams = () => {
  checkConstructionParams(DEFAULT_PARAMS);
  return DEFAULT_PARAMS;
};

export const getDefaultOwner = () => {
  checkAddress(DEFAULT_OWNER);
  return DEFAULT_OWNER;
};

export const getDefaultRatio = () => {
  checkRatio(DEFAULT_RATIO);
  return DEFAULT_RATIO;
};
