# Wonderlust Airbnb Project

A full-stack hotel booking web app built with Node.js, Express, MongoDB, EJS, and Razorpay.

This project lets users explore listings, sign up or log in, add stays to cart, complete bookings with Razorpay, leave reviews, and manage their profile and trips.

## Features

- User authentication with Passport.js
- Create, edit, and delete hotel listings
- Listing search and filters from the navbar
- Booking flow with check-in, check-out, and guest count
- Add to cart and direct book actions
- Razorpay payment integration
- Booking history page
- User profile page
- Review and rating system with reviewer name
- Responsive UI with custom navbar, offcanvas menu, hero sections, and upgraded footer

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- EJS and EJS-Mate
- Passport.js
- Joi
- Razorpay
- Bootstrap 5

## Project Structure

```text
Routes/       Express route handlers
models/       Mongoose models
views/        EJS templates
public/       CSS and client-side JS
middleware.js Shared auth and validation middleware
schema.js     Joi validation schemas
app.js        Main server entry point
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Parshantbal/Airbnb.git
cd Airbnb
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Copy `.env.example` to `.env` and update the values:

```env
MONGO_URL=mongodb://127.0.0.1:27017/wonderlust
SESSION_SECRET=mySecretCode
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Start MongoDB

Make sure your local MongoDB server is running.

### 5. Run the app

```bash
node app.js
```

The app will run at:

```text
http://localhost:8080
```

## Main User Flows

### User

- Sign up and log in
- Browse all listings
- Use navbar filters for search, location, and price
- Open a listing and select stay dates and guests
- Add the stay to cart or book directly
- Complete payment with Razorpay
- View confirmed bookings in `My bookings`
- Open `My profile` to see quick account stats

### Host

- Create a new listing
- Edit or delete owned listings
- View hosted listing count from profile

### Reviews

- Logged-in users can submit ratings and comments
- New reviews store the reviewer name automatically
- Users can delete only their own reviews

## Routes Overview

### Listings

- `GET /listing`
- `GET /listing/new`
- `POST /listing`
- `GET /listing/:id`
- `GET /listing/:id/edit`
- `PUT /listing/:id`
- `DELETE /listing/:id`

### Booking and Cart

- `POST /listing/:id/cart`
- `POST /listing/:id/book`
- `GET /cart`
- `DELETE /cart/items/:itemId`
- `POST /checkout/create-order`
- `POST /checkout/verify`
- `GET /bookings`

### Auth and Profile

- `GET /signup`
- `POST /signup`
- `GET /login`
- `POST /login`
- `GET /logout`
- `GET /profile`

### Reviews

- `POST /listing/:id/review`
- `DELETE /listing/:id/review/:reviewId`

## Important Notes

- Razorpay payment works only after adding valid API keys in `.env`
- Existing old reviews without author data may show a fallback reviewer label
- The app currently uses local MongoDB
- There is no inventory blocking or date conflict prevention in this version

## Future Improvements

- Availability calendar
- Booking cancellation
- Admin dashboard
- Email confirmations
- Better host analytics
- Production deployment setup

## Author

Parshant Bal

GitHub: [Parshantbal](https://github.com/Parshantbal)
