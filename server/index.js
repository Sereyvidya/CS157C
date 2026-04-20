const express = require("express");
const cors = require("cors");
const driver = require("./neo4j");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

// login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {username: $username, password: $password})
      RETURN u
      `,
      { username, password },
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.records[0].get("u").properties;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// get one profile
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})
      RETURN u
      `,
      { userId },
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.records[0].get("u").properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// following
app.get("/users/:userId/following", async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})-[:FOLLOWS]->(v:User)
      RETURN v
      ORDER BY v.username
      `,
      { userId },
    );

    res.json(result.records.map((r) => r.get("v").properties));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// followers
app.get("/users/:userId/followers", async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})<-[:FOLLOWS]-(v:User)
      RETURN v
      ORDER BY v.username
      `,
      { userId },
    );

    res.json(result.records.map((r) => r.get("v").properties));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// follow
app.post("/follow", async (req, res) => {
  const { currentUserId, targetUserId } = req.body;
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (a:User {userId: $currentUserId})
      MATCH (b:User {userId: $targetUserId})
      MERGE (a)-[:FOLLOWS]->(b)
      `,
      { currentUserId, targetUserId },
    );

    res.json({ message: "Followed user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// unfollow
app.post("/unfollow", async (req, res) => {
  const { currentUserId, targetUserId } = req.body;
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (a:User {userId: $currentUserId})-[r:FOLLOWS]->(b:User {userId: $targetUserId})
      DELETE r
      `,
      { currentUserId, targetUserId },
    );

    res.json({ message: "Unfollowed user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// mutuals
app.get("/users/:userId/mutual/:otherUserId", async (req, res) => {
  const { userId, otherUserId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u1:User {userId: $userId})-[:FOLLOWS]->(m:User)<-[:FOLLOWS]-(u2:User {userId: $otherUserId})
      RETURN m
      ORDER BY m.username
      `,
      { userId, otherUserId },
    );

    res.json(result.records.map((r) => r.get("m").properties));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// recommendations
app.get("/users/:userId/recommendations", async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(rec:User)
      WHERE rec.userId <> $userId
        AND NOT (u)-[:FOLLOWS]->(rec)
      RETURN rec, count(*) AS score
      ORDER BY score DESC, rec.username
      LIMIT 10
      `,
      { userId },
    );

    res.json(
      result.records.map((r) => ({
        ...r.get("rec").properties,
        score: r.get("score").toNumber(),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// search
app.get("/search", async (req, res) => {
  const { q = "" } = req.query;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.username) CONTAINS toLower($q)
         OR toLower(u.name) CONTAINS toLower($q)
      RETURN u
      LIMIT 20
      `,
      { q },
    );

    res.json(result.records.map((r) => r.get("u").properties));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// popular users
app.get("/popular", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)<-[:FOLLOWS]-(f:User)
      RETURN u, count(f) AS followers
      ORDER BY followers DESC
      LIMIT 10
    `);

    res.json(
      result.records.map((r) => ({
        ...r.get("u").properties,
        followers: r.get("followers").toNumber(),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

app.listen(5001, () => {
  console.log("Server running on port 5001");
});
