# Run With Me - Installation on Raspberry Pi 5

This guide explains how to set up the **Run With Me** full-stack application on a Raspberry Pi 5, including setting up the custom local domain name (`http://game-server.local`).

## Prerequisites
- A Raspberry Pi 5 running Raspberry Pi OS (Debian based).
- A stable local area network connection.
- Python 3.9+ and Node.js (via `npm`) installed.

## 1. Setting up a Static Local Host Name
We use `avahi-daemon` to broadcast the DNS name `.local` over your network using mDNS (Multicast DNS).

1. Update your packages and install Avahi:
   ```bash
   sudo apt update
   sudo apt install avahi-daemon
   ```
2. By default, Avahi sets the hostname to your Raspberry Pi's name (e.g., `raspberrypi.local`). To change it to `game-server.local`, change your hostname:
   ```bash
   sudo hostnamectl set-hostname game-server
   ```
3. Edit the `/etc/hosts` file and change `127.0.1.1 raspberrypi` to `127.0.1.1 game-server`:
   ```bash
   sudo nano /etc/hosts
   ```
4. Restart the Avahi daemon (or reboot the Pi) to apply the changes:
   ```bash
   sudo systemctl restart avahi-daemon
   ```
Now, other devices on your local network (iPhones, Android phones, Windows PCs, Macs) should be able to reach your Raspberry Pi by navigating to `http://game-server.local`.

## 2. Running the Backend
The backend is built with FastAPI and runs on Python using SQLite as the database.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server on all network interfaces `0.0.0.0` so other devices can reach it:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
*(Optional: Use `screen`, `tmux`, or create a `systemd` service to keep this running in the background).*

## 3. Running the Frontend
The frontend is a Phaser game bundled by Vite. We will configure Vite to serve the site locally, connecting to our Python backend.

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Since our backend is hosted on `http://game-server.local:8000`, we need to tell Vite what API URL to use. Create a `.env.local` file:
   ```bash
   echo "VITE_API_URL=http://game-server.local:8000" > .env.local
   ```
4. Start the frontend server, binding to all IP addresses:
   ```bash
   VITE_API_URL=http://game-server.local:8000 npm run dev -- --host 0.0.0.0 --port 80
   ```
*(Note for port 80: You might need to run the command with `sudo` depending on OS user permissions, or use a higher port like 5173).*

## 4. Playing the Game
Pick up your mobile phone or any computer connected to the same WiFi router.
Open your browser (Chrome/Safari) and go to:
**http://game-server.local**

Enjoy the game!
