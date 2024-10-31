import path from 'path';
import { fileURLToPath } from 'url';

export const CONFIG = {
  port: process.env.PORT || 3000,
  dirname: path.dirname(fileURLToPath(import.meta.url)),
  environment: process.env.NODE_ENV || 'development',
  flags: {
    VERSION_ONE: {
      key: 'versionone',
      value: process.env.VERSION_ONE_FLAG || 'false',
    },
  },
};
