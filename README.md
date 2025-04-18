# GoalBuddy – Your Personalized Football Assistant

![GoalBuddy Logo](https://goalbuddy-ai.web.app/favicon.ico)

GoalBuddy is a smart, interactive web application designed to help football fans stay up to date with real-time match results, league standings, and top scorers by simply asking questions in natural language.

This project was developed as part of a Master's program in Artificial Intelligence.

## 📄 Abstract

GoalBuddy combines artificial intelligence and modern web technologies to deliver a personalized experience. Users can ask questions such as:

- "What is the latest Bundesliga score?"
- "When is the next France match?"
- "Who is the top scorer in the Premier League?"

The application interprets the question, queries external football APIs, and delivers a relevant answer.

---

## ✨ Features

- ⚽ Live match scores
- ⏰ Next match info for teams
- 🌟 Top scorers per competition
- 🔢 League standings
- 📅 Matches of the day

---

## 🚀 Technologies Used

| Stack             | Purpose                           |
| ----------------- | --------------------------------- |
| React             | Frontend framework                |
| Node.js           | Backend server                    |
| Express.js        | API routing and server management |
| Wit.ai            | Natural Language Processing (NLP) |
| Football-data.org | Live football data API            |
| Firebase          | Frontend hosting                  |
| Heroku            | Backend deployment                |
| VS Code           | Code editor                       |

---

## 🚧 Installation & Usage (Windows)

### Prerequisites

- Node.js v14 or above
- npm v10 or above
- Visual Studio Code or any code editor

### Backend Setup (Port 5000)

```bash
cd sport-chatbot/goalbuddy
npm install
node server.js
```

### Frontend Setup (Port 3000)

In a new terminal tab:

```bash
npm start
```

### Access Locally:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🔗 Live Demo

- Chatbot Online: https://goalbuddy-ai.web.app/
- Backend API: https://goalbuddy-a918911f06e6.herokuapp.com/

---

## 📊 Project Structure Overview

- `public/` → Static assets (index.html)
- `src/`
  - `components/` → sportResult.js (main chatbot UI)
  - `api/` → footballApi.js
  - `services/` → footballDataService.js
  - `utils/` → normalization.js
  - `App.js`, `index.js`
- `server.js` → Express backend entry point

---

## 🧬 Wit.ai Integration

Wit.ai allows GoalBuddy to understand user intent through natural language. Example:

- Input: "When is Germany's next match?"
- Intent: `get_next_match`
- Entity: `team = Germany`

---

## 🎓 Academic Context

This project was carried out by **Clément Mukonkole Kanku** during his **Master in Artificial Intelligence** at IU Internationale Hochschule.

It demonstrates applied knowledge of web development, API integration, and natural language processing.

---

## 📄 Recommendation Letter

> This project was also supported professionally during a freelance mission with **Exponential Europe**.
>
> [Read the official recommendation letter (PDF)](https://drive.google.com/file/d/1sWR2VneHCzVsvRTbSJOiQhgRW1rjRreV/view?usp=drivesdk)

---

## 📖 Credits & Thanks

- Developed with support from course instructors and teammates.
- Special thanks to Exponential Europe for real-world guidance and feedback.

---

## 😎 License

This project is open-source and available under the MIT License.

---

_Feel free to clone, fork, and improve! Football fans and devs welcome._

Clément Mukonkole Kanku ✨
