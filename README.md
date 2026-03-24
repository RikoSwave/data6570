# data6570

## First Time Installation

This project consists of a Django backend (`rpg_backend`) and an Expo frontend (`rpg-expo-app`).

### Backend Setup

1. Open a terminal in the project root directory (`c:\dev\data6570` or where you cloned it).
2. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   ```
3. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
4. Navigate to the backend directory and install dependencies (if any are added in the future):
   ```bash
   cd rpg_backend
   # pip install -r requirements.txt
   ```

### Frontend Setup

1. Open a terminal in the project root directory.
2. Navigate to the frontend directory:
   ```bash
   cd rpg-expo-app
   ```
3. Install the Node.js dependencies:
   ```bash
   npm install
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
