# Pixel Runner 🎮

An endless runner arcade game for Android - tap to jump and survive as long as you can!

## Features

- 🎯 **Simple Controls**: Tap or press Space to jump
- 🏆 **High Score Tracking**: Your best score is saved locally
- 🚀 **Increasing Difficulty**: Game gets faster over time
- 📱 **Mobile Ready**: Touch controls for Android devices
- 🌟 **Retro Design**: Pixel art style with neon colors

## How to Play

1. **Start the game** by clicking "START GAME"
2. **Jump** by tapping the screen or pressing Space/Arrow Up
3. **Avoid obstacles** coming from the right
4. **Survive** as long as possible to get the highest score!
5. **Beat your high score** and become the champion!

## Running the Game

### Option 1: Play in Browser (Recommended for testing)

Simply open `index.html` in any modern web browser:

```
Double-click index.html
```

Or serve it locally:

```bash
# Using Python
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### Option 2: Build Android APK (Requires Android SDK)

1. **Install Node.js** from https://nodejs.org

2. **Install Apache Cordova**:
```bash
npm install -g cordova
```

3. **Add Android platform**:
```bash
cordova platform add android
```

4. **Build the APK**:
```bash
cordova build android
```

The APK will be generated at: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`

## Project Structure

```
First Game/
├── index.html          # Main game file
├── config.xml          # Cordova configuration
├── css/
│   └── style.css      # Game styling
├── js/
│   └── game.js        # Game logic
├── README.md          # This file
└── TODO.md            # Development notes
```

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Jump | Space / Arrow Up | Tap screen |
| Start/Restart | Click button | Tap button |

## Game Mechanics

- **Player**: Green square that runs automatically
- **Obstacles**: Red/orange/purple shapes moving left
- **Scoring**: +1 point every 100ms survived
- **Speed Increase**: Game speed increases every 100 points
- **Collision**: Game ends when player hits an obstacle

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (Chrome, Safari)

## License

MIT License - Feel free to modify and share!

---

**Have fun playing Pixel Runner!** 🚀

