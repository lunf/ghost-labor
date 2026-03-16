import { bootstrapAppData } from "../lib/bootstrap/seed-defaults";

async function main() {
  await bootstrapAppData();
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed complete");
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
