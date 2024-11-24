# Personal Portfolio Website

## **Demo**
[Live Site](https://www.kushagrabharti.com)

A dynamic, full-stack portfolio website to showcase my professional experience, education, and projects. This project features a responsive frontend built with React and TailwindCSS, a backend API built with Node.js and Express.js, and seamless integration for serving dynamic content.

## **Features**
- Interactive UI showcasing education, projects, and work experiences.
- Reusable and modular React components.
- Dynamic data served from a Node.js backend via RESTful APIs.
- Responsive design using TailwindCSS for modern styling.
- Stateful modals for detailed project and experience descriptions.
- Secure API communication with CORS middleware.

## **Tech Stack**
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Typescript, Express.js
- **Deployment**: Vercel
- **APIs**: Axios for API communication

---

## **Getting Started**

### **Prerequisites**
- Node.js, npm, and yarn installed on your system
- Basic knowledge of JavaScript, TypeScript, and React

### **Setup**

#### Clone the repository:
```bash
git clone https://github.com/KushagraBharti/personal-portfolio.git
cd personal-portfolio
```

### Frontend Setup
```bash
cd frontend
touch .env.local
yarn install
```

### Add the following code to the .env.local file

```VITE_API_BASE_URL=http://localhost:5000```

### Backend Setup
```bash
cd backend
yarn install
```

## **Initializing Local Environment**

### Frontend Server
```bash
cd frontend
yarn vite dev
```

### Backend Server
```bash
cd backend
yarn dev
```