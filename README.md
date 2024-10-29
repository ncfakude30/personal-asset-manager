# Personal Asset Manager Dashboard

Welcome to the **Personal Asset Manager Dashboard**—a powerful platform for managing, tracking, and analyzing your digital assets, including NFTs and FTs. Built with NestJS and TypeScript, this application seamlessly integrates with Privy.io for secure authentication and utilizes PostgreSQL for robust data management.

## Key Features

- **User Authentication**: Securely exchange Privy.io JWTs for Metaversal tokens to access your dashboard.
- **Asset Management**: Easily add, remove, and list your digital assets.
- **Portfolio Analytics**: Get real-time insights into your portfolio's total value and Profit & Loss (PnL) calculations.
- **Historical Data Tracking**: Analyze the performance of your assets over time.
- **Daily Price Updates**: Automated price updates via a scheduled task.

## Getting Started

### Prerequisites
- Node.js (version X.X)
- PostgreSQL (version X.X)
- Privy.io Account

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/personal-asset-manager.git
   cd personal-asset-manager

2. Install dependencies:
    ```
    npm install
    ```
3. Set up environment variables
  *Create a .env file in the root directory and add your Privy.io credentials:*
  ```
  PRIVY_SECRET_KEY=your_secret_key
  PRIVY_APP_ID=your_app_id
  ```

4. Run database migrations:
  ```
  npm run migrate
  ```

5. Start the application:
  ```
  npm run start:dev
  ```

---

# API Documentation

Explore the live API documentation at [Swagger UI](http://localhost:3000/api).

## Authentication Endpoints

- **Authenticate User**: `POST /auth`  
  Exchanges a Privy.io JWT for a Metaversal JWT.

## Asset Management Endpoints

- **Add Asset**: `POST /assets`  
- **Remove Asset**: `DELETE /assets/:assetId`  
- **List Assets**: `GET /assets`  

## Portfolio Analytics Endpoints

- **Get Current Portfolio Value and PnL**: `GET /portfolio`  
- **Get Asset Value Over Time and PnL Over Time**: `GET /assets/:assetId/history`  

## Daily Price Update

- **Daily Price Update**: `POST /assets/update-prices`  
  Generates and stores daily price data for all assets.

## Authentication Architecture

![Authentication Architecture](./path/to/auth-architecture-diagram.png)

## CI/CD Pipeline

This project includes a GitHub Actions pipeline for automated linting, testing, and builds. Ensure code quality and maintainability with each commit.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Feel free to submit issues or pull requests to enhance the functionality or address bugs!
