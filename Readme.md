
# 🎬 StreamVid – Backend for Video Streaming Platform
<p style="text-align:justify;">It is a scalable backend system built for a video streaming platform. It can handle user authentication, video uploads, video streaming, comments, likes, subscriptions, and more. The goal of this project is to showcase backend engineering skills while emphasizing clean architecture, scalability, and real-world production readiness.</p>


## 🎥 Demo

[![Watch the video](https://img.youtube.com/vi/<VIDEO_ID>/0.jpg)](https://www.youtube.com/watch?v=<VIDEO_ID>)


## ✨ Key Highlights

- Modular Architecture → Clean separation of concerns for scalability and maintainability.

- RESTful APIs → Well-structured endpoints for seamless integration with frontend/mobile apps.

- Authentication & Authorization → Secure user management with JWT-based authentication.

- Video Upload & Streaming → Chunked uploads, optimized storage, and adaptive bitrate streaming.

- Engagement Features → Likes, comments, and subscriptions to simulate a real-world platform.

- Database Design → Optimized relational schema with indexes for performance.

- Error Handling & Logging → Centralized error handler with structured logging.

- Scalability in Mind → Supports horizontal scaling and cloud deployment.

## 🛠️ Tech Stack

- Backend Framework: Node.js with Express.js

- Database: MongoDB

- Authentication: JWT & bcrypt

- Video Uploads: Multer

- Cloud & Storage: Cloudinary

**Other Tools:**

- Multer for file uploads

- MongoDB atlas for cloud database

- Render for deployment

## 📌 Features Implemented

- User Management

- Sign up, login, password hashing

- Profile updates

- JWT-based session handling

- Video Management

- Upload, process, and stream videos

- Video metadata management (title, description, tags)

## Community Features

- Likes & comments on videos

- Subscribe/Unsubscribe to channels

- Watch history

- User management


## 📌 API Endpoints (Quick Reference)

| Method | Endpoint                 | Description            | Auth Required |
|--------|--------------------------|------------------------|---------------|
| POST   | /api/v1/users/register   | Register a new user    | ❌ |
| POST   | /api/v1/users/login      | Login and get token    | ❌ |
| GET    | /api/v1/videos/:id       | Stream a video         | ✅ |
| POST   | /api/v1/videos/upload    | Upload a new video     | ✅ |
| POST   | /api/v1/videos/:id/comment| Add comment on a video | ✅ |



📖 Full API documentation available in [StreamVid Postman Collection](./docs/streamvid-api.postman_collection.json)

## 🧩 System Design Considerations

Scalability: Designed with microservices in mind for future expansion.

Performance: Indexes on frequently queried fields; caching layer with Redis (if implemented).

Security: Input validation, encrypted passwords, JWT for secure authentication.

Streaming: Videos are encoded and chunked for smooth playback.

## 🚀 Getting Started

You don’t need to set up anything locally to try out the APIs — the backend is **live and deployed on Render** 🎉  

👉 **Base URL:** [https://streamvid-backend.onrender.com](https://streamvid-8hve.onrender.com)  
👉 **HealthCheck:** [https://streamvid-backend.onrender.com/api/v1/healthcheck](https://streamvid-8hve.onrender.com/api/v1/healthcheck)

### 📌 Quick Demo
- Open the Postman Collection (provided below).  
- Import it into Postman.  
- Replace `{{base_url}}` with the Render deployment URL above.  
- Start testing APIs instantly — no local setup required.  

---

### ⚙️ Local Setup (Optional)
If you’d like to run the project locally:  

#### Prerequisites  
- Node.js v18+  
- MongoDB Atlas URI (for database)
- Cloudinary API Keys (for file storage)  

#### Installation  
```bash
git clone https://github.com/your-username/streamvid-backend.git
cd streamvid-backend
npm install
npm run dev
```

🧪 Testing

Test APIs directly on the deployed server using the provided Postman collection and Render base URL.

## 📈 Future Enhancements

- Implement GraphQL API for more flexible data fetching

- Add Recommendation Engine with collaborative filtering

- Introduce Live Streaming module

- Implement CI/CD pipeline with GitHub Actions

## 👨‍💻 About Me

<p style="text-align:justify;">I am a Computer Science student aspiring to build a career in backend engineering. I enjoy building scalable and real-world applications that solve practical problems. This project reflects my ability to design, implement, and document a production-style backend system.</p>

📌 Connect with me on [LinkedIn](https://linkedin.com/in/pankaj-kumar98/)

🔥 This repository demonstrates not just coding skills, but also system design thinking and project execution in a way similar to real-world backend services.
