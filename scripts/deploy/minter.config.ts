import { ethers } from 'hardhat';
import { MinterTypes } from '../../types/contracts/Minter';

const { AddressZero } = ethers.constants;
const { isAddress } = ethers.utils;

export const DEFAULT_PARAMS: MinterTypes.ConstructionParams = {
  authorizedKeys: ['0x124aC43ae00D344e5344Bb22E1e20C66C37DcC6D', '0x7820B1D973980E29Ef3557aAe98e1c5736C9F29B'],
  cstkToken: '0x9a567eE4905C75D12a955869C3c15675ebB44A77',
  dao: '0x46f7DF452D7e57F3cED7E9B0E98F3cc9a6903d3F',
  registry: '0xc83Cdf1e73F0C4db76A47024AaB40b6E39bFb7EB',
};

export const OWNER: string = '0x175039a57b0289F45dCF1A182520707f7B35f342';

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

export const getDefaultOwner = () => {
  checkAddress(OWNER);
  return OWNER;
};
