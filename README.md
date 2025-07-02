# URL Shortener System

This project is a Microservices-based URL Shortener System built using Java Spring Boot, PostgreSQL, and Redis.
It is designed to be modular, scalable, and production-ready with Docker containerization and JWT-based authentication.

## 📚 Project Structure

The system is divided into three main microservices:

Service 1: Authentication Service Handles user registration, login, and JWT token generation.
Service 2: API Service Manages creation of short URLs, redirects, and interacts with Redis/PostgreSQL.
Service 3: Analytics Service Tracks URL usage analytics like click counts and stores them in PostgreSQL.

More Services will be added as each goal reaches.....

## 🚀 Tech Stack

Backend Framework: Java Spring Boot 3.x
Database: PostgreSQL
Caching Layer: Redis
Authentication: JWT (JSON Web Tokens)
Containerization: Docker, Docker Compose
Build Tool: Maven
Security: Spring Security, BCrypt Password Encoding

## 🛠️ Key Features

Shorten any long URL with a unique shortcode.
User authentication with secure password hashing and JWT tokens.
Access analytics for each short URL (click counts, basic user metadata).
Fast redirection using Redis caching.
Clean, modular microservices architecture.
Ready for CI/CD integration and cloud deployment.

## 📂 Folder Structure

**Service1**

url-shortener-system/
│
├── auth-service/
├── README.md

**Service2**

url-shortener-system/
│
├── api-service/
├── README.md

**Service3**

url-shortener-system/
│
├── analytics-service/
├── README.md

## ⚙️ How to Run Locally

Clone the repository

<img align="left" alt="Java" width="30px" style="padding-right:10px;" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" />

```git clone <repository url>```

cd url-shortener-system

Build the services

./mvnw clean install

## 📈 Future Improvements

- Expiry settings for short URLs.
- User-specific URL dashboard.
- Kubernetes deployment support (K8s YAMLs).
- OAuth2 login (Google, GitHub).``

✨ Contributing

Contributions are welcome!
Feel free to fork the repository, open issues, or submit pull requests

## BUILT WITH

- A lot of interest and respect towards Knowledge.
- An International Student @NORTHEASTERN_UNIVERSITY

## 🚀MADE BY BURRA SAI KALYAN
