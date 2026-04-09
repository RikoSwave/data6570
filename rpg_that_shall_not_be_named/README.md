# data6570

## First Time Installation

This project consists of a Django backend (`rpg_backend`) and an Expo React Native frontend (`rpg-expo-app` or `frontend`).

### Prerequisites

Before starting, make sure you have the following installed on your system:
- **Node.js**: (v16.0 or higher recommended) for the React Native/Expo frontend.
- **Python**: (v3.8 or higher) for the Django backend.
- **Expo CLI**: Can be installed globally via `npm install -g expo-cli` (or just use `npx`).
- **Git**: For source control if needed.

### Backend Setup

1. Open a terminal in the project root directory (`c:\dev\data6570\rpg_that_shall_not_be_named` or where you cloned it).
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
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
4. Navigate to the backend directory:
   ```bash
   cd backend
   ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Run database migrations to set up the initial SQLite database:
   ```bash
   python manage.py migrate
   ```
7. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
The backend should now be running at `http://localhost:8000`.

### Frontend Setup

1. Open a new terminal instance and navigate to the project root directory.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the Node.js dependencies:
   ```bash
   npm install
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
5. You can now open the app on an Android emulator, iOS simulator, or a physical device using the Expo Go app by scanning the QR code in your terminal.
