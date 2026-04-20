Project Structure
CS157C/
client/ # React frontend
server/ # Express backend + Neo4j

Server setup:

cd server
npm install
Create a .env file inside server/:
NEO4J_URI=...
NEO4J_USERNAME=...
NEO4J_PASSWORD=...

Run server:

cd server
node index.js

Frontend setup:

cd client
npm install

Run client:

cd client
npm run dev
