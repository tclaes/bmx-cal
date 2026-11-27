import { writeSessions } from '../scripts/test-env/login';

// Fresh sessions for every run, so expired tokens never break the suite.
export default async function globalSetup() {
  await writeSessions();
}
