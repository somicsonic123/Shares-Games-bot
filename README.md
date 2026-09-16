# Shares Games Bot

A Discord bot with owner checks and YouTube music playback.

## Files

- `index.js` - Main bot code.
- `package.json` - Project metadata and dependencies.
- `.env.example` - Configuration template.
- `.gitignore` - Keeps secrets and dependencies out of Git.

## Run locally

1. Install Node.js.
2. Install FFmpeg on your system if needed.
3. Copy `.env.example` to `.env`.
4. Fill in all values:

   ```dotenv
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_application_client_id_here
   GUILD_ID=your_discord_server_guild_id_here
   OWNER_ID=your_discord_user_id_here
   ```

5. Run `npm install`.
6. Run `npm start`.

## Commands

- `/hello` - Says hello.
- `/ping` - Checks whether the bot is online.
- `/owner` - Shows the configured owner.
- `/play <url>` - Plays a YouTube audio track in a voice channel.
- `/pause` - Pauses the current track.
- `/resume` - Resumes the current track.
- `/skip` - Skips the current track.
- `/stop` - Stops music and leaves the voice channel.
- `/add <first> <second>` - Adds two numbers.

## Important notes

- Bot must be invited with `Connect` and `Speak` permissions.
- The bot can play direct YouTube links only.
- Keep `.env` private. Never commit tokens or personal IDs.

To find your Discord user ID, enable Developer Mode in Discord, right-click your username, and choose **Copy User ID**.
