# LinguaHub

<div align="center">

<img 
  width="500" 
  alt="Scan Me QR Code" 
  src="https://github.com/user-attachments/assets/f39a26ad-4a95-4f93-b79d-58fab68cbc45"
  style="background: transparent;"
/>

</div>

LinguaHub is a full-stack interactive language-learning platform built to make language learning structured, practical, and engaging. The platform combines lessons, quizzes, progress tracking, streaks, achievements, friends, leaderboards, speaking practice, notifications, and real-time updates in one application.

The project is implemented as a Node.js and Express backend with MongoDB and Mongoose, Socket.io for real-time communication, Firebase for Google authentication and push notifications, and optional Groq AI integration for lesson and quiz generation. The frontend is a plain HTML, CSS, and JavaScript single-page application served directly by the backend.

This project was developed as a backend development project for B.Tech Computer Science Engineering and demonstrates REST API development, database design, authentication, authorization, validation, real-time communication, third-party service integration, and automated testing.

<img width="1470" height="920" alt="Screenshot 2026-10-01 at 2 34 06 AM" src="https://github.com/user-attachments/assets/5da32677-8fb3-4df0-bdc0-628ac728de2f" />

## Project Links

- Live Application: https://linguahub-xi.vercel.app/
- GitHub Repository: https://github.com/Yashhh710/linguahub
- API Documentation: [docs/API.md](docs/API.md)
- Report: https://github.com/Yashhh710/linguahub/blob/main/LinguaHub_Case_Study_Report.pdf

## Project Objectives

LinguaHub is designed to provide a complete learning workflow for students and content management capabilities for teachers and administrators.

The main objectives are:

- Provide secure user registration and login.
- Allow learners to study language lessons and complete quizzes.
- Track lesson completion, quiz performance, XP, and learning activity.
- Maintain daily learning streaks using the learner's timezone.
- Provide achievements and gamification based on real activity.
- Allow users to search for and connect with friends.
- Provide global and friends-only leaderboards.
- Support real-time updates through Socket.io.
- Send in-app and Firebase push notifications.
- Allow teachers to create and publish lessons and quizzes.
- Provide optional AI-assisted lesson and quiz generation.
- Provide speaking practice using browser speech recognition and server-side similarity scoring.
- Provide administrator tools for user and platform management.

---

## Mobile Layout

<div align="center">

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/f0d75aee-dc58-4d26-8f96-47f4d5a28720" width="250"></td>
    <td><img src="https://github.com/user-attachments/assets/f4180ce1-e45d-41cf-a03d-6331ad1c6a77" width="250"></td>
    <td><img src="https://github.com/user-attachments/assets/4b9397e7-8173-4d98-a3b1-a295720fd23f" width="250"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/31f6268e-f209-434b-8a08-f198c1aa97da" width="250"></td>
    <td><img src="https://github.com/user-attachments/assets/f40a73af-c13c-44eb-bc5f-7c46c9b8898c" width="250"></td>
    <td><img src="https://github.com/user-attachments/assets/c8a9644b-7f28-4df1-bd93-3ef930ca8f77" width="250"></td>
  </tr>
</table>

</div>

---

## Features

### Authentication and Authorization

- Email and password registration.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Firebase-based Google sign-in support.
- Role-based access control.
- Supported roles:
  - `student`
  - `teacher`
  - `admin`
- Authenticated user profile management.
- Password change functionality.
- Daily learning reminder settings.
- Browser push-token registration.

### Language Lessons

- Published lesson listing.
- Filter lessons by language and level.
- Individual lesson details.
- Lesson completion tracking.
- Teacher and administrator lesson creation.
- Teacher and administrator lesson editing and deletion.
- AI-assisted lesson drafting through Groq.
- Curriculum data for Spanish, French, and Japanese.

### Quizzes

- Published quiz listing.
- Individual quiz retrieval.
- Server-side quiz grading.
- Quiz answers are not trusted from client-submitted scores.
- Quiz attempts are stored for the authenticated learner.
- XP can be awarded for completed quiz activity.
- Teachers and administrators can publish quizzes.
- AI-assisted quiz generation through Groq.

### Progress Tracking

LinguaHub calculates learner progress from real application activity.

