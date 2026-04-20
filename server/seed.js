const fs = require("fs");
const readline = require("readline");
const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
);

async function seed() {
  const session = driver.session();

  const rl = readline.createInterface({
    input: fs.createReadStream("data/facebook_combined.txt"),
    crlfDelay: Infinity,
  });

  const batchSize = 1000;
  let batch = [];

  for await (const line of rl) {
    const [a, b] = line.split(" ");

    batch.push({ a, b });

    if (batch.length >= batchSize) {
      await session.run(
        `
        UNWIND $batch AS row
        MERGE (u1:User {userId: row.a})
        MERGE (u2:User {userId: row.b})
        MERGE (u1)-[:FOLLOWS]->(u2)
        MERGE (u2)-[:FOLLOWS]->(u1)
        `,
        { batch },
      );

      console.log(`Inserted batch of ${batch.length}`);
      batch = [];
    }
  }

  // insert remaining
  if (batch.length > 0) {
    await session.run(
      `
      UNWIND $batch AS row
      MERGE (u1:User {userId: row.a})
      MERGE (u2:User {userId: row.b})
      MERGE (u1)-[:FOLLOWS]->(u2)
      MERGE (u2)-[:FOLLOWS]->(u1)
      `,
      { batch },
    );
  }

  console.log("Seeding complete!");
  await session.close();
  await driver.close();
}

seed();
