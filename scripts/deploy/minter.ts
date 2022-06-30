import { ethers, network } from 'hardhat';
import { log } from '../utils/logging';
import dotenv from 'dotenv';
import { getDefaultConstructionParams, getDefaultOwner, getDefaultRatio, MinterRatio } from './minter.config';
import { confirmOK } from '../utils/prompt';
import { Minter } from '../../typechain-types';

const { formatEther, getAddress } = ethers.utils;

const pretty = (obj: any) => JSON.stringify(obj, null, 4);

const mustAuthorizedKey = async (minter: Minter, account: string) => {
  log.info(`Checking if '${account}' is an authorized key...`);
  if (!(await minter.isAdmin(account))) {
    throw Error(`Expected ${account} to be set as an authorized key`);
  }
};

const mustMatchAddress = (name: string, expected: string, actual: string) => {
  log.info(`Checking ${name} address...`);
  if (getAddress(expected) !== getAddress(actual)) {
    throw Error(`Expected ${name} value ${expected}, got ${actual}`);
  }
};

const mustMatchRatio = async (minter: Minter, expected: MinterRatio) => {
  log.info('Checking minter ratio');
  const num = await minter.numerator();
  const den = await minter.denominator();

  if (!expected.numerator.eq(num)) {
    throw Error(`Expected numerator to be eq ${expected.numerator}, got ${num}`);
  }
  if (!expected.denominator.eq(den)) {
    throw Error(`Expected denominator to be eq ${expected.denominator}, got ${den}`);
  }
};

const promptForConfirmation = async () => {
  const { ok } = await confirmOK();
  if (!ok) {
    log.info('\nOperation aborted, exiting...');
    process.exit(0);
  }
};

dotenv.config();

const main = async () => {
  const deployer = (await ethers.getSigners())[0];
  const balanceETH = await deployer.getBalance();

  const params = getDefaultConstructionParams();
  const ratio = getDefaultRatio();
  const newOwner = getDefaultOwner();

  log.info('\n');
  log.info('===============================');
  log.info('== Deploying Minter contract ==');
  log.info('===============================');
  log.info('\n');

  log.info(`Deploying to network: ${network.name}`);

  log.info(`\n`);
  log.info('Deploying from address:');
  log.info(`===> ${deployer.address}`);
  log.info(`Balance: ${formatEther(balanceETH)} ETH`);
  log.info(`\n`);

  log.info('Construction parameters:');
  log.info(pretty(params));
  log.info('\n');

  log.info('Initial ratio:');
  log.info(`numerator: ${ratio.numerator.toString()}`);
  log.info(`denominator: ${ratio.denominator.toString()}`);
  log.info('\n');

  log.info('Contract ownership will be transferred to:');
  log.info(`===> ${newOwner}`);
  log.info('\n');

  await promptForConfirmation();

  log.info('\n');
  log.info('\n');
  log.info('Started deployment of Minter');
  log.info('============================\n');

  const minterFactory = await ethers.getContractFactory('Minter');
  const minter = (await minterFactory
    .connect(deployer)
    .deploy(params.authorizedKeys, params.tokenManager, params.registry, params.token)) as Minter;
  const { deployTransaction } = minter;

  log.info(`Deployment tx hash: ${deployTransaction.hash}`);

  log.info('\n');
  log.info('Waiting for confirmations..');

  if (network.name !== 'hardhat') await deployTransaction.wait(2);

  log.info('\n');
  log.info('Deployment OK');
  log.info('\n');

  log.info('Minter deployed to:');
  log.info(`===>  ${minter.address}`);

  log.info('\n');
  log.info('Checking deployed contract state:');
  log.info('\n');

  for (const aKey of params.authorizedKeys) {
    await mustAuthorizedKey(minter, aKey);
  }

  mustMatchAddress('TokenManager', params.tokenManager, await minter.tokenManager());
  mustMatchAddress('Token', params.token, await minter.token());
  mustMatchAddress('Registry', params.registry, await minter.registry());

  log.info('\nSetting inital ratio');
  log.info('====================\n');

  const setRatioTx = await minter.setRatio(ratio.numerator, ratio.denominator);
  log.info(`Transaction hash '${setRatioTx.hash}'`);
  log.info('Waiting for confirmations...');
  if (network.name !== 'hardhat') await setRatioTx.wait(2);

  await mustMatchRatio(minter, ratio);

  log.info('\n');
  log.info('Ratio set OK');

  log.info('\nTransferring contract ownership:');
  log.info('================================');

  const transferOwnershipTx = await minter.transferOwnership(newOwner);
  log.info(`Transaction hash: ${transferOwnershipTx.hash}`);
  log.info('Waiting for confirmations...');
  if (network.name !== 'hardhat') await setRatioTx.wait(2);
  log.info('Ownership transfer complete');

  mustMatchAddress('Owner', newOwner, await minter.owner());

  log.info('\n');
  log.info('Owner set OK');

  log.info('\n');
  log.info('Deployment completed, GM!!');
};

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