The progress system supports:

- Completed lessons.
- Weekly XP statistics.
- Recent learning activity.
- Quiz accuracy.
- Individual lesson progress.
- XP event tracking.
- Learning dashboard summaries.

### Streak System

- Daily learning streaks.
- Longest streak tracking.
- Streak freeze support.
- 30-day activity calendar.
- Timezone-aware streak calculation.
- Protected learning days.

The streak system uses the learner's configured timezone instead of relying only on the server timezone.

### Gamification

LinguaHub includes a gamification system based on real user activity.

Gamification includes:

- XP events.
- Levels.
- Achievements.
- Streak milestones.
- Lesson milestones.
- Quiz milestones.
- Friend milestones.
- Automatic achievement unlocking.

### Friends

Users can:

- Search for other users.
- Send friend requests.
- Accept friend requests.
- Decline friend requests.
- Remove friends.
- View incoming requests.
- View outgoing requests.
- View their current friends.

### Leaderboards

The leaderboard system supports:

- Global leaderboard.
- Friends-only leaderboard.
- Weekly leaderboard.
- All-time leaderboard.

Weekly rankings are calculated from XP event activity, while all-time rankings use total accumulated XP.

### Notifications

The notification system supports:

- In-app notifications.
- Firebase push notifications.
- Lesson reminder notifications.
- Teacher and administrator announcements.
- Marking individual notifications as read.
- Marking all notifications as read.

### Real-Time Updates

Socket.io is used for real-time events.

The server can push events such as:

- XP updates.
- Friend requests.
- Friend request acceptance.
- Notifications.

Clients authenticate their Socket.io connection using their JWT and join a user-specific room.

### Speaking Practice

The frontend can use the browser Web Speech API for speaking practice.

The backend receives the expected text and the text detected from the learner's speech and calculates a similarity score. This score is used to evaluate the attempt and can award XP.

### Teacher and Admin Features

Teachers can create and manage learning content.

Administrators can:

- View platform statistics.
- Search and list users.
- Change user roles.
- Manage platform-level operations.

The project does not rely on a hardcoded administrator unlock code.

### AI Integration

Groq can optionally be used for AI-assisted content generation.

AI features include:

- Lesson drafting.
- Quiz generation.

AI-generated content is treated as draft content where applicable and is not automatically published as a permanent lesson or quiz without the required application flow.

If the Groq API key is not configured, the rest of the platform continues to work and AI endpoints return an appropriate configuration error.

## Technology Stack

### Backend

- Node.js
- Express.js
- JavaScript
- REST API
- Mongoose
- MongoDB

### Authentication and Security

- JSON Web Token (JWT)
- bcryptjs
- Firebase Authentication
- Firebase Admin SDK
- Express Validator
- Authentication middleware
- Role-based authorization
- Rate limiting
- Centralized error handling

### Real-Time Communication

- Socket.io

### AI

- Groq API

### Frontend

- HTML5
- CSS3
- JavaScript
- Browser Web Speech API

The frontend is served as static files from the `public/` directory and does not require a separate frontend build system.

### Testing

- Node.js built-in test runner
- Unit tests for utility and gamification logic

## Architecture

The application follows a modular backend architecture.

```text
LinguaHub
|
+-- public/                    Frontend application
|
+-- src/
|   +-- config/                Environment and database configuration
|   +-- middleware/            Authentication, validation, errors, rate limiting
|   +-- models/                MongoDB/Mongoose models
|   +-- routes/                REST API routes
|   +-- services/              Business logic and external services
|   +-- utils/                 Reusable and unit-tested utility functions
|   +-- app.js                 Express application configuration
|   +-- server.js              HTTP and Socket.io server entry point
|   +-- sockets.js             Socket.io event handling
|
+-- data/
|   +-- curriculum/            Language lessons, quizzes, achievements
|
+-- scripts/                   CLI utilities
|
+-- tests/                     Automated tests
|
+-- docs/
|   +-- API.md                 API reference
|
+-- api/
|   +-- index.js               Deployment/serverless entry point
|
+-- package.json
+-- package-lock.json
+-- README.md
```

## Database Models

The project uses MongoDB through Mongoose.

