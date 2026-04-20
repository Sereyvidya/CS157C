const BASE_URL = "http://localhost:5001";

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getUser(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}`);
  return res.json();
}

export async function getFollowers(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}/followers`);
  return res.json();
}

export async function getFollowing(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}/following`);
  return res.json();
}

export async function followUser(currentUserId, targetUserId) {
  const res = await fetch(`${BASE_URL}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUserId }),
  });
  return res.json();
}

export async function unfollowUser(currentUserId, targetUserId) {
  const res = await fetch(`${BASE_URL}/unfollow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUserId }),
  });
  return res.json();
}

export async function searchUsers(q) {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function getPopularUsers() {
  const res = await fetch(`${BASE_URL}/popular`);
  return res.json();
}

export async function getRecommendations(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}/recommendations`);
  return res.json();
}
