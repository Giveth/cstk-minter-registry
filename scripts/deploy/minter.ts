import { ethers, network } from 'hardhat';
import { log } from '../utils/logging';
import dotenv from 'dotenv';
import { getDefaultConstructionParams } from './minter.config';
import { confirmOK } from '../utils/prompt';
import { Minter } from '../../typechain-types';

const { formatEther } = ethers.utils;

const pretty = (obj: any) => JSON.stringify(obj, null, 4);

const mustMatch = (name: string, expected: string, actual: string) => {
  log.info(`Checking ${name}`);
  if (expected !== actual) {
    throw Error(`Expected ${name} value ${expected}, got ${actual}`);
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

  await promptForConfirmation();

  log.info('\n');
  log.info('Started deployment of Minter');
  log.info('============================\n');

  const minterFactory = await ethers.getContractFactory('Minter');
  const minter = (await minterFactory
    .connect(deployer)
    .deploy(params.authorizedKeys, params.dao, params.registry, params.cstkToken)) as Minter;
  const { deployTransaction } = minter;

  log.info(`Deployment tx hash: ${deployTransaction.hash}`);

  log.info('\n');
  log.info('Waiting for confirmations..');

  if (network.name !== 'hardhat') await deployTransaction.wait();

  log.info('\n');
  log.info('Deployment OK');
  log.info('\n');

  log.info('==============================================');
  log.info('Minter deployed to:');
  log.info(`===>  ${minter.address}`);
  log.info('==============================================');

  log.info('\n');
  log.info('Checking deployed contract state:');
  log.info('=================================');

  mustMatch('DAO address', params.dao, await minter.dao());
  mustMatch('CSTK token address', params.cstkToken, await minter.dao());
  mustMatch('Registry address', params.registry, await minter.registry());

  log.info('\n');
  log.info('All checks passed, GM!!');
};

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