The main models include:

| Model | Purpose |
|---|---|
| User | User profile, authentication data, role, language preferences, XP-related data |
| Lesson | Language lesson content and metadata |
| Quiz | Quiz questions and published quiz content |
| QuizAttempt | User quiz submissions and results |
| Progress | Per-user lesson progress |
| Streak | Current and historical learning streak information |
| XpEvent | Individual XP activity events |
| Achievement | Achievement definitions and thresholds |
| UserAchievement | Achievements unlocked by individual users |
| Friendship | Friend relationships and requests |
| Notification | In-app notification records |
| VoicePractice | Speaking-practice attempts and similarity results |

## API Overview

Base API path:

```text
/api
```

Authenticated endpoints use:

```http
Authorization: Bearer <JWT_TOKEN>
```

All API responses follow the application's standard response structure:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login with email and password |
| POST | `/api/auth/google` | Public | Authenticate using Firebase Google sign-in |
| GET | `/api/auth/me` | Authenticated | Get current user |
| PATCH | `/api/auth/me` | Authenticated | Update profile and learning preferences |
| PUT | `/api/auth/me/reminder` | Authenticated | Update reminder settings |
| PUT | `/api/auth/me/password` | Authenticated | Change password |
| POST | `/api/auth/me/fcm-token` | Authenticated | Register Firebase push token |

### Lessons

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/lessons` | Public/Optional Auth | List published lessons |
| GET | `/api/lessons/languages` | Public | List available languages |
| GET | `/api/lessons/:id` | Public | Get lesson details |
| POST | `/api/lessons` | Teacher/Admin | Create a lesson |
| POST | `/api/lessons/generate` | Teacher/Admin | Generate an AI lesson draft |
| PUT | `/api/lessons/:id` | Teacher/Admin | Update a lesson |
| DELETE | `/api/lessons/:id` | Teacher/Admin | Delete a lesson |

### Quizzes

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/quizzes` | Public | List quizzes |
| GET | `/api/quizzes/:id` | Public | Get a quiz without exposing answers |
| POST | `/api/quizzes/generate` | Authenticated | Generate an AI quiz |
| POST | `/api/quizzes` | Teacher/Admin | Publish a quiz |
| POST | `/api/quizzes/:id/attempts` | Authenticated | Submit and grade a quiz attempt |
| GET | `/api/quizzes/attempts/me` | Authenticated | Get current user's attempts |

### Progress and Streaks

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/progress` | Authenticated | Get dashboard progress summary |
| GET | `/api/progress/lessons/:id` | Authenticated | Get lesson progress |
| PUT | `/api/progress/lessons/:id` | Authenticated | Update lesson progress |
| GET | `/api/streaks` | Authenticated | Get streak and activity information |

### Speaking Practice

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/voice/attempts` | Authenticated | Submit speaking attempt and calculate similarity |
| GET | `/api/voice/attempts/me` | Authenticated | View speaking-practice history |

### Achievements

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/achievements` | Public | Get achievement catalog |
| GET | `/api/achievements/me` | Authenticated | Get user's achievement status |

### Friends

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/friends` | Authenticated | Get friends and requests |
| GET | `/api/friends/search?q=` | Authenticated | Search for users |
| POST | `/api/friends/requests` | Authenticated | Send friend request |
| PUT | `/api/friends/requests/:id` | Authenticated | Accept or decline request |
| DELETE | `/api/friends/:friendId` | Authenticated | Remove friend |

### Leaderboard

```text
GET /api/leaderboard?scope=global|friends&period=week|alltime
```

Supported scopes:

- `global`
- `friends`

Supported periods:

- `week`
- `alltime`

### Notifications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/notifications` | Authenticated | Get user notifications |
| PUT | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| PUT | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
| POST | `/api/notifications/lesson-reminder` | Authenticated | Send a lesson reminder |
| POST | `/api/notifications/announce` | Teacher/Admin | Broadcast announcement |

### Admin

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List/search users |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |

For the complete API reference, see [docs/API.md](docs/API.md).

## Real-Time Socket.io API

LinguaHub uses Socket.io for real-time updates.

### Connection

After connecting, the client authenticates with its JWT:

