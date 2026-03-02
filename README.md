SmartChat AI – a model-trained chatbot (Node + React)

## Overview

SmartChat AI is a full-stack web application that provides an intelligent chatbot trained on a dataset using basic NLP / ML techniques. It includes:

- Secure user registration and login
- Protected chatbot dashboard
- Conversation history per user
- Dataset-trained chatbot (training + inference pipeline)
- Admin panel to manage users, monitor activity, and view analytics

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT)
- ML / NLP: Custom preprocessing and a small intent-classification model trained from a dataset
- Frontend: React, Vite, Axios, React Router

## Original assignment requirement (summary)

This project was built to match the interview assignment prompt:

- Build an AI-based web app named **“SmartChat AI”** (intelligent chatbot trained using ML/NLP)
- Provide a user-friendly conversational UI with meaningful, context-aware responses
- Include **user registration/login** with **secure authentication** and a **protected chatbot dashboard**
- Store and show **past conversation history**
- Train the chatbot model using a **suitable dataset** with **basic preprocessing**
- Store conversation data securely, respond efficiently, show responses in real time
- Include an **admin panel** to manage users, monitor chatbot activity, and show basic analytics

## Project Structure

- `backend/` – Node/Express API, ML chatbot, auth, analytics
- `frontend/` – React single-page application

## Running the project

1. **Prerequisites**
   - Install Node.js (LTS) and MongoDB (or use a cloud MongoDB URI).

2. **Backend setup**
   - Open a terminal in `backend/`.
   - Copy `.env.example` to `.env` and adjust values if needed.
   - Install dependencies:
     - `npm install`
   - Train the chatbot model from the education-support dataset:
     - `npm run train`
   - Start the backend:
     - `npm run dev`
   - The API will run on `http://localhost:4000`.

3. **Frontend setup**
   - Open another terminal in `frontend/`.
   - Install dependencies:
     - `npm install`
   - Start the React dev server:
     - `npm run dev`
   - Open the shown URL (default `http://localhost:5173`).

4. **Usage**
   - Register a new user account, then log in.
   - Open the Chat page, create a conversation, and start chatting with SmartChat AI.
   - Visit History to review previous conversations.
    - Admin access:
      - A default admin user is created automatically on backend start **only if no admin exists yet**.
      - Use the admin credentials from your `backend/.env` (see `.env.example`).
      - After logging in as admin, you will see an **Admin** link in the navbar (`/admin`).

## Chatbot training / NLP process

For this assignment, the chatbot uses a lightweight **intent-based model trained from a dataset**:

- The **training dataset** is defined in `backend/data/training_data.json` with:
  - `intent`: the intent/label name (e.g. `greeting`, `study_tips`, `exam_anxiety`).
  - `text`: an example student question or message for that intent.
- The **response templates** for each intent are defined in `backend/src/ml/intent_responses.json`.
- The training script `backend/src/ml/train_model.js`:
  - Loads all rows from `training_data.json`.
  - Applies basic preprocessing: lowercasing, punctuation removal, tokenization.
  - Builds a vocabulary and computes TF‑IDF vectors for each example.
  - Aggregates vectors by `intent` into an average **centroid vector** per intent.
  - Saves the trained model as `backend/src/ml/model.json` (vocabulary, IDF values, and intent centroids).  
    Note: `model.json` is a generated artifact; run `npm run train` after cloning.
- The inference logic in `backend/src/ml/chatbot.js`:
  - Loads `model.json` and `intent_responses.json`.
  - Preprocesses the incoming user message with the same steps as training.
  - Computes a TF‑IDF vector and cosine similarity to each intent centroid.
  - Selects the highest‑scoring intent (with a small threshold) and then chooses a suitable response for that intent.

To **extend or retrain** the chatbot:

1. Edit `backend/data/training_data.json` to add more labeled examples in the education-support domain.
2. Optionally edit `backend/src/ml/intent_responses.json` to refine the responses for each intent.
3. Run the training command again:
   - `cd backend`
   - `npm run train`
4. Restart the backend server (`npm run dev`) so it uses the updated `model.json`.

## Screen recording (what to show)

When you record the demo:

- Show user registration and login.
- Demonstrate a few conversations with the chatbot for different query types.
- Show that conversation history is persisted and can be revisited.
- Log in as an admin user and show the analytics (summary cards, messages per day, top intents).
- Briefly show `backend/data/training_data.json`, run `npm run train`, and explain how preprocessing + TF‑IDF similarity work.
