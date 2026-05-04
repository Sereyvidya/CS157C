# Social Network Application

A full-stack social networking platform built with React, Node.js, and Neo4j. This application demonstrates graph database fundamentals with real-world social network features including user profiles, follow relationships, recommendations, and mutual connection discovery.

## Features

### Core Use Cases (11 Total)
-  **User Registration** - Create new accounts with validation
-  **User Login** - Secure authentication with credentials
-  **View Profile** - Display user details, bio, and follower counts
-  **Edit Profile** - Update name, email, and bio
-  **Follow/Unfollow** - Manage social connections
-  **View Followers** - See who follows you (with pagination)
-  **View Following** - See your followings (with pagination)
-  **Search Users** - Find users by name or username (with pagination)
-  **View Mutual Connections** - Find common followers with any user (modal popup)
-  **Get Recommendations** - AI-powered follow suggestions using graph traversal
-  **View Popular Users** - Discover users with the most followers


## Tech Stack

### Frontend
- **React 19.2.4** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling

### Backend
- **Node.js** - Runtime environment
- **Express.js 5.2.1** - Web framework
- **neo4j-driver 6.0.1** - Database driver
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Database
- **Neo4j Aura** - Cloud graph database
- **88,000+** relationships from Facebook social network dataset

## Project Structure

```
CS157C/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── api.js         # API client functions
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── server/                # Node.js backend
│   ├── index.js           # Express server & API routes
│   ├── neo4j.js           # Database connection
│   ├── seed.js            # Database seeding script
│   ├── package.json
│   └── .env               # Environment variables
├── data/
│   └── facebook_combined.txt  # Social network dataset
└── README.md
```

## Prerequisites

- **Node.js** v18 or higher
- **npm** or yarn
- **Neo4j Aura** account (free tier available at aura.neo4j.io)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Sereyvidya/CS157C.git
cd CS157C
```

### 2. Install dependencies

**Frontend:**
```bash
cd client
npm install
cd ..
```

**Backend:**
```bash
cd server
npm install
cd ..
```

## Environment Setup

### Backend Configuration

Create a `.env` file in the `server/` directory:

```env
NEO4J_URI=neo4j+s://your-aura-instance.databases.neo4j.io
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
```

Get your Neo4j credentials from your Aura dashboard.

## Running the Application

### Start the Backend Server

```bash
cd server
npm start
```

Server runs on `http://localhost:5001`

### Seed the Database (First Time Only)

```bash
cd server
npm run seed
```

This populates Neo4j with 88,000+ user relationships from the Facebook dataset.

### Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

### Access the Application

Open your browser and navigate to: `http://localhost:5173`

**Demo credentials:**
- Username: `user9`
- Password: `demo123`


## Authors

Sereyvidya Vireak
Shreya Hegde
Tamanna Singh
