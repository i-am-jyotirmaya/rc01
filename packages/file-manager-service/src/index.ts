import { env } from './config/env';
import { createServer } from './server';

const bootstrap = async (): Promise<void> => {
  try {
    const app = await createServer();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`File Manager service listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start file-manager service', error);
    process.exit(1);
  }
};

void bootstrap();
