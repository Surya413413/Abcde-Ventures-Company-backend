# E-Commerce Backend API

A Node.js/Express backend service for managing e-commerce transactions with secure authentication, cart management, and order processing.

##  Features

- **User Authentication** with JWT tokens
- **Single-Device Session Management** - Users can only be logged in from one device at a time
- **Cart Management** - Add, view, and manage shopping cart items
- **Order Processing** - Convert carts to orders with complete transaction history
- **RESTful API** - Clean, organized endpoints
- **Security** - Password hashing with bcrypt, JWT-based authentication

##  Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **SQL**

##  Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Surya413413/Abcde-Ventures-Company-backend.git
cd shopping-cart-app/backend
```

### 2. Install Dependencies

```bash
npm install
```

Required packages:
- `express` - Web framework
- `sql` - sql
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing



**Important:** Change `JWT_SECRET` to a strong, random string in production.

##  Database Setup
use sqldatabase

##  Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000` with auto-restart on file changes.

### Production Mode

```bash
npm start
```

##  Project Structure

```
backend/
├── models/
│   ├── User.js           # User schema with token field for session management
│   ├── Item.js           # Product/item schema
│   ├── Cart.js           # Shopping cart schema
│   └── Order.js          # Order schema
├── middleware/
│   └── auth.js           # JWT authentication & session validation
├── routes/
│   ├── userRoutes.js     # User registration, login, logout
│   ├── itemRoutes.js     # Item listing and management
│   ├── cartRoutes.js     # Cart operations
│   └── orderRoutes.js    # Order creation and history
├── server.js             # Application entry point
├── .env                  # Environment variables (not in git)
└── package.json
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### User Routes

#### Register New User
```http
POST /users
Content-Type: application/json

{
  "username": "suresh",
  "email": "sureshnayak6695@gmail.com.com",
  "password": "Surya@413"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "username":  "suresh",
  "email": "sureshnayak6695@gmail.com.com",
}
```

#### Login
```http
POST /users/login
Content-Type: application/json

{
  "username":  "suresh",
  "password":"Surya@413"
}
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (Already Logged In):**
```json
{
  "error": "User is already logged in on another device."
}
```
Status: `403 Forbidden`

#### Logout
```http
POST /users/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Item Routes

#### Get All Items
```http
GET /items
```

**Response:**
```json
[
  {
    "_id": "item_id",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "imageUrl": "https://example.com/laptop.jpg",
    "stock": 50
  }
]
```

### Cart Routes (Protected)

#### Add Item to Cart
```http
POST /carts
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "item_id",
  "quantity": 2
}
```

**Response:**
```json
{
  "_id": "cart_id",
  "userId": "user_id",
  "items": [
    {
      "itemId": "item_id",
      "quantity": 2
    }
  ]
}
```

#### Get Current Cart
```http
GET /carts
Authorization: Bearer <token>
```

#### Remove Item from Cart
```http
DELETE /carts/:itemId
Authorization: Bearer <token>
```

### Order Routes (Protected)

#### Place Order (Checkout)
```http
POST /orders
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "order_id",
  "userId": "user_id",
  "items": [...],
  "totalAmount": 1999.98,
  "status": "pending",
  "createdAt": "2024-02-08T10:30:00.000Z"
}
```

#### Get Order History
```http
GET /orders
Authorization: Bearer <token>
```

## Authentication Flow

### Single-Device Session Management

This application enforces **one active session per user** to prevent concurrent logins:

1. **Login**: JWT token is generated and stored in the `User.token` field
2. **Validation**: On each login attempt, the system checks if a token exists
   - If token exists → Login denied (403 error)
   - If no token → New token generated and stored
3. **Logout**: Token is removed from database, allowing new logins

### Using Protected Routes

Include the JWT token in the `Authorization` header:

```javascript
// Example with Axios
axios.get('http://localhost:5000/api/carts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

##  Database Schemas

### User Schema
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  token: String (default: null),
  createdAt: Date
}
```

### Item Schema
```javascript
{
  name: String (required),
  description: String,
  price: Number (required),
  imageUrl: String,
  stock: Number (default: 0),
  createdAt: Date
}
```

### Cart Schema
```javascript
{
  userId: ObjectId (ref: 'User'),
  items: [{
    itemId: ObjectId (ref: 'Item'),
    quantity: Number
  }],
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  userId: ObjectId (ref: 'User'),
  items: [{
    itemId: ObjectId (ref: 'Item'),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String (enum: ['pending', 'completed', 'cancelled']),
  createdAt: Date
}
```

##  Testing

### Manual Testing with cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Get Items:**
```bash
curl http://localhost:5000/api/items
```

**Add to Cart:**
```bash
curl -X POST http://localhost:5000/api/carts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"itemId":"ITEM_ID","quantity":1}'
```

### Testing with Postman

1. Import the API collection
2. Set environment variable `token` after login
3. Use `{{token}}` in Authorization headers

## Troubleshooting

### Common Issues

**JWT Secret Not Set**
```
Error: JWT_SECRET is not defined
```
**Solution:** Create `.env` file with `JWT_SECRET` variable.

**CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Verify the frontend origin is allowed in `cors` configuration in `server.js`.

**User Already Logged In**
```
403 Forbidden: User is already logged in on another device
```
**Solution:** This is expected behavior. User must logout from other device first, or manually clear the token from the database during development.

##  Security Best Practices

-  Passwords are hashed with bcrypt (salt rounds: 10)
-  JWT tokens for stateless authentication
-  Environment variables for sensitive data
-  Input validation on all routes
-  Single-device session enforcement
-  **Production Checklist:**
  - Use strong JWT_SECRET (32+ random characters)
  - Enable HTTPS
  - Add rate limiting
  - Implement request validation with express-validator
  - Set up proper error logging
  - Use helmet.js for security headers

##  Development Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node seed.js",
  "test": "jest"
}
```

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



---

**Happy Coding! 🎉**
