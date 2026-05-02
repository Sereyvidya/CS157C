import { useEffect, useMemo, useState } from "react";
import {
  login,
  registerUser,
  updateUser,
  getFollowers,
  getFollowing,
  getMutualConnections,
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

  const [showRegister, setShowRegister] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMutualsModal, setShowMutualsModal] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    email: "",
  });

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersVisible, setFollowersVisible] = useState(5);
  const [followingVisible, setFollowingVisible] = useState(5);
  const [recommendationsVisible, setRecommendationsVisible] = useState(5);
  const [popularVisible, setPopularVisible] = useState(5);
  const [searchVisible, setSearchVisible] = useState(5);
  const LIST_PAGE_SIZE = 5;
  const [recommendations, setRecommendations] = useState([]);
  const [popularUsers, setPopularUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [mutuals, setMutuals] = useState([]);
  const [mutualUser, setMutualUser] = useState(null);

  const followingIds = useMemo(() => {
    return new Set(following.map((user) => String(user.userId)));
  }, [following]);

  async function handleLogin(e) {
    e.preventDefault();

    const user = await login(username, password);

    if (user.userId) {
      setCurrentUser(user);
    } else {
      alert(user.message || "Login failed");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    const user = await registerUser(registerForm);

    if (user.userId) {
      setCurrentUser(user);
      setRegisterForm({
        name: "",
        email: "",
        username: "",
        password: "",
      });
      setShowRegister(false);
    } else {
      alert(user.message || "Registration failed");
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
    setSearchVisible(LIST_PAGE_SIZE);
  }

  async function handleFollow(targetUserId) {
    if (!currentUser) return;
    if (String(targetUserId) === String(currentUser.userId)) {
      alert("You cannot follow yourself");
      return;
    }

    await followUser(currentUser.userId, targetUserId);
    await loadDashboard(currentUser.userId);

    if (search.trim()) {
      const results = await searchUsers(search);
      setSearchResults(results);
    }

    if (mutualUser) {
      const data = await getMutualConnections(
        currentUser.userId,
        mutualUser.userId,
      );
      setMutuals(data);
    }
  }

  async function handleUnfollow(targetUserId) {
    if (!currentUser) return;

    await unfollowUser(currentUser.userId, targetUserId);
    await loadDashboard(currentUser.userId);

    if (search.trim()) {
      const results = await searchUsers(search);
      setSearchResults(results);
    }

    if (mutualUser) {
      const data = await getMutualConnections(
        currentUser.userId,
        mutualUser.userId,
      );
      setMutuals(data);
    }
  }

  function openEditProfile() {
    setEditForm({
      name: currentUser?.name || "",
      bio: currentUser?.bio || "",
      email: currentUser?.email || "",
    });
    setShowEditProfile(true);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();

    const updatedUser = await updateUser(currentUser.userId, editForm);

    if (updatedUser.userId) {
      setCurrentUser(updatedUser);
      setShowEditProfile(false);
    } else {
      alert(updatedUser.message || "Update failed");
    }
  }

  async function handleViewMutuals(otherUser) {
    const data = await getMutualConnections(
      currentUser.userId,
      otherUser.userId,
    );
    setMutuals(data);
    setMutualUser(otherUser);
    setShowMutualsModal(true);
  }

  function handleLogout() {
    setCurrentUser(null);
    setFollowers([]);
    setFollowing([]);
    setRecommendations([]);
    setPopularUsers([]);
    setSearch("");
    setSearchResults([]);
    setMutuals([]);
    setMutualUser(null);
    setShowEditProfile(false);
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Social Network
          </h1>

          <p className="text-slate-400 text-center mb-6">
            {showRegister
              ? "Create a new account"
              : "Log in to view your profile and connections"}
          </p>

          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  type="password"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 font-medium"
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 font-medium"
              >
                Create Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  placeholder="Full name"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Email
                </label>
                <input
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Username
                </label>
                <input
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  placeholder="Username"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Password
                </label>
                <input
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="Password"
                  type="password"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 hover:bg-green-500 transition px-4 py-2 font-medium"
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 font-medium"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="riounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-lg text-slate-300">Username: @{currentUser.username}</p>
          <p className="text-slate-400 mt-2">Bio: {currentUser.bio}</p>

          <div className="flex justify-center gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold text-blue-400">{followers.length}</p>
              <p className="text-slate-400 text-sm">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{following.length}</p>
              <p className="text-slate-400 text-sm">Following</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={openEditProfile}
              className="rounded-lg bg-yellow-600 hover:bg-yellow-500 transition px-4 py-2 text-sm font-medium"
            >
              Edit Profile
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Search Users</h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or username"
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-5 py-2 font-medium"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.slice(0, searchVisible).map((user) => {
                const isSelf =
                  String(user.userId) === String(currentUser.userId);
                const isFollowing = followingIds.has(String(user.userId));

                return (
                  <div
                    key={user.userId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-slate-400 text-sm">@{user.username}</p>
                    </div>

                    {!isSelf && (
                      <div className="flex gap-2 flex-wrap">
                        {!isFollowing ? (
                          <button
                            onClick={() => handleFollow(user.userId)}
                            className="rounded-lg bg-green-600 hover:bg-green-500 transition px-4 py-2 text-sm font-medium"
                          >
                            Follow
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnfollow(user.userId)}
                            className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                          >
                            Unfollow
                          </button>
                        )}

                        <button
                          onClick={() => handleViewMutuals(user)}
                          className="rounded-lg bg-purple-600 hover:bg-purple-500 transition px-4 py-2 text-sm font-medium"
                        >
                          View Mutuals
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {searchResults.length > searchVisible && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => setSearchVisible(searchResults.length)}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                  >
                    Show all
                  </button>
                </div>
              )}
              {searchVisible > LIST_PAGE_SIZE && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setSearchVisible(LIST_PAGE_SIZE)}
                    className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                  >
                    Show less
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400">No search results yet.</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Following</h2>

            {following.length > 0 ? (
              <div className="space-y-3">
                {following.slice(0, followingVisible).map((user) => (
                  <div
                    key={user.userId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-slate-400 text-sm">@{user.username}</p>
                    </div>

                    <button
                      onClick={() => handleUnfollow(user.userId)}
                      className="rounded-lg bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-medium"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}

                {following.length > followingVisible && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setFollowingVisible(following.length)}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                    >
                      Show all
                    </button>
                  </div>
                )}
                {followingVisible > LIST_PAGE_SIZE && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => setFollowingVisible(LIST_PAGE_SIZE)}
                      className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">Not following anyone yet.</p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Followers</h2>

            {followers.length > 0 ? (
              <div className="space-y-3">
                {followers.slice(0, followersVisible).map((user) => (
                  <div
                    key={user.userId}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-slate-400 text-sm">@{user.username}</p>
                  </div>
                ))}

                {followers.length > followersVisible && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setFollowersVisible(followers.length)}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                    >
                      Show all
                    </button>
                  </div>
                )}
                {followersVisible > LIST_PAGE_SIZE && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => setFollowersVisible(LIST_PAGE_SIZE)}
                      className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">No followers yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Recommended Users</h2>

            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, recommendationsVisible).map((user) => {
                  const isFollowing = followingIds.has(String(user.userId));

                  return (
                    <div
                      key={user.userId}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-slate-800 border border-slate-700 p-4"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-slate-400 text-sm">
                          @{user.username}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">
                          Score: {user.score}
                        </p>
                      </div>

                      {!isFollowing ? (
                        <button
                          onClick={() => handleFollow(user.userId)}
                          className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                        >
                          Follow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnfollow(user.userId)}
                          className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                        >
                          Unfollow
                        </button>
                      )}
                    </div>
                  );
                })}

                {recommendations.length > recommendationsVisible && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setRecommendationsVisible(recommendations.length)}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                    >
                      Show all
                    </button>
                  </div>
                )}
                {recommendationsVisible > LIST_PAGE_SIZE && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => setRecommendationsVisible(LIST_PAGE_SIZE)}
                      className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">No recommendations right now.</p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Popular Users</h2>

            {popularUsers.length > 0 ? (
              <div className="space-y-3">
                {popularUsers.slice(0, popularVisible).map((user) => (
                  <div
                    key={user.userId}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-slate-400 text-sm">@{user.username}</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Followers: {user.followers}
                    </p>
                  </div>
                ))}

                {popularUsers.length > popularVisible && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setPopularVisible(popularUsers.length)}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium"
                    >
                      Show all
                    </button>
                  </div>
                )}
                {popularVisible > LIST_PAGE_SIZE && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => setPopularVisible(LIST_PAGE_SIZE)}
                      className="rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 text-sm font-medium"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">No popular users found.</p>
            )}
          </div>
        </div>
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Name"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Bio"
                  rows="4"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 font-medium"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {showMutualsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Mutual Friends with @{mutualUser?.username}
            </h2>

            {mutuals.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mutuals.map((user) => (
                  <div
                    key={user.userId}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-slate-400 text-sm">@{user.username}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No mutual connections found.</p>
            )}

            <button
              onClick={() => setShowMutualsModal(false)}
              className="w-full mt-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition px-4 py-2 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, users, emptyText }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>

      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className="rounded-xl bg-slate-800 border border-slate-700 p-4"
            >
              <p className="font-medium">{user.name}</p>
              <p className="text-slate-400 text-sm">@{user.username}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

export default App;
