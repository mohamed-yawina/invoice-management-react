
# 🧾 Invoice Management System

A modern web-based invoice management application developed using **React.js**, **Material UI**, **Firebase Realtime Database**, and **JSON Server**.

The project aims to simplify invoice creation, customer management, payment tracking, and financial reporting through a responsive and user-friendly interface.

## 🚀 Technologies Used

| Technology | Purpose |
|------------|---------|
| React.js | Frontend development |
| Material UI | Responsive user interface |
| Firebase Authentication | User authentication |
| Firebase Realtime Database | Customer and invoice storage |
| JSON Server | Product and category management |
| jsPDF | PDF invoice generation |
| React Hooks | State management |
| Formik & Yup | Form validation |

## ✨ Features

### 👤 User Features

- Customer management
- Invoice creation and management
- Add multiple products to invoices
- Automatic invoice calculations
- VAT and discount management
- Generate and download PDF invoices
- Invoice history
- Payment tracking
- Personal dashboard

### 🛡️ Administrator Features

- Manage products and categories
- Validate invoices
- Monitor invoice statuses
- View financial statistics
- Global analytics dashboard
- Monthly revenue tracking

## 📊 Invoice Management

The application supports the following invoice statuses:

- 🟡 Pending
- 🟢 Paid
- 🔴 Rejected

Each invoice can include:

- Invoice number
- Creation date
- Customer information
- Products and quantities
- Unit prices
- VAT and discounts
- Total amount
- Payment date
- Payment method
- Administrator validation

## 🧮 Invoice Calculations

### Standard Invoice

```text
Subtotal = Sum(Quantity × Unit Price)
VAT = Subtotal × VAT Rate
Total = Subtotal + VAT
```

### Discount Calculation

```text
Discount = Subtotal × Discount Rate
Total = Subtotal - Discount + VAT
```

The project specifications also include line-level discounts, global discounts, and category-based VAT rates.

## 🏗️ Project Architecture

```text
src/
├── components/
├── pages/
├── services/
│   ├── firebaseService.js
│   └── jsonService.js
├── contexts/
├── utils/
├── routes/
└── App.js
```

### Database Architecture

**Firebase Realtime Database**
- Customers
- Invoices
- Invoice statuses
- Payment tracking information

**JSON Server**
- Products
- Categories
- Global settings

## 🔐 Security

The application is designed to include:

- Firebase Authentication
- Role-based access control (ADMIN / USER)
- Protected routes
- Form validation
- Secure database access rules

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/invoice-management-react.git
```

### 2. Navigate to the Project

```bash
cd invoice-management-react
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Firebase

Create an `.env` file and configure the Firebase environment variables according to the project's Firebase setup.

Never commit private credentials or service-account keys.

### 5. Start JSON Server

Configure the JSON Server data file and start the local API using the script defined in `package.json`.

### 6. Start the Application

Run the development command defined in `package.json`.

For example, if the project uses Vite:

```bash
npm run dev
```

## 📈 Dashboard & Analytics

The planned dashboard includes:

- Total invoices
- Total payments received
- Pending invoices
- Rejected invoices
- Average invoice amount
- Monthly revenue statistics

## 📄 PDF Generation

Invoices are generated using **jsPDF** and **jspdf-autotable**.

Generated documents can include:

- Company logo
- Customer information
- Product details
- Invoice totals
- VAT information
- Signature

## 🔮 Future Improvements

- Excel export
- Email invoice delivery
- Multi-currency support
- Multi-company management
- Electronic signatures
- Annual invoice archiving

## 👨‍💻 Project Information

**Project:** Invoice Management System  
**Type:** Academic Mini-Project  
**Field:** Web Development  
**Frontend:** React.js & Material UI  
**Database:** Firebase Realtime Database & JSON Server

## 📜 License

This project was developed for educational purposes.
