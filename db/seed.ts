import { getDb } from "../api/queries/connection";
// TODO: import tables from "./schema"

async function seed() {
  // unused until real seed data is written below (see TODOs); getDb() is the intended entry
  // point, kept as scaffolding.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const db = getDb();
  console.log("Seeding database...");

  // TODO: insert seed data, e.g.
  // await db.insert(schema.posts).values([
  //   { title: "First post", content: "Hello world" },
  // ]);

  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed();
