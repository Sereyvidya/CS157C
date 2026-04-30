const fs = require("fs");
const readline = require("readline");
const driver = require("./neo4j");

const query = `
UNWIND $batch AS row

MERGE (u1:User { userId: row.a })
ON CREATE SET
  u1.username = "user" + row.a,
  u1.name = "User " + row.a,
  u1.email = "user" + row.a + "@example.com",
  u1.password = "demo123",
  u1.bio = "Hello, I am user " + row.a,
  u1.createdAt = datetime()

MERGE (u2:User { userId: row.b })
ON CREATE SET
  u2.username = "user" + row.b,
  u2.name = "User " + row.b,
  u2.email = "user" + row.b + "@example.com",
  u2.password = "demo123",
  u2.bio = "Hello, I am user " + row.b,
  u2.createdAt = datetime()

MERGE (u1)-[:FOLLOWS]->(u2)
MERGE (u2)-[:FOLLOWS]->(u1)
`;

async function insertBatch(session, batch) {
  if (batch.length === 0) return;
  await session.run(query, { batch });
}

async function seed() {
  const session = driver.session();
  const batchSize = 1000;
  let batch = [];

  try {
    const rl = readline.createInterface({
      input: fs.createReadStream("data/facebook_combined.txt"),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const [a, b] = line.trim().split(" ");
      if (!a || !b) continue;

      batch.push({ a, b });

      if (batch.length >= batchSize) {
        await insertBatch(session, batch);
        console.log(`Inserted batch of ${batch.length}`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(session, batch);
      console.log(`Inserted final batch of ${batch.length}`);
    }

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
