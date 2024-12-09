# WatchCall

This is a project to showcase my ability to use React and Flask, you can create lists of movies you want to watch and select the streaming services you have subscriped to, once a day the software will check if some of your movies are available on one of your streaming services and you will be notified if so. The idea came to me after i have seen a lot of movies being available on my streaming services that i wanted to watch since a long time but i lost track of all of them. This way i will always know when my movies will be available and where. 

## Project Structure
- `backend/`: Flask backend
- `frontend/`: React frontend

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```
   The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The application will open in your browser at http://localhost:3003
