import prompts from 'prompts';

export const confirmOK = async () =>
  prompts({
    type: 'confirm',
    name: 'ok',
    message: 'Are you sure you want to proceed?',
    initial: true,
  });
