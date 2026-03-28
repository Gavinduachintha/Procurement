# Procurement Frontend

React + Vite frontend for the University Procurement System.

## Features

- **User Authentication**: JWT-based login system
- **Role-Based Access**: Different dashboards for different user roles
- **Request Management**: Submit and track procurement requests
- **Specification Review**: Officers can review technical specifications
- **Approval Workflow**: Multi-level approval process
- **Procurement Management**: Supply branch handles procurement methods and supplier selection
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── api/                    # API client and endpoints
├── components/             # Reusable UI components
├── pages/                  # Page components
└── App.jsx                # Main app component
```

## User Roles

- **REQUESTING_OFFICER**: Submit purchase requests
- **DIRECTOR_ICT**: Review IT specification requests
- **MAINTENANCE_ENGINEER**: Review non-IT specification requests
- **DEAN/REGISTRAR/BURSAR/VICE_CHANCELLOR**: Approve requests
- **SUPPLY_BRANCH**: Manage procurement process
- **SUBJECT_CLERK**: Assist with procurement tasks

## Demo Credentials

See login page for demo credentials.
