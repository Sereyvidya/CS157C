import { useEffect, useState } from "react";
import {
  login,
  getFollowers,
  getFollowing,
  searchUsers,
  getPopularUsers,
  getRecommendations,
  followUser,
  unfollowUser,
} from "./api";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("user9");
  const [password, setPassword] = useState("demo123");

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [popularUsers, setPopularUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  async function handleLogin(e) {
    e.preventDefault();
    const user = await login(username, password);
    if (user.userId) {
      setCurrentUser(user);
    } else {
      alert("Login failed");
    }
  }

  async function loadDashboard(userId) {
    const [followersData, followingData, recsData, popularData] =
      await Promise.all([
        getFollowers(userId),
        getFollowing(userId),
        getRecommendations(userId),
        getPopularUsers(),
      ]);

    setFollowers(followersData);
    setFollowing(followingData);
    setRecommendations(recsData);
    setPopularUsers(popularData);
  }

  useEffect(() => {
    if (currentUser?.userId) {
      loadDashboard(currentUser.userId);
    }
  }, [currentUser]);

  async function handleSearch() {
    const results = await searchUsers(search);
    setSearchResults(results);
  }

  async function handleFollow(targetUserId) {
    await followUser(currentUser.userId, targetUserId);
    loadDashboard(currentUser.userId);
  }

  async function handleUnfollow(targetUserId) {
    await unfollowUser(currentUser.userId, targetUserId);
    loadDashboard(currentUser.userId);
  }

  if (!currentUser) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Social Network</h1>
        <form onSubmit={handleLogin}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
          <br />
          <br />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <br />
          <br />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Welcome, {currentUser.name}</h1>
      <p>@{currentUser.username}</p>
      <p>{currentUser.bio}</p>

      <hr />

      <h2>Search Users</h2>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or username"
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {searchResults.map((user) => (
          <li key={user.userId}>
            {user.name} (@{user.username})
            {user.userId !== currentUser.userId && (
              <>
                {" "}
                <button onClick={() => handleFollow(user.userId)}>
                  Follow
                </button>
                <button onClick={() => handleUnfollow(user.userId)}>
                  Unfollow
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <hr />

      <h2>Following</h2>
      <ul>
        {following.map((user) => (
          <li key={user.userId}>
            {user.name} (@{user.username})
          </li>
        ))}
      </ul>

      <h2>Followers</h2>
      <ul>
        {followers.map((user) => (
          <li key={user.userId}>
            {user.name} (@{user.username})
          </li>
        ))}
      </ul>

      <h2>Recommended Users</h2>
      <ul>
        {recommendations.map((user) => (
          <li key={user.userId}>
            {user.name} (@{user.username}) - score: {user.score}
            <button onClick={() => handleFollow(user.userId)}>Follow</button>
          </li>
        ))}
      </ul>

      <h2>Popular Users</h2>
      <ul>
        {popularUsers.map((user) => (
          <li key={user.userId}>
            {user.name} (@{user.username}) - followers: {user.followers}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