```javascript
socket.emit('authenticate', token);
```

Authenticated users are placed in a user-specific room:

```text
user:<userId>
```

### Server Events

The server can emit:

```text
xpUpdated
friendRequest
friendAccepted
notification
```

This allows open client sessions to receive updates without manually refreshing the page.

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

GROQ_API_KEY=
GROQ_MODELS=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_SERVICE_ACCOUNT_PATH=

FIREBASE_WEB_API_KEY=
FIREBASE_WEB_AUTH_DOMAIN=
FIREBASE_WEB_APP_ID=
FIREBASE_WEB_MESSAGING_SENDER_ID=
FIREBASE_WEB_VAPID_KEY=
```

### Required Configuration

At minimum, the server requires:

- `MONGODB_URI`
- `JWT_SECRET`

The server validates these values during startup and does not silently replace missing database or authentication configuration with fake data.

### Optional Configuration

`GROQ_API_KEY` enables AI-assisted lesson and quiz generation.

Firebase configuration enables Google authentication and push notifications where the corresponding Firebase services are configured.

If optional integrations are not configured, the core email/password authentication, lessons, quizzes, progress, streaks, achievements, friends, and in-app notification functionality can continue to operate according to the application configuration.

## Installation

### Prerequisites

Install the following before running the project:

- Node.js 18 or newer
- npm
- MongoDB Atlas account or local MongoDB installation
- Git

Optional:

- Firebase project for Google authentication and push notifications
- Groq API key for AI-generated learning content

### Clone the Repository

```bash
git clone https://github.com/Yashhh710/linguahub.git
cd linguahub
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create the environment file:

```bash
cp .env.example .env
```

If `.env.example` is not present in your local copy, create `.env` manually using the environment variable section above.

Add your MongoDB connection string and JWT secret before starting the server.

## Curriculum Import

The repository contains curriculum data in:

```text
data/curriculum/
```

The included curriculum contains content for Spanish, French, and Japanese, along with quiz and achievement data.

Before importing, use the dry-run command:

```bash
npm run import:curriculum:check
```

To actually import the curriculum into MongoDB:

```bash
npm run import:curriculum
```

The import process is designed to use upserts so it can be run again without intentionally creating duplicate curriculum records.

## Running the Project

### Development Mode

```bash
npm run dev
```

This starts the server with Nodemon so the application restarts automatically when backend files change.

### Production-Style Start

```bash
npm start
```

The default local address is:

```text
http://localhost:3000
```

Open the application in a browser and register a new account.

## Creating an Admin User

First register the account normally through the application.

Then run:

```bash
npm run make-admin -- your-email@example.com
```

The script promotes an existing user. It does not create a new account.

## Testing

Run the automated tests with:

```bash
npm test
```

The test suite uses Node's built-in test runner and focuses on reusable application logic such as:

- Streak calculations.
- Level and XP calculations.
- Timezone-aware date boundaries.
- Speaking similarity scoring.
- Other utility functions.

The pure utility tests do not require a running MongoDB database.

## Example User Flow

A typical learner workflow is:

```text
1. Register or sign in
       |
       v
2. Select a language
       |
       v
3. Browse available lessons
       |
       v
4. Open a lesson
       |
       v
5. Complete the lesson
       |
       v
6. Progress and XP are updated
       |
       v
7. Attempt a quiz
       |
       v
8. Quiz is graded by the server
       |
       v
9. XP, achievements, and streak information are updated
       |
       v
10. Realtime updates are sent through Socket.io
```

A social workflow can be:

```text
Search user
    -> Send friend request
    -> Accept request
    -> Friend activity becomes available
    -> Compare progress on leaderboard
```

## Security Considerations

The application includes several backend security mechanisms:

- Password hashing with bcryptjs.
- JWT authentication.
- Role-based authorization.
- Request validation with Express Validator.
- Rate limiting middleware.
- Centralized error handling.
- Protected admin routes.
- Server-side quiz grading.
- Environment-based secret management.
- Firebase Admin verification for Firebase-backed authentication flows.

Do not commit `.env` files, private keys, Firebase service-account credentials, MongoDB credentials, JWT secrets, or Groq API keys to the repository.

## Folder Details

### `src/config`

