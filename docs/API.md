# LinguaHub API reference

Base URL: `/api`. Authenticated routes expect `Authorization: Bearer <token>`. All responses are `{ success: boolean, data?: ..., message?: string }`.

## Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create an account (name, email, password, learningLanguage, timezone) |
| POST | `/login` | — | Email + password login |
| POST | `/google` | — | Exchange a Firebase ID token for a LinguaHub session |
| GET | `/me` | ✓ | Current user profile |
| PATCH | `/me` | ✓ | Update name / nativeLanguage / learningLanguages / dailyGoalMinutes / timezone |
| PUT | `/me/reminder` | ✓ | Toggle/adjust the daily reminder |
| PUT | `/me/password` | ✓ | Change password |
| POST | `/me/fcm-token` | ✓ | Register a browser push token |

## Lessons — `/api/lessons`
| GET | `/` | optional | List published lessons (`?language=&level=`), flags `completed` if signed in |
| GET | `/languages` | — | Distinct languages with published lessons |
| GET | `/:id` | — | One lesson, full content |
| POST | `/` | teacher/admin | Create a lesson |
| POST | `/generate` | teacher/admin | AI-draft a lesson (not saved until POST `/`) |
| PUT/DELETE | `/:id` | teacher/admin (own) | Edit / remove |

## Quizzes — `/api/quizzes`
| GET | `/` , `/:id` | — | List / fetch (answers withheld) |
| POST | `/generate` | ✓ | AI-generate a quiz (not saved) |
| POST | `/` | teacher/admin | Publish a quiz |
| POST | `/:id/attempts` | ✓ | Submit answers — graded server-side, awards XP |
| GET | `/attempts/me` | ✓ | Your attempt history |

## Progress & streaks
| GET | `/api/progress` | ✓ | Dashboard summary: totals, weekly XP, recent activity |
| GET/PUT | `/api/progress/lessons/:id` | ✓ | Read/update one lesson's progress; `completed:true` awards XP once |
| GET | `/api/streaks` | ✓ | Current/longest streak, available freezes, and a 30-day activity/protected-day calendar |

## Voice practice — `/api/voice`
| POST | `/attempts` | ✓ | Submit `{language, expectedText, heardText}`; server scores similarity, awards XP |
| GET | `/attempts/me` | ✓ | History |

## Achievements — `/api/achievements`
| GET | `/` | — | Full catalog |
| GET | `/me` | ✓ | Catalog with your unlocked/locked state |

## Friends — `/api/friends`
| GET | `/` | ✓ | Friends + incoming/outgoing requests |
| GET | `/search?q=` | ✓ | Find users by name/email |
| POST | `/requests` | ✓ | Send a friend request |
| PUT | `/requests/:id` | ✓ | Accept/decline |
| DELETE | `/:friendId` | ✓ | Remove a friend |

## Leaderboard — `/api/leaderboard?scope=global|friends&period=week|alltime`
Global or friends-only, weekly (from XP event log) or all-time (from total XP).

## Notifications — `/api/notifications`
| GET | `/` | ✓ | Your notifications |
| PUT | `/:id/read`, `/read-all` | ✓ | Mark read |
| POST | `/lesson-reminder` | ✓ | Push yourself a reminder now |
| POST | `/announce` | teacher/admin | Broadcast to all students |

## Admin — `/api/admin` (admin only)
| GET | `/stats` | Platform totals |
| GET | `/users` | List/search users |
| PUT | `/users/:id/role` | Promote/demote a role |

## Realtime (Socket.io)
Client emits `authenticate` with the JWT after connecting, joining room `user:<id>`. Server emits `xpUpdated`, `friendRequest`, `friendAccepted`, `notification` to that room.
