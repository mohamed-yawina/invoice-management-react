Invoice Management System
A web-based invoice management application designed to manage customers, products, invoices, payments, and business analytics.
Project status: This README describes the requirements and planned features. Implementation status should be updated to match the source code.

Tech Stack
- Frontend: React.js, Material UI
- Application data: Firebase Realtime Database
- Settings and catalog data: JSON Server
- PDF export: jsPDF, jsPDF-AutoTable
- Authentication (planned): Firebase Authentication
- Forms (recommended): Formik and Yup
Features
User (Accountant / Agent)
- Create and manage customer records
- Create invoices and add line items
- Automatically calculate totals, discounts, and taxes
- Generate downloadable PDF invoices
- Track invoice submission and payment dates, transfer types, and statuses (Pending, Paid, Rejected)
- View personal dashboard and invoice history
Administrator
- Manage products and categories (CRUD)
- Validate invoices
- Access global dashboard and analytics
- Monitor invoice counts, amounts collected, pending and rejected invoices, average invoice value, and monthly revenue
Data Architecture
Data source	Responsibility
JSON Server	Products, categories, global settings
Firebase Realtime Database	Customers, invoices, statuses, tracking dates


Invoice Calculation Options
1. Basic invoice: subtotal + VAT (20% in the requirements example)
2. Line discount: percentage discount applied per item
3. Global discount: percentage discount applied to the invoice subtotal
4. Category-based tax: example rates in the requirements: IT 20%, Services 10%, Training 0%
Tax rates above are project examples from the specification, not verified current tax guidance.

Planned Security
- Firebase Authentication
- Admin and user roles
- Protected routes
- Input validation
Suggested Project Structure
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
Getting Started
Prerequisites: Node.js, npm, and a Firebase project configured for the application.
git clone https://github.com/YOUR_USERNAME/invoice-management-react.git
cd invoice-management-react
npm install
Configure Firebase according to the environment variables expected by your source code. Never commit private keys or secrets.

Start the React application using the script defined in your package.json (commonly npm run dev for Vite or npm start for Create React App).

If your project uses a local JSON Server, start it separately with the database file and command configured in your repository.
Future Enhancements
- Excel export
- Email delivery of invoices
- Multi-currency support
- Multi-company management
- Electronic signatures
- Annual archiving
License
No license has been specified yet.