Contains application configuration and MongoDB connection logic.

### `src/models`

Contains Mongoose schemas used to represent application data in MongoDB.

### `src/routes`

Contains Express route modules for authentication, lessons, quizzes, progress, streaks, friends, achievements, leaderboard, notifications, voice practice, and administration.

### `src/services`

Contains reusable business logic and integrations such as:

- JWT token creation.
- Firebase Admin integration.
- Groq AI integration.
- Gamification logic.
- Achievement processing.

### `src/middleware`

Contains:

- Authentication middleware.
- Validation middleware.
- Error handling.
- Not-found handling.
- Rate limiting.

### `src/utils`

Contains reusable utility functions for dates, XP/gamification calculations, text similarity, HTTP errors, and asynchronous route handling.

### `data/curriculum`

Contains the application's curriculum and seed content.

### `scripts`

Contains command-line scripts for importing curriculum data and promoting an existing user to administrator.

### `public`

Contains the frontend application and its static assets.

### `tests`

Contains automated tests for reusable backend logic.

### `docs`

Contains API documentation.

## Deployment

The project includes a deployment entry point at:

```text
api/index.js
```

The live frontend/application deployment is available at:

```text
https://linguahub-xi.vercel.app/
```

For a production deployment, configure the required environment variables in the hosting provider before starting the application.

At minimum, production configuration should include a valid MongoDB connection string and a strong JWT secret. Configure Firebase and Groq values when their corresponding features are required.

## API Documentation

The complete API reference is available in:

```text
docs/API.md
```

It documents authentication, lessons, quizzes, progress, streaks, speaking practice, achievements, friends, leaderboards, notifications, administration, and Socket.io events.

## Current Curriculum

The repository contains curriculum resources for:

- Spanish
- French
- Japanese

Additional lesson and quiz content can be added through the teacher content-management APIs or by extending the curriculum data used by the import script.

## Design and Frontend

LinguaHub uses a modern learning-dashboard interface with a focus on:

- Clear navigation.
- Lesson discovery.
- Progress visualization.
- Gamification.
- Social learning.
- Responsive layouts.
- Reusable cards and learning components.

The frontend is intentionally lightweight and is served directly from the backend without a separate frontend compilation step.

## Backend Development Case Study Mapping

The project satisfies the main backend development requirements of the LinguaHub case study:

| Requirement | Implementation |
|---|---|
| Node.js backend | Node.js application with `src/server.js` |
| Express REST API | Express application and modular route files |
| MongoDB | MongoDB with Mongoose ODM |
| User management | User model and authentication routes |
| Lessons | Lesson model and lesson routes |
| Quizzes | Quiz and QuizAttempt models and routes |
| Progress | Progress model and progress routes |
| Streaks | Streak model and streak service logic |
| Gamification | XP events, levels, achievements, and streaks |
| JWT authentication | JWT token service and authentication middleware |
| Role-based authorization | Student, teacher, and admin access control |
| Validation | Express Validator middleware |
| WebSocket updates | Socket.io server and user rooms |
| Notifications | In-app notifications and Firebase integration |
| Teacher content creation | Protected lesson and quiz authoring routes |
| AI assistance | Optional Groq lesson and quiz generation |
| Speaking practice | Web Speech API with server-side similarity scoring |
| Leaderboards | Global/friends and weekly/all-time leaderboard APIs |
| Automated tests | Node.js built-in test runner |
| API documentation | `docs/API.md` |

## Future Improvements

Potential future improvements include:

- Expanded language curriculum.
- More advanced pronunciation analysis.
- Additional learning activities and question types.
- More detailed teacher analytics.
- More granular administrator analytics.
- Improved notification scheduling.
- Additional real-time collaborative learning features.
- Expanded automated API and integration test coverage.
- Dedicated frontend build tooling if the application grows beyond the current static frontend architecture.

## License

This project is developed for educational and academic purposes.

If you plan to reuse or distribute the project, add an appropriate open-source license file and update this section with the selected license terms.

## Author

LinguaHub was developed as a B.Tech Computer Science Engineering backend development project.

Repository: https://github.com/Yashhh710/linguahub

Live Application: https://linguahub-xi.vercel.app/
