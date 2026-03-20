import { getBoss } from "../lib/jobs";

async function main() {
  await getBoss();
  // Keep worker alive as a long-running process in monolithic deploy mode.
  console.log("Ghost Labor worker started.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
