import createLogger from 'console-log-level';

const processEnvLogLevel = (lvl: string | undefined) => {
  switch (lvl) {
    case 'info':
    case 'debug':
    case 'error':
      return lvl;
    default:
      return 'info';
  }
};

export const LOG_LEVEL = processEnvLogLevel(process.env.LOG_LEVEL);
export const log = createLogger({ level: LOG_LEVEL });
