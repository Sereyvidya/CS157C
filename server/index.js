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

// register
app.post("/register", async (req, res) => {
  const { name, email, username, password } = req.body;
  const session = driver.session();

  try {
    const check = await session.run(
      `
      MATCH (u:User)
      WHERE u.username = $username OR u.email = $email
      RETURN u
      LIMIT 1
      `,
      { username, email },
    );

    if (check.records.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const userId = Date.now().toString();

    const result = await session.run(
      `
      CREATE (u:User {
        userId: $userId,
        name: $name,
        email: $email,
        username: $username,
        password: $password,
        bio: "Hey there! I am new here.",
        createdAt: datetime()
      })
      RETURN u
      `,
      { userId, name, email, username, password },
    );

    res.json(result.records[0].get("u").properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// update user
app.put("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, bio, email, username, password } = req.body;
  const session = driver.session();

  try {
    if (username) {
      const check = await session.run(
        `
        MATCH (u:User {username: $username})
        WHERE u.userId <> $userId
        RETURN u
        `,
        { username, userId },
      );

      if (check.records.length > 0) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updates = [];
    const params = { userId };

    if (name !== undefined) {
      updates.push("u.name = $name");
      params.name = name;
    }

    if (bio !== undefined) {
      updates.push("u.bio = $bio");
      params.bio = bio;
    }

    if (email !== undefined) {
      updates.push("u.email = $email");
      params.email = email;
    }

    if (username !== undefined) {
      updates.push("u.username = $username");
      params.username = username;
    }

    if (password !== undefined && password.trim() !== "") {
      updates.push("u.password = $password");
      params.password = password;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})
      SET ${updates.join(", ")}
      RETURN u
      `,
      params,
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

// search users
app.get("/search", async (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.username) CONTAINS $q
         OR toLower(u.name) CONTAINS $q
      RETURN u
      ORDER BY u.username
      LIMIT 25
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
    const result = await session.run(
      `
      MATCH (u:User)<-[:FOLLOWS]-(follower:User)
      RETURN u, count(follower) AS followers
      ORDER BY followers DESC
      LIMIT 10
      `,
    );

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

// recommendations
// check if current user follows A
// yes A follows B then recommend B
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
      ORDER BY score DESC
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

// mutual connections
app.get("/users/:userId/mutual/:otherUserId", async (req, res) => {
  const { userId, otherUserId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u1:User {userId: $userId})-[:FOLLOWS]->(mutual:User)
      MATCH (u2:User {userId: $otherUserId})-[:FOLLOWS]->(mutual)
      RETURN DISTINCT mutual
      ORDER BY mutual.username
      `,
      { userId, otherUserId },
    );

    res.json(result.records.map((r) => r.get("mutual").properties));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

app.listen(5001, () => {
  console.log("Server running on port 5001");
});
