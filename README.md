<div align="center">

# 🔐 RSA Secure Chat Application

*Zero-Knowledge, End-to-End Encrypted Real-Time Messaging Platform*

A high-performance, cryptographically secure chat application built with modern web technologies. This platform ensures absolute privacy through client-side RSA encryption, meaning the server never sees your plaintext messages or private keys.

[![React](https://img.shields.io/badge/React_v19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

![Banner Image Placeholder](/api/placeholder/1200/300)

[**Live Demo**](#-live-demo) •
[**Features**](#-features) •
[**Tech Stack**](#-tech-stack) •
[**Architecture**](#-architecture--workflow) •
[**Installation**](#-installation) •
[**API Docs**](#-api-documentation)

</div>

---

## 📑 Table of Contents
<details>
<summary>Click to expand</summary>

- [📖 About the Project](#-about-the-project)
- [🌐 Live Demo](#-live-demo)
- [📸 Screenshots](#-screenshots--preview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🔀 Architecture / Workflow](#-architecture--workflow)
- [📂 Folder Structure](#-folder-structure)
- [🚀 Installation](#-installation)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Documentation](#-api-documentation)
- [🗄 Database Schema / Models](#-database-schema--models)
- [🛡 Authentication and Authorization](#-authentication-and-authorization)
- [🔒 Security Features](#-security-features)
- [🎨 UI/UX](#-uiux)
- [☁️ Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [⚡ Performance Optimization](#-performance-optimization)
- [🐛 Troubleshooting](#-troubleshooting)
- [🗺 Roadmap / Future Improvements](#-roadmap--future-improvements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author--contact)
</details>

---

## 📖 About the Project

**RSA Secure Chat** is a state-of-the-art secure communication platform designed for users who demand absolute privacy. Leveraging the Web Crypto API, all messages are encrypted and decrypted directly in the user's browser using 2048-bit RSA keys. 

**Why was it built?** In an era of data breaches and intrusive monitoring, privacy is paramount. Many platforms claim to be "secure" but hold the keys to user data on their servers. This project was built to implement a true zero-knowledge architecture where the server acts merely as a blind relay.

**Target Audience:** Security-conscious individuals, enterprises requiring confidential communication channels, journalists, and anyone valuing digital privacy.

**Main Goals:**
- Provide uncompromising data security via End-to-End Encryption (E2EE).
- Maintain a seamless, beautiful, and highly responsive user experience.
- Ensure cross-device real-time communication.

**Unique Selling Points:**
- 🛡️ **True Zero-Knowledge:** The central server never holds plaintext messages or private keys.
- 🔑 **Cryptographic Integrity:** Utilizes RSA-OAEP for encryption and RSA-PSS for digital signatures.
- ⚡ **Real-Time Speed:** Powered by Socket.io for instantaneous message delivery.

---

## 🌐 Live Demo

| Resource | Link |
|----------|------|
| **Live Website** | [https://rsa-secure-chat-demo.vercel.app](https://rsa-secure-chat-demo.vercel.app/) _(Placeholder)_ |
| **Frontend Deployment** | [Vercel Deployment URL](#) |
| **Backend API** | [https://api.rsa-secure-chat.com](#) _(Placeholder)_ |
| **Demo Video** | [Watch on YouTube](#) _(Placeholder)_ |

---


---

## ✨ Features

### 🔐 Authentication & Security Features
* **Zero-Knowledge Architecture:** Private keys are generated client-side and never leave the browser unencrypted.
* **JWT-Based Authentication:** Secure, stateless session management using HttpOnly cookies.
* **Google OAuth Integration:** Seamless sign-up and login securely linked to the platform.
* **Digital Signatures (RSA-PSS):** Ensures messages are authentic and haven't been tampered with.

### 💬 Messaging Features
* **Real-time Engine:** Instant messaging capabilities powered by Socket.io.
* **E2E Encryption:** Messages encrypted with RSA-OAEP before they leave the device.
* **Self-Decryption History:** Sender's message history is encrypted with their own public key so they can read their sent messages securely.
* **Read Receipts & Delivery Status:** Know exactly when your messages reach their destination.

### 👥 User & Contact Features
* **Global User Search:** Find and add users directly via their unique backend ID or Username.
* **Profile Management:** Update bio, rotate cryptographic keys, and manage session status.
* **Contact Management:** Maintain a secure, localized address book of trusted contacts.

### 🎨 UI/UX Features
* **Glassmorphic Design:** Modern, sleek interface with dynamic gradient backgrounds and smooth animations.
* **Real-time Typing Indicators:** Visual feedback (`animate-bounce`) when a contact is composing a message.
* **Toast Notifications:** Non-intrusive alerts for errors, successes, and incoming messages.
* **Responsive Layouts:** Perfect rendering across mobile, tabular, and desktop devices utilizing Tailwind CSS.

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend Framework** | React 19 | Building robust, reactive user interfaces with modern hooks. |
| **Build Tool** | Vite | Ultra-fast frontend tooling and Hot Module Replacement (HMR). |
| **Styling** | Tailwind CSS v3 | Utility-first CSS for rapid, scalable UI development. |
| **Icons** | Lucide React | Beautiful, consistent open-source icon set. |
| **Routing** | React Router DOM v7 | Dynamic, client-side routing for seamless page transitions. |
| **Backend Framework** | Node.js & Express.js | High-performance, scalable RESTful API server. |
| **Database** | MongoDB & Mongoose | NoSQL database for flexible data modeling and rapid querying. |
| **Real-time Engine** | Socket.io | Bidirectional event-based communication for instant messaging. |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs | Secure password hashing and stateless session handling. |
| **Cryptography** | Web Crypto API / Node Crypto | Secure key generation, RSA encryption/decryption, and signing. |
| **Security Middleware** | Helmet & Express Rate Limit | API protection against XSS, clickjacking, and DDoS attacks. |

---

## 🔀 Architecture / Workflow

The platform operates on a robust E2EE (End-to-End Encrypted) architecture:

```text
+-----------------------+                            +-----------------------+
|   Alice (Sender)      |                            |     Bob (Receiver)    |
|-----------------------|                            |-----------------------|
| 1. Generates Key Pair |                            | 1. Generates Key Pair |
| 2. Private Key stays  |                            | 2. Private Key stays  |
|    in browser context |                            |    in browser context |
| 3. Fetches Bob's      |                            |                       |
|    Public Key         |                            |                       |
| 4. Encrypts Msg with  |-------[Ciphertext]-------->|                       |
|    Bob's Public Key   |                            |                       |
| 5. Signs Msg with     |-------[Signature]--------->| 6. Decrypts Msg with  |
|    Alice's Private Key|                            |    Bob's Private Key  |
|                       |                            | 7. Verifies Hash &    |
|                       |<======[Ack Payload]========|    Signature with     |
|                       |                            |    Alice's Public Key |
+-----------+-----------+                            +-----------+-----------+
            |                                                    ^
            v                                                    |
+-------------------------------------------------------------------------+
|                              Backend Server                             |
|-------------------------------------------------------------------------|
| - Authenticates Users via JWT / Cookies                                 |
| - Relays Encrypted Payloads via Socket.io / REST endpoints              |
| - Only sees 'Ciphertext' and 'Signature' string blobs.                  |
| - Has ZERO KNOWLEDGE of message plaintext or user private keys.         |
+-------------------------------------------------------------------------+
```

---

## 📂 Folder Structure

```text
rsa-secure-chat/
├── rsa-demo-backend/           # Backend Node.js Environment
│   ├── src/
│   │   ├── config/             # DB connection, Socket setup, CORS configs
│   │   ├── controllers/        # Request handlers (auth, users, messages)
│   │   ├── middleware/         # Auth verification, rate limiters, error handlers
│   │   ├── models/             # Mongoose schemas (User, Message)
│   │   ├── routes/             # Express routing configuration
│   │   ├── services/           # Nodemailer, external APIs logic
│   │   ├── utils/              # Cryptographic helpers, constants
│   │   └── app.js              # Express App Entry Point
│   ├── .env                    # Backend Environment variables
│   └── package.json            # Backend Dependencies
│
├── rsa-demo-frontend/          # Frontend React/Vite Environment
│   ├── src/
│   │   ├── assets/             # Static files, images
│   │   ├── components/         # Reusable UI parts (Buttons, Alerts, Layout)
│   │   ├── pages/              # Main route views (Dashboard, Login, Landing)
│   │   ├── utils/              # API wrappers, Crypto logic (WebCrypto handlers)
│   │   ├── App.jsx             # React Router Setup
│   │   ├── index.css           # Global Tailwind & Custom Styles
│   │   └── main.jsx            # React Entry Point
│   ├── tailwind.config.js      # Tailwind theme configuration
│   ├── vite.config.js          # Vite configuration
│   ├── .env                    # Frontend Environment variables
│   └── package.json            # Frontend Dependencies
└── README.md                   # You are here
```

---

## 🚀 Installation

Follow these steps to run the application locally from scratch:

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/rsa-secure-chat.git
cd rsa-secure-chat
```

**2. Setup Backend**
```bash
cd rsa-demo-backend
npm install
```

**3. Setup Frontend**
```bash
# Open a new terminal tab/window
cd rsa-demo-frontend
npm install
```

**4. Create `.env` files**
Copy the `.env.example` files to `.env` in both backend and frontend directories and fill in the required variables (See [Environment Variables](#-environment-variables) section below).

**5. Start the Application**
```bash
# In backend directory
npm run dev

# In frontend directory
npm run dev
```

**6. Open Browser**
Navigate to `http://localhost:5173` to view the application!

---

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables.

### Backend (`rsa-demo-backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rsachat?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
COOKIE_SECRET=your_super_secret_cookie_key

# Security
BCRYPT_ROUNDS=10

# OAuth Integrations (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service (Optional for forgot password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend (`rsa-demo-frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=development
```

---

## 📡 API Documentation

Base URL: `/api/v1`

| Method | Endpoint | Description | Auth Req. | Required Body | Expected Response |
|--------|---------|-------------|-----------|---------------|-------------------|
| `POST` | `/auth/register` | Create a new user account | No | `username, email, password, publicKey, privateKey` | User object & Auth Token |
| `POST` | `/auth/login` | Authenticate user | No | `email, password` | Auth Token in Cookie |
| `GET`  | `/auth/me` | Get current logged-in user session | Yes | - | User details |
| `GET`  | `/users/search` | Find users to chat with | Yes | `query=` (URL param) | Array of User objects |
| `POST` | `/messages/send` | Send an encrypted message | Yes | `receiverId, ciphertext, signature, hash, senderCiphertext` | Saved Message object |
| `GET`  | `/messages/sync` | Fetch message history with a user | Yes | `contactId=` (URL param) | Array of Encrypted Messages |
| `PATCH`| `/users/rotate-keys`| Generate & update RSA keys | Yes | `publicKey, privateKey` | Success acknowledgment |

---

## 🗄 Database Schema / Models

The database is built on MongoDB, managed via Mongoose.

### 1. `User` Model
Stores identity and cryptographic metadata.
* `username`: String (Unique, Lowercase)
* `email`: String (Unique)
* `password`: String (Bcrypt Hashed, `select: false`)
* `publicKey`: String (PEM encoded RSA Public Key)
* `privateKey`: String (PEM encoded RSA Private Key encrypted locally, `select: false`)
* `isOnline`: Boolean (Tracks Websocket presence)
* `contacts`: Array of User ObjectIds

### 2. `Message` Model
Stores encrypted messaging blobs. Features high-performance compound indexing for fast lookups.
* `sender`: ObjectId (Ref User)
* `receiver`: ObjectId (Ref User)
* `ciphertext`: String (Encrypted payload for receiver)
* `senderCiphertext`: String (Encrypted payload for sender's history view)
* `signature`: String (For integrity verification)
* `hash`: String (SHA-256 digest)
* `isRead`, `isVerified`: Booleans

---

## 🛡 Authentication and Authorization

* **Signup Flow**: User signs up, frontend generates RSA KeyPair via WebCrypto -> Server stores user details and issues HttpOnly JWT Cookie.
* **Login Flow**: Server validates Bcrypt hashed password -> Issues HttpOnly JWT Cookie.
* **Session Persistence**: React hits `/api/auth/me` on mount to verify the HttpOnly cookie and restore global application state.
* **Protected Routes**: Express Middleware checks for the presence of the valid JWT cookie before allowing access to API clusters.

---

## 🔒 Security Features

Security is the cornerstone of this application:
* **End-to-End Encryption (E2EE):** RSA-OAEP algorithm utilizing 2048-bit keys.
* **Zero-Knowledge Architecture:** No decipherable data exists on the backend.
* **Protection from XSS attack:** Sensitive JWT tokens are stored in HttpOnly, secure `.cookies`.
* **Database Injection Protection:** Mongoose ORM usage natively sanitizes payload inputs.
* **CORS Whitelisting:** Strict API gating to predefined URLs.
* **Helmet.js:** Implementation to secure Express apps by setting optimal HTTP response headers.
* **Rate Limiting:** Prevents brute-force credential stuffing.

---

## 🎨 UI/UX

* **Architectural Glow:** The UI uses abstract glassmorphic panels against a soft background (`.bg-architectural-glow`).
* **Micro-interactions:** Hover effects (`.glow-hover`), tone-transitions, and typography staggered-reveals are baked natively into the CSS.
* **Responsive Architecture:** Flex and Custom CSS grid queries ensure the contact bar behaves perfectly across mobiles, tablets, and full desktops.
* **Accessibility:** Semantic HTML elements, contrasting text ratios, and clean aria-label structures.

---

## ☁️ Deployment

### Frontend (Vercel)
1. Push your code to GitHub.
2. Sign in to Vercel and import the `rsa-demo-frontend` folder.
3. Configure Environment Variable: `VITE_API_URL` (Set to your deployed backend URL).
4. Build command: `npm run build`. 
5. Output directory is automatically set to `dist`.

### Backend (Render / Heroku)
1. Deploy the `rsa-demo-backend` folder as a Node Web Service.
2. Ensure you specify the environment variables including `MONGO_URI`, `CLIENT_URL` (Your Vercel URL), and `JWT_SECRET`.
3. Build command: `npm install`.
4. Start command: `npm start`.

---

## 🧪 Testing

We ensure robustness through dedicated endpoints and comprehensive testing:
* **API Testing:** Postman collections are included in the repository for simulating client connections and payload deliveries.
* **Client Simulation:** Tests include mock RSA WebCrypto generation tests.

---

## ⚡ Performance Optimization

* **Compound Indexing:** MongoDB indexes `{ sender: 1, receiver: 1 }` to dramatically speed up conversation retrievals.
* **WebSockets over Polling:** Realtime Socket.io ensures efficient data streaming over traditional HTTP polling.
* **Vite Rollup Optimization:** Code-splitting active for React routes allowing significantly smaller initial Javascript bundles.
* **Stateless API:** Minimal server memory consumption as the server does not hold active state caches.

---

## 🐛 Troubleshooting

* **MongoDB Connection Error:** Ensure your `MONGO_URI` IP Address is whitelisted in MongoDB Atlas Network Access pane.
* **CORS Issues:** Ensure `CLIENT_URL` in backend `.env` matches your exact frontend URL (Watch out for trailing slashes!).
* **Socket Disconnects:** Ensure proxying logic in Vite matches the backend or backend CORS supports the deployed client origin.

---

## 🗺 Roadmap / Future Improvements

- [ ] Add attachments/file sending (client-side AES encrypted, packaged).
- [ ] Group Chat functionality (using shared symmetric keys managed via RSA).
- [ ] Implement Offline Mode (IndexedDB storage of RSA keys).
- [ ] Push Notification Web APIs implementation.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author / Contact

**Gagandeep Singh**

* **Email** - [Pl
* **GitHub** - [https://github.com/GAGANDEEP0-SINGH-07](https://github.com/GAGANDEEP0-SINGH-07)
* **LinkedIn** - [Placeholder LinkedIn URL](https://www.linkedin.com/in/gagandeep-singh-saini07/)

---
<p align="center">Made with ❤️ for privacy and security.</p>
