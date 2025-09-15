# File_Shrine

A minimal, password-gated file sharing portal built with Node.js, Express, and a sleek neon UI. Authenticated users can drag-and-drop to upload images, videos, and audio, then browse and download them from a responsive grid.

## Features
- Password-protected uploads using server-side sessions
- Drag & drop and click-to-select uploads with live progress and speed indicator
- Image/video/audio previews; download links for all files
- Clean UI with background video and responsive grid
- Zero database: files are stored on disk in `uploads/`

## Tech Stack
- Server: `Node.js`, `Express`, `express-session`, `multer`
- Client: Vanilla JS, HTML, CSS

## Project Structure
```
public/           # Static assets (UI, background video, JS, CSS)
uploads/          # Uploaded files (auto-created)
server.js         # Express server
package.json      # Scripts and dependencies
README.md         # This file
```

## Quick Start
1) Install dependencies
```bash
npm install
```

2) Start the server
```bash
npm start
```
Server runs at `http://localhost:3000`.

3) Log in
- Password prompt appears on load.
- Default password: `JAM` (defined in `server.js`).

4) Upload files
- Drag & drop onto the upload box or click “Select Files”.
- Progress bar and speed indicator show during upload.

## Configuration
- Change the upload password: edit `UPLOAD_PASSWORD` in `server.js`.
- Upload directory: defaults to `uploads/` and is created if missing.
- Port: hardcoded to `3000` in `server.js`.

## API Endpoints
- `POST /login` → `{ password }` → sets session when correct.
- `GET /auth-status` → `{ authenticated: boolean }`.
- `POST /upload` (authenticated) → multipart field `files` (one or many).
- `GET /files` (authenticated) → list of files with `{ name, size, type }`.
- `GET /download/:filename` → downloads a file by exact name.

## Security Notes
- Sessions are stored server-side; cookies are non-secure in dev. For production, enable HTTPS and set `cookie.secure = true` in the session config.
- Do not hardcode secrets. Use environment variables or a secrets manager.
- Consider adding basic rate limiting and MIME validation in production.

## Using ngrok (optional)
An `ngrok.exe` is included for tunneling during demos.
```bash
# In one terminal
npm start
# In another
ngrok http 3000
```
Copy the public URL from ngrok to share your File_Shrine temporarily.

## License
ISC (see `package.json`).

## Repository
This project’s GitHub repository: `https://github.com/cultsicarias/File_Shrine.git`. 
