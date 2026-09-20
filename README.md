# Memory Match Arena

Memory Match Arena is an offline memory-card game for kids and families. Turn over two cards, remember their positions, and find every matching pair. Play alone or take turns with up to three players on the same device.

## Motivation

I spent a lot of time looking for games that help my kids build skills through play. Many options had limitations or fell short in performance, appearance, and ease of use. I made this game to give them a simple, enjoyable way to practice memory, observation, and concentration.

## My Goal

- No play limits, no ads, and no installation.
- Just download, unzip, and play.
- Make memory practice fun, with familiar pictures, adjustable board sizes, and friendly competition.
- Keep the complete game lightweight, with under 1 MB as a future target. The current project files total about 4.6 MB uncompressed, including the bundled pictures; this target has not yet been reached.

## Play Offline

1. Download and unzip the game, keeping its folders together.
2. Open `memory-card-game/index.html` in Chrome.
3. Choose the board size, picture variety, and players in **Setup**.
4. Select **Start New Game**. If preview is enabled, memorize the cards before they turn face down.
5. Select two cards at a time until all pairs are matched.

The game runs directly from local files. Playing does not require Node.js, Python, a server, an account, an API key, or an internet connection. HTML, CSS, plain JavaScript, and a local copy of Bootstrap 5.1.1 power the game.

## Card Varieties and Board Sizes

Each game uses one picture variety. Pictures from different varieties are never mixed.

| Variety | Pictures available | Current image files |
| --- | ---: | --- |
| Animals | 64 | Emoji-based SVG illustrations and JPG photos |
| Country Flags | 64 | SVG |
| Fruits | 64 | SVG |
| Flowers | 64 | JPG |
| Vehicles | 64 | SVG |

Choose **8, 16, 32, or 64 pairs**, giving **16, 32, 64, or 128 cards**. Each new game randomly chooses the required pictures and shuffles both copies of every picture.

Animals and flowers appear without name labels. Flags, fruits, and vehicles include labels beneath the pictures. Images fit within the available card area, and animal SVG artwork is centered to keep it away from the bottom edge in normal, zoomed, and fullscreen layouts.

## Setup and Controls

Setup provides:

- One, two, or three players, with individual names and a choice of ten colors.
- Board size and card image variety.
- A card preview of **Off, 1, 2, 3, or 5 seconds**.
- Mismatch flip speeds of **Fast (500 ms), Normal (800 ms), Comfortable (900 ms), Slow (1,200 ms), or Very Slow (1,600 ms)**.
- Optional position numbers on the backs of cards.

The initial setup uses **8 pairs, Animals, one player, a 2-second preview, and Comfortable mismatch speed**. Position numbers are off.

**Defaults** restores the setup fields after confirmation and keeps saved records. **Play with Last Setup** starts using the currently displayed setup fields, which are populated from saved preferences when the page opens.

During play, the sidebar shows each player's matched-pair count under **Score**, best streak, the active player's **TURN** indicator, elapsed time, and total turns. Player colors also tint the game background.

- **Full Screen** toggles fullscreen for the app and fits the game board to the available screen area. Setup and Scores & History remain accessible.
- **Restart** asks for confirmation and creates a newly shuffled game with the same settings; it does not restore the previous card arrangement.
- **New Game · Last Setup** starts a newly shuffled game using saved settings.
- **Change Setup** opens the setup screen.
- **Scores & History** opens completed-game records.

## Rules, Scoring, and Results

Selecting two cards counts as one turn. A matching pair stays face up, and the same player continues. A mismatch turns face down after the selected delay; in multiplayer, play then passes to the next player. The player with the most matched pairs wins. Equal pair counts produce a tie.

The live **Score** is the number of pairs found. Saved personal scores and the completion dialog use a separate points system:

- A match earns **100 points**.
- Consecutive matches add **20 bonus points per additional match**, capped at **200 bonus points per match**.
- A miss resets the streak and deducts **15 points**, without taking the player's points below zero.
- Completing the board adds **500 points plus a speed bonus of up to 1,000 points** to the combined player points. This completion bonus is not added to individual player records.

The speed bonus is `round(1000 × max(0, 1 − elapsedSeconds / (2 × max(30, pairSize × 8))))`. The timer starts after the preview. Accuracy is matching turns divided by total turns, rounded to a whole percentage.

The results dialog shows the winner or tie, complete-game points, moves, misses, accuracy, and elapsed time. Choose **Play Again** for another shuffled game with the saved setup or **Change Setup** to adjust the next game.

## Saved Data and Privacy

The browser's local storage keeps data under the `memoryMatchArena.` prefix:

- Last-used setup, including player names, colors, theme, and game options.
- Each player's highest points score, completed-game count, and wins, grouped by player name.
- The highest complete-game score for each pair size, across themes and player counts.
- The most recent **100 completed games**, including players, winners, moves, misses, accuracy, time, and score.

**Scores & History → Reset All Saved Data** removes these preferences and records after confirmation. There is no saved in-progress board to resume after reloading the page.

No ads, analytics, login, or cloud sync are used. All resources needed for offline play are bundled locally. Clearing browser data can remove saved records; records do not transfer automatically between browsers or devices.

## Limitations

- Fullscreen depends on browser support. Larger boards can require scrolling outside fullscreen, particularly on smaller screens.
- Opening Setup or Scores & History does not pause a running game's timer. There is no pause control.
- Persistence requires browser local storage. Local-file storage behavior can vary between browsers.
- Emoji-based SVG pictures depend on installed emoji fonts, so their appearance and visual alignment can vary by operating system. The centering adjustment was checked in Chrome on Windows.

## Configuration and Project Files

- `index.html` — setup, game, score tables, and results dialog.
- `css/app.css` — card layout, image fitting, player colors, responsive styles, and fullscreen layout.
- `config/game-config.json` — themes, board sizes, players, defaults, colors, scoring, and storage settings.
- `config/game-config.runtime.js` — bundled configuration for direct local-file play.
- `js/namespace.js` — shared application namespace.
- `js/config-service.js` — configuration and theme-manifest loading.
- `js/game-engine.js` — shuffling, matching, turns, timing, scoring, and completion.
- `js/storage-service.js` — preferences, personal records, board-size records, and history.
- `js/ui.js` — setup, card rendering, previews, scores, and results.
- `js/app.js` — initialization and control/event wiring.
- `assets/cards/` — local pictures and each theme's `manifest.json` and `manifest.runtime.js`.
- `assets/vendor/bootstrap/` — bundled Bootstrap styles and scripts.
- `tools/` — optional development utilities for extracting, cleaning, and restoring card assets; not needed to play.
- `LICENSES/BOOTSTRAP_LICENSE.txt` — bundled Bootstrap license.

When opened through `file://`, the app uses the runtime JavaScript configuration and manifests. When served over HTTP, it attempts to load the JSON files and falls back to the bundled runtime versions if needed. Keep each JSON file and its runtime JavaScript mirror synchronized when editing settings or picture lists.

Mismatch-speed options are currently defined in `index.html`; update that select when changing the available speeds. The default mismatch speed is defined in the configuration.
#   m e m o r y _ g a m e  
 