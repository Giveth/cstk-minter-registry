import { ethers } from 'hardhat';
import { MinterTypes } from '../../types/contracts/Minter';

const { AddressZero } = ethers.constants;
const { isAddress } = ethers.utils;

export const DEFAULT_PARAMS: MinterTypes.ConstructionParams = {
  authorizedKeys: ['0xfD382911Be69Fc4B61D7a4542879c7f04F2347e9'],
  cstkToken: '0xfD382911Be69Fc4B61D7a4542879c7f04F2347e9',
  dao: '0xfD382911Be69Fc4B61D7a4542879c7f04F2347e9',
  registry: '0xfD382911Be69Fc4B61D7a4542879c7f04F2347e9',
};

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

export const getDefaultConstructionParams = () => {
  checkConstructionParams(DEFAULT_PARAMS);
  return DEFAULT_PARAMS;
};
