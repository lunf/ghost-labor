import { bootstrapAppData } from "../lib/bootstrap";

async function main() {
  await bootstrapAppData();
}

main()
  .then(() => {
    console.log("Seed complete");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
