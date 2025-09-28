# Marketplace Backend API

A comprehensive Node.js backend API for a marketplace application with user authentication, listing management, chat functionality, and admin controls.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Password hashing with bcryptjs
  - Role-based access control (user/admin)

- **User Management**
  - User profiles with avatars
  - User preferences and settings
  - Dashboard with statistics
  - Favorite listings management

- **Listing Management**
  - CRUD operations for listings
  - Image upload support
  - Advanced search and filtering
  - Category management
  - Featured listings
  - Favorite system

- **Chat System**
  - Real-time messaging between users
  - Offer system within chats
  - Message read status
  - Chat history

- **Admin Panel**
  - User management
  - Listing moderation
  - Report system
  - Analytics dashboard
  - Content moderation

- **File Upload**
  - Image upload for user avatars
  - Multiple image upload for listings
  - File type validation
  - Size limits

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/marketplace
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-app-password
   ```

4. Start MongoDB service

5. Run the application:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/listings` - Get user's listings
- `GET /api/users/favorites` - Get user's favorite listings
- `GET /api/users/dashboard` - Get dashboard stats

### Listings
- `GET /api/listings` - Get all listings (with search/filters)
- `POST /api/listings` - Create new listing
- `GET /api/listings/:id` - Get single listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/:id/favorite` - Toggle favorite
- `GET /api/listings/featured` - Get featured listings
- `GET /api/listings/meta/categories` - Get categories

### Chat
- `GET /api/chat` - Get user's chats
- `POST /api/chat/listing/:listingId` - Start chat for listing
- `GET /api/chat/:id` - Get chat messages
- `POST /api/chat/:id/message` - Send message
- `PUT /api/chat/:id/message/:messageId/offer` - Respond to offer

### Admin (Admin access required)
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/listings` - Get all listings (admin view)
- `PUT /api/admin/listings/:id` - Update listing (admin)
- `DELETE /api/admin/listings/:id` - Delete listing (admin)
- `GET /api/admin/reports` - Get reports
- `PUT /api/admin/reports/:id` - Update report status

## Database Models

### User
- Personal information (name, email, phone)
- Authentication (password hash)
- Role and permissions
- Preferences and settings
- Profile statistics

### Listing
- Product details (title, description, price)
- Images and media
- Location and shipping info
- Category and condition
- Status and visibility
- Favorites and views

### Chat
- Participants and listing reference
- Message history with timestamps
- Offer system integration
- Read status tracking

### Report
- Content moderation reports
- Admin review system
- Action tracking

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- File upload restrictions
- Rate limiting ready
- CORS configuration
- Role-based access control

## File Structure

```
├── server.js              # Main server file
├── models/                 # Database models
│   ├── User.js
│   ├── Listing.js
│   ├── Chat.js
│   └── Report.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── users.js
│   ├── listings.js
│   ├── admin.js
│   └── chat.js
├── middleware/             # Custom middleware
│   └── auth.js
└── uploads/               # File uploads
    ├── avatars/
    └── listings/
```

## Usage

1. Start the server
2. Create an admin user through registration
3. Update the user's role to 'admin' in the database
4. Use the frontend application to interact with the API
5. Access admin features through `/api/admin` endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request