# App Specification

You are building a cross-platform mobile application using Expo (React Native).

## 1. Purpose

The application is a **Business Operations Suite**. It is designed to help small and medium-sized businesses manage their core operations digitally.

## 2. Target Audience

- **Small and Medium Business Owners**: Individuals managing retail stores, small factories, or service-based businesses.
- **Managers and Staff**: Employees responsible for inventory, billing, and customer data.
- **Tech-Savvy Users**: Business owners who are comfortable using smartphones for work.

## 3. Core Modules & Features

The application must include the following modules, each with the specified functionalities:

### Module 1: User Authentication
- **Login**: Users should be able to log in using their credentials.
- **Registration**: New business owners should be able to create an account.
- **Password Reset**: A standard forgot password flow.

### Module 2: Dashboard
- **Overview**: A visual summary of key business metrics.
- **Quick Actions**: Buttons to quickly access the most used features (e.g., "Create Invoice", "View Stock").
- **Notifications**: Alerts for low stock or pending tasks.

### Module 3: Inventory Management
- **Product Catalog**: List all products with details (Name, Price, Current Stock).
- **Add/Edit Products**: Functionality to add new items or update existing ones.
- **Stock Tracking**: Real-time quantity updates. The system should automatically deduct stock when a sale is made and add stock when a purchase is received.

### Module 4: Sales & Billing
- **Invoice Generation**: Create professional invoices/bills.
- **Customer Management**: Add and manage customer information.
- **Transaction History**: View past sales and invoices.

## 4. Design & UI/UX Guidelines

- **Platform**: Mobile-first (iOS and Android).
- **Design System**: "Neon Business" style.
  - **Color Palette**: Dark mode with Neon accents. Primary colors: Deep Black (#000000) or Dark Gray (#121212), Neon Green (#39FF14), Neon Blue (#00DFFF).
  - **Typography**: Clean, modern sans-serif font (e.g., Roboto, Inter).
  - **Theme**: Dark Mode is the default and preferred theme.
  - **Visuals**: Use glassmorphism effects, subtle gradients, and glowing borders for the Neon aesthetic.

## 5. Technical Constraints

- **Framework**: Expo (React Native).
- **Language**: JavaScript.
- **State Management**: Use React Hooks (useState, useContext). Avoid Redux unless necessary.
- **Navigation**: Use React Navigation.
- **Persistence**: Use Async Storage for local data caching.
- **Backend**: Use Firebase (Firestore for database, Auth for authentication).

## 6. User Flow

1. User logs in.
2. User lands on **Dashboard**.
3. User navigates to **Inventory** to add a new product.
4. User goes to **Sales** to create an invoice for a customer using the new product.
5. The system updates the stock automatically.

## 7. Requirements

- The code should be well-structured and modular.
- All UI components should be reusable.
- The app must handle offline scenarios gracefully (show cached data and sync when online).
- The Neon Business aesthetic must be applied consistently across all screens.
