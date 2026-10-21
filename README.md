 
<div align="center">

# 🍔 FoodDash

### ⚡ A Modern Food Delivery Platform

**Discover restaurants. Order your favorite meals. Get them delivered.**

A full-stack food delivery application built with React Native, Expo, Node.js, Express, and MongoDB.

<br />

![Status](https://img.shields.io/badge/Status-In%20Development-FF6B1A?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-C6F54A?style=for-the-badge&labelColor=1B1E21)
![License](https://img.shields.io/badge/License-MIT-25292D?style=for-the-badge)

<br />

[Features](#-features) • [Tech Stack](#-tech-stack) • [Screenshots](#-screenshots) • [Installation](#-installation) • [Project Structure](#-project-structure)

</div>

---

## 🌟 About FoodDash

FoodDash is a full-stack food delivery platform designed to connect customers, restaurants, delivery riders, and administrators in one system.

The platform includes restaurant discovery, menu browsing, cart management, order placement, order tracking, business management, rider operations, and administrative tools.

The project is being developed with a focus on a clean user experience, role-based access, maintainable architecture, and responsive design.

## ✨ Features

<table>
<tr>
<td width="50%">

### 🛍️ Customer Experience

- 🍽️ Browse available restaurants
- 🔎 Search and discover food
- 🥗 Explore cuisines and categories
- 🛒 Add items to the cart
- 📦 Place and manage orders
- 📍 Save and manage addresses
- 🔄 View order status updates
- 👤 Manage account and profile

</td>
<td width="50%">

### 🏪 Restaurant Management

- 📊 Business dashboard
- 🍔 Manage menu items
- 🗂️ Manage food categories
- 📋 View incoming orders
- 🔔 Monitor order status
- 🕒 Configure opening hours
- 🖼️ Manage restaurant images
- ⚙️ Update restaurant details

</td>
</tr>
<tr>
<td width="50%">

### 🛵 Delivery Rider

- 📱 Rider dashboard
- 🟢 Manage availability
- 📋 View available deliveries
- ✅ Accept delivery orders
- 📦 Manage assigned orders
- 🚚 Update delivery progress

</td>
<td width="50%">

### 🛡️ Administration

- 👥 Manage user applications
- 🛵 Review rider applications
- 🏪 Manage restaurants
- 📊 Access administrative dashboards
- ✅ Approve or reject applications
- 🔐 Role-based access control

</td>
</tr>
</table>

> **Note:** Features are subject to ongoing development. The final feature set may change as the project evolves.

## 🎨 UI & Design

FoodDash uses an **Electric Citrus** inspired design direction, combining dark graphite surfaces with vibrant citrus accents.

| Design Element | Color |
|---|---|
| 🖤 Background | `#0B0D0F` |
| 🌑 Surface | `#1B1E21` |
| 🟠 Primary Accent | `#FF6B1A` |
| 🟢 Lime Accent | `#C6F54A` |
| 🤍 Main Text | `#F5F5F0` |
| 🩶 Secondary Text | `#B8BEC3` |

Design goals:

- 📱 Responsive, mobile-first interface
- 🎯 Clear navigation and visual hierarchy
- 🌙 Dark-themed user experience
- 🧩 Reusable UI components
- ⚡ Smooth, intuitive interactions

## 🧰 Tech Stack

<div align="center">

### Frontend

<img src="https://skillicons.dev/icons?i=react,typescript,expo" alt="React, TypeScript and Expo" />

### Backend

<img src="https://skillicons.dev/icons?i=nodejs,express,mongodb" alt="Node.js, Express and MongoDB" />

### Tools & Workflow

<img src="https://skillicons.dev/icons?i=git,github,vscode" alt="Git, GitHub and VS Code" />

</div>

| Technology | Purpose |
|---|---|
| React Native | Cross-platform application UI |
| Expo | Application development and web support |
| TypeScript | Type-safe frontend development |
| Expo Router | File-based application navigation |
| Node.js | Backend runtime |
| Express.js | REST API and server routing |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication tokens |
| Axios | HTTP requests to the backend |
| Git & GitHub | Version control and source management |

## 📸 Screenshots

Add screenshots of your actual application here as the UI develops.

Create a `screenshots` folder in the repository and add images such as:

- `home.png` — Customer home screen
- `restaurant.png` — Restaurant details
- `cart.png` — Shopping cart
- `orders.png` — Order tracking
- `business.png` — Restaurant dashboard
- `rider.png` — Rider dashboard
- `admin.png` — Admin dashboard

Example layout:

<div align="center">

| 🏠 Home Screen | 🍔 Restaurant Menu |
|:---:|:---:|
| Add home screenshot | Add menu screenshot |

| 🛒 Cart & Checkout | 📦 Order Tracking |
|:---:|:---:|
| Add cart screenshot | Add order screenshot |

</div>

Replace the placeholders with real screenshots when ready. Do not commit private information, access tokens, or customer data in screenshots.

## 🏗️ Project Structure

```text
food-app/
│
├── src/
│   ├── app/
│   │   ├── business/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── addresses/
│   │   └── ...
│   │
│   ├── components/
│   ├── services/
│   └── stores/
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── assets/
├── package.json
└── README.md
```

*The structure above is illustrative. Actual files and folders may differ.*

## ⚙️ Installation

### 1. Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go/) (optional, for compatible mobile testing)
- A MongoDB Atlas account or another supported MongoDB instance

### 2. Clone the repository

```bash
git clone https://github.com/Shazan99v/foodDash.git
cd food-app
```

If you cloned into a different directory, use that directory's name instead of `food-app`.

### 3. Install frontend dependencies

From the project root:

```bash
npm install
```

### 4. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure your own environment variables. Use the variable names expected by your backend code.

Typical configuration may include:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
```

**Important:** These are example variable names. Check `server.js` and your configuration files to confirm the exact names your project expects. Never commit real credentials or secrets.

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:5000
```

### 6. Start the frontend

Open a second terminal in the project root:

```bash
npx expo start --web
```

For other Expo development options:

```bash
npx expo start
```

The frontend and backend must both be running for features that require API access.

> **Local development:** The current API configuration uses `http://localhost:5000/api`. For mobile devices or production deployment, configure the API base URL for the target environment.

## 🔌 API Overview

The backend exposes REST API endpoints for different application modules.

| Module | Purpose |
|---|---|
| Authentication | Registration, login, and user authentication |
| Customer Catalog | Restaurant discovery and browsing |
| Cart | Shopping cart operations |
| Customer Orders | Order creation and order management |
| Business | Restaurant and menu management |
| Rider | Delivery availability and order operations |
| Admin | Administrative management |
| Uploads | Image and file handling |

The exact endpoints, request formats, and permissions are defined in the backend route files.

## 🔐 Security

- Store credentials and secrets in environment variables.
- Never commit `.env` files containing real secrets.
- Keep authentication and authorization checks on the backend.
- Validate incoming request data.
- Configure production CORS rules for trusted origins.
- Use HTTPS when deploying to production.
- Restrict database access to trusted environments.

## 🚀 Roadmap

- [x] Initial full-stack project setup
- [x] Customer restaurant catalog API
- [x] Core customer ordering workflow
- [x] Restaurant management foundations
- [x] Rider and admin workflow foundations
- [ ] Complete end-to-end testing
- [ ] Refine responsive UI across screens
- [ ] Improve error handling and loading states
- [ ] Configure production deployment
- [ ] Add more automated tests

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request describing your improvements.

## 👨‍💻 Developer

<div align="center">

### Shazan Gull

**Full-Stack Web Developer | Mobile App Developer | AI Chatbot Developer**

Building practical applications with modern web technologies.

[![GitHub](https://img.shields.io/badge/GitHub-Shazan99v-181717?style=for-the-badge&logo=github)](https://github.com/Shazan99v)

</div>

## 📄 License

This project is distributed under the MIT License if the repository's license terms permit it. Add a `LICENSE` file before presenting the project as officially licensed under MIT.

---

<div align="center">

### 🍔 FoodDash — Bringing Great Food Closer to You

**Built with ❤️ and modern technology.**

⭐ If you like this project, consider giving the repository a star!

</div>
