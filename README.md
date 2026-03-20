# 🌟 Stellar Micro-Donations Platform

A cross-border micro-donation platform built on the Stellar blockchain, enabling instant, low-fee transactions between creators and supporters worldwide.

## 🚀 Features

- **Cross-Border Donations**: Send micro-donations instantly across borders using Stellar
- **Low Transaction Fees**: Minimal fees compared to traditional payment systems
- **Real-Time Updates**: Live notifications for donations and transactions
- **Secure & Transparent**: All transactions recorded on the Stellar blockchain
- **Creator Profiles**: Customizable profiles for content creators
- **Wallet Integration**: Built-in Stellar wallet management
- **Multi-Currency Support**: Support for XLM and other Stellar assets

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Stellar SDK** for blockchain integration
- **Socket.IO** for real-time updates
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** with TypeScript
- **Material-UI** for components
- **React Router** for navigation
- **React Query** for data fetching
- **Socket.IO Client** for real-time updates
- **Stellar SDK** for wallet operations

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stellar-micro-donations
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

Or use the convenience script:

```bash
npm run install-all
```

### 3. Environment Configuration

#### Server Environment

Copy the server environment example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/stellar-donations

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015
```

#### Client Environment

Copy the client environment example:

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STELLAR_NETWORK=testnet
```

### 4. Start the Application

#### Development Mode

Start both server and client in development:

```bash
# Start server (with auto-reload)
npm run dev

# In another terminal, start client
npm run client
```

#### Production Mode

Build and start the production application:

```bash
# Build client
npm run build

# Start server
npm start
```

## 📁 Project Structure

```
stellar-micro-donations/
├── src/                          # Backend source code
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB models
│   │   ├── User.js              # User model
│   │   ├── Donation.js          # Donation model
│   │   └── Campaign.js          # Campaign model
│   ├── routes/                   # API routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── donations.js         # Donation routes
│   │   └── users.js             # User routes
│   ├── services/                 # Business logic
│   │   ├── stellarService.js    # Stellar blockchain service
│   │   └── emailService.js      # Email notifications
│   └── utils/                    # Utility functions
├── client/                       # Frontend React application
│   ├── public/                   # Static assets
│   ├── src/                      # React source code
│   │   ├── components/          # Reusable components
│   │   ├── contexts/            # React contexts
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   └── utils/               # Utility functions
│   └── package.json
├── server.js                     # Express server entry point
├── package.json                  # Server dependencies
└── README.md
```

## 🔐 Authentication

The platform uses JWT-based authentication:

1. **Registration**: Users create an account with a generated Stellar wallet
2. **Login**: Users authenticate with email/password
3. **Token Management**: JWT tokens are stored in localStorage
4. **Protected Routes**: API endpoints are protected with middleware

## 💫 Stellar Integration

### Wallet Management
- Automatic wallet creation during registration
- Support for importing existing wallets
- Testnet funding with Friendbot
- Mainnet support for production

### Transactions
- Payment operations using Stellar SDK
- Transaction history tracking
- Balance monitoring
- Memo generation for donation tracking

### Real-Time Updates
- Socket.IO integration for live donation notifications
- Payment streaming for instant updates
- Creator room subscriptions

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/balance` - Get account balance
- `GET /api/auth/transactions` - Get transaction history

### Donations
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get donations (with optional creator filter)
- `GET /api/donations/:id` - Get specific donation
- `GET /api/donations/user/:userId` - Get user donations

### Users
- `GET /api/users/search` - Search creators
- `GET /api/users/:id` - Get creator profile
- `PUT /api/users/:id` - Update creator profile

## 🔧 Development

### Running Tests

```bash
# Run server tests
npm test

# Run client tests
cd client && npm test
```

### Code Style

The project uses ESLint for code linting. Run the linter:

```bash
# Server
npm run lint

# Client
cd client && npm run lint
```

## 🚀 Deployment

### Environment Variables for Production

Update your `.env` file for production:

```env
NODE_ENV=production
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
STELLAR_PASSPHRASE=Public Global Stellar Network ; September 2015
```

### Building for Production

```bash
# Build client
cd client && npm run build

# Start server
cd .. && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Implement rate limiting for API endpoints
- Validate all user inputs
- Use HTTPS in production
- Keep Stellar secret keys secure

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [Stellar Documentation](https://stellar.org/developers)
- Review the API documentation

## 🌟 Acknowledgments

- [Stellar Development Foundation](https://stellar.org/) for the blockchain infrastructure
- [Material-UI](https://mui.com/) for the React component library
- [Socket.IO](https://socket.io/) for real-time communication
