import { getBoss } from "../lib/jobs";

async function main() {
  await getBoss();
  // Keep worker alive as a long-running process in monolithic deploy mode.
  // eslint-disable-next-line no-console
  console.log("Ghost Labor worker started.");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
