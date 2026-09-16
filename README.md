# Shares Games Bot

A starter Discord bot built with `discord.js`.

## Files

- `index.js` - Main bot code.
- `package.json` - Project metadata and dependencies.
- `.env.example` - Configuration template.
- `.gitignore` - Keeps secrets and dependencies out of Git.
- `bot code` - Copy of the main bot code for reference.

## Run locally

1. Install Node.js.
2. Copy `.env.example` to `.env`.
3. Fill in all values in `.env`:

   ```dotenv
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_application_client_id_here
   GUILD_ID=your_discord_server_guild_id_here
   OWNER_ID=your_discord_user_id_here
   ```

4. Run `npm install`.
5. Run `npm start`.

## Commands

- `/hello` - Says hello. The owner receives a special greeting.
- `/ping` - Checks whether the bot is online.
- `/owner` - Shows the configured owner.
- `/add` - Adds two numbers.

To find your Discord user ID, enable Developer Mode in Discord, right-click your username, and choose **Copy User ID**.

Never commit `.env`, bot tokens, API keys, or private webhook URLs.
