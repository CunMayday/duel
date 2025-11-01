# Efe's Duel!

A web-based multiplayer fencing card game where two players compete in strategic duels using cards to move, attack, and parry. The game implements the advanced rules with the "Advance and Attack" mechanic.

## Game Overview

- **Players**: 2 (online multiplayer via Firebase)
- **Goal**: First player to win 5 rounds wins the game
- **Cards**: 25 fencing cards (5 each of values 1-5)
- **Board**: 23-space fencing piste

## How to Play

1. Each player starts at opposite ends of the piste
2. Players are dealt 5 cards each round
3. On your turn, play a card to:
   - **Move**: Advance toward your opponent
   - **Attack**: If the distance equals your card value
   - **Advance and Attack**: Move forward, then attack in the same turn
4. Defend against attacks by:
   - **Parry**: Play the same number of cards with the same total value
   - **Retreat**: (Only for advance attacks) Move backward
5. Win a round by landing a successful attack
6. First to 5 round wins is the champion!

## Firebase Firestore Setup Instructions

Follow these steps carefully to set up your Firebase Firestore database:

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "efes-duel")
4. Click **Continue**
5. You can disable Google Analytics for this project (optional)
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

### Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "Efe's Duel Web")
3. **Do NOT check** "Also set up Firebase Hosting" (we'll use Vercel or GitHub Pages)
4. Click **Register app**
5. You will see your Firebase configuration object - **COPY THIS**, you'll need it in Step 4

The config looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **Continue to console**

### Step 3: Enable Cloud Firestore

1. In the left sidebar, click **"Build"** > **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (easier for development)
   - This allows read/write access without authentication for 30 days
   - **IMPORTANT**: You'll need to update security rules later (see Step 5)
4. Click **Next**
5. Choose a Firestore location (pick one closest to your users)
   - For example: `us-east1` (South Carolina)
   - **Note**: This cannot be changed later
6. Click **Enable**
7. Wait for Firestore to be provisioned (usually takes 1-2 minutes)

### Step 4: Configure Your App

1. Open the file [firebase-config.js](firebase-config.js) in this project
2. Replace the placeholder configuration with your actual Firebase configuration from Step 2
3. **Note**: You do NOT need `databaseURL` for Firestore (only needed for Realtime Database)

**Before:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

**After (with your actual values):**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAbc123...",
    authDomain: "efes-duel-12345.firebaseapp.com",
    projectId: "efes-duel-12345",
    storageBucket: "efes-duel-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};
```

### Step 5: Set Up Security Rules (Important!)

The test mode rules expire after 30 days. For better security, update your rules:

1. In Firebase Console, go to **Firestore Database** > **Rules** tab
2. Replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      // Allow anyone to read and write game documents
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

**Note**: These rules allow anyone to read/write games. For production with user accounts, you should add Firebase Authentication and restrict access to authenticated users only.

**For production with authentication** (optional, more secure):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      // Only authenticated users can read/write
      allow read, write: if request.auth != null;
    }
  }
}
```

## Deployment Instructions

You don't need to run a server! Deploy your game to the internet for free using one of these options:

### Option A: Deploy to Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (one-time):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to your project folder**:
   ```bash
   cd path/to/duel
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Login to Vercel (or create free account)
   - Set up project: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: efes-duel (or whatever you want)
   - In which directory: `./` (just press Enter)
   - Want to override settings: No

5. **Done!** Vercel will give you a URL like: `https://efes-duel.vercel.app`

**To update your deployed game later:**
```bash
vercel --prod
```

### Option B: Deploy to GitHub Pages

1. **Create a GitHub repository**:
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it `efes-duel`
   - Make it public

2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Efe's Duel game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/efes-duel.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** > **Pages** (in left sidebar)
   - Under "Source", select **main** branch
   - Click **Save**

4. **Wait 1-2 minutes**, then visit:
   ```
   https://YOUR_USERNAME.github.io/efes-duel/
   ```

**To update your deployed game later:**
```bash
git add .
git commit -m "Update game"
git push
```

### Option C: Deploy to Netlify

1. **Drag and drop** your project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Done! You'll get a URL like: `https://random-name-123.netlify.app`
3. You can customize the URL in Netlify settings

## Local Testing (Development Only)

For local testing during development, you need a local web server:

**Option 1 - Python**:
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

**Option 2 - Node.js**:
```bash
npx http-server
```

**Option 3 - VS Code**:
- Install "Live Server" extension
- Right-click `index.html` > "Open with Live Server"

**Why?** Modern browsers block certain JavaScript features when opening HTML files directly (`file://`) for security reasons.

## Troubleshooting

### Error: "Firebase not defined"

- **For local testing**: Make sure you're using a local web server (see above)
- **For deployed version**: Check that firebase-config.js is uploaded
- Check browser console (F12) for detailed error messages

### Error: "Missing or insufficient permissions"

- Check that your Firestore security rules are set correctly (Step 5)
- Make sure you selected "Start in test mode" when creating the database
- Verify your Firebase config is correct in firebase-config.js

### Can't see the database updating

- Open Firebase Console > Firestore Database > Data tab
- You should see a `games` collection appear when you create a game
- Click on it to see game documents in real-time
- Each game has a document ID matching the Game ID shown in the app

### Players can't connect

- Both players must be using the exact same Game ID (case-sensitive)
- Check browser console (F12) for any error messages
- Verify both players have internet connection
- Make sure both players are accessing the same deployed URL

### Game loads but nothing happens when joining

- Check that Firestore is enabled (not Realtime Database)
- Verify the game ID exists in Firestore Console
- Check that security rules allow read/write access

## Game Controls

### During Your Turn (Normal Play)

- Click a card in your hand
- If multiple actions are possible, you'll be prompted to choose:
  - **1**: Move forward
  - **2**: Attack
  - **3**: Advance and Attack

### During Attack Phase (Attacker)

- After declaring an attack, you can strengthen it
- Click additional cards of the **same value** to strengthen
- Click **"Finish Attack"** when done

### During Parry Phase (Defender)

- Select cards that match:
  - **Same number of cards** as the attacker used
  - **Same total value** as the attack
- Click **"Parry"** to defend
- For advance attacks, you can click **"Retreat Instead"** to move back

## File Structure

```
duel/
├── index.html          # Main HTML structure
├── styles.css          # Game styling
├── firebase-config.js  # Firebase configuration (YOU MUST EDIT THIS)
├── game.js            # Core game logic and state management
├── ui.js              # User interface and rendering
├── main.js            # Application entry point
├── README.md          # This file
└── AGENTS.md          # Development guidelines
```

## Technical Details

- **Framework**: Vanilla JavaScript (no React or frameworks)
- **Database**: Firebase Cloud Firestore
- **Architecture**: MVC pattern
  - `Game` class: Model (game state and logic)
  - `UI` class: View (rendering and user input)
  - `main.js`: Controller (connects model and view)

## Features

- Real-time multiplayer over the internet
- Secret hand visibility (each player only sees their own cards)
- Turn indicators with visual highlighting
- Action log showing all moves with timestamps
- Score tracking with visual hit markers
- Advanced game mechanics:
  - Standard attacks with strengthening
  - Parrying system
  - Advance and Attack
  - Retreat from advance attacks
- Offline support (Firestore caches data locally)
- No server management needed!

## Database Structure

Firestore stores games in the following structure:

```
Collection: games
  Document: {gameId}
    - player1: string (player ID)
    - player2: string (player ID)
    - gameStarted: boolean
    - currentTurn: number (1 or 2)
    - round: number
    - player1Score: number
    - player2Score: number
    - player1Position: number
    - player2Position: number
    - deck: array of numbers
    - player1Hand: array of numbers
    - player2Hand: array of numbers
    - actionLog: array of objects
    - gamePhase: string
    - attackData: object or null
    - createdAt: timestamp
```

## Why Firestore vs Realtime Database?

We chose Firestore because:
- ✅ Better structure (documents vs JSON tree)
- ✅ More powerful queries
- ✅ Better free tier limits
- ✅ Offline support built-in
- ✅ Future-proof (Google's focus)
- ✅ Easier security rules

## Privacy & Data

- Game data is stored in Cloud Firestore
- Each game creates a document under `/games/{gameId}`
- Card hands are visible to both players in the database, but the UI filters them client-side
- Games are not automatically deleted - you can manually delete old games from Firebase Console
- No personal information is collected

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

**Note**: Requires a modern browser with ES6 support and JavaScript enabled.

## Cost

Firebase Firestore free tier includes:
- 1 GiB storage
- 50,000 reads per day
- 20,000 writes per day
- 20,000 deletes per day

For a small game like this, you'll likely **never exceed the free tier** unless you have thousands of concurrent players.

## License

This is a digital implementation of a fencing card game for educational purposes.

## Credits

Created with Claude Code
Game design based on traditional fencing duel mechanics
