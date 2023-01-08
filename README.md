# Birdnest

> Solution for Reaktor's 2023 developer trainee pre-assignment

## Overview

The deployed version can be found at [birdnest.miikkay.com](https://birdnest.miikkay.com)

### Objectives & implementation

> _From [assignments.reaktor.com/birdnest](https://assignments.reaktor.com/birdnest)_

- [x] Build and deploy a web application which lists all the pilots who recently violated the NDZ (no drone zone) perimeter
- [x] Persist the pilot information for **10 minutes** since their drone was last seen by the equipment
  - Only pilots that violated the NDZ within the last 10 minutes are displayed on the web UI
  - Drones and pilots in the database older than 10 minutes are deleted every 15 seconds
- [x] Display the closest confirmed distance to the nest
- [x] Contain the pilot name, email address and phone number
- [x] **Immediately** show the information from the last 10 minutes to anyone opening the application
- [x] Not require the user to manually refresh the view to see up-to-date information
- [x] Develop the application as if it was always operational
- [x] Only query pilot information for the drones violating the NDZ
- [x] On a rare occasion, pilot information may not be found, indicated by a 404 status code
  - When pilot information is not found, it will be queried again at 5 second intervals until it is found

### Technologies used

#### Frontend

- React
- TypeScript
- WebSocket

#### Backend

- Node.js
- TypeScript
- WebSocket
- PostgreSQL
- Jest

## Getting started

### Prerequisites

- Docker
- Node.js v16+

### Installation

1. Clone the repo
   ```
   git clone https://github.com/miikkaylisiurunen/reaktor-birdnest.git
   ```
2. Change directory
   ```
   cd reaktor-birdnest
   ```

#### Server

1. Change directory to `server`
2. Install NPM packages
   ```
   npm install
   ```
3. Start database services with Docker
   ```
   docker-compose up -d
   ```
4. Make a copy of `.env.template` and rename it to `.env`
5. Start server
   ```
   npm run dev
   ```

#### Client

1. Change directory to `client`
2. Install NPM packages
   ```
   npm install
   ```
3. Create a `.env` file and add `REACT_APP_SERVER_URL` to it
   ```
   REACT_APP_SERVER_URL=http://localhost:3001
   ```
4. Start React app
   ```
   npm start
   ```
5. Open `http://localhost:3000`

## Testing

### Manual

1. Follow steps 1-4 in [getting started server instructions](#server)
2. Run tests
   ```
   npm run test
   ```

### Automatic

Testing is automated using GitHub Actions and it runs every time `server` directory has new changes
