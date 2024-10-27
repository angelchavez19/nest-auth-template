# **Authentication and Authorization System**

This project is a robust authentication and authorization system developed with NestJS. It allows user management, route protection, and access control through roles and permissions. Additionally, it incorporates advanced features such as OAuth2 support, multi-factor authentication, and activity auditing.

---

## **Key Features**

1. **User Registration (Signup)**

   - Allows users to create an account through a registration form.
   - Data validation and email confirmation.

2. **Login**

   - Users can authenticate by entering their credentials.
   - JWT tokens are generated for secure sessions.

3. **JWT Authentication**

   - Uses JWT to handle user authentication.
   - Tokens are signed with a secret key to verify their authenticity.

4. **Role-Based Authorization**

   - Roles like `admin`, `user`, or others are assigned dynamically.
   - Specific permissions are granted according to the assigned role.

5. **Route Protection**

   - Routes are restricted based on authentication and assigned roles.
   - Middleware is used to validate access.

6. **Password Change and Recovery**

   - Requests for password resets via email confirmation.
   - Token expiration for enhanced security.

7. **Logout**

   - Invalidates the JWT to terminate the user session.

8. **Token Refresh**

   - Implements refresh tokens to maintain active sessions without needing a new login.

9. **Auditing and Logs**

   - Records key activities such as logins, failed attempts, and password changes.

10. **Dynamic Roles and Permission Management**

- Create, update, and assign roles dynamically at runtime.

11. **OAuth2 / Social Login Support**

- Allows authentication through providers like Google, Facebook, and GitHub.

12. **Session Management**

- Controls simultaneous sessions, allowing or restricting multiple logins.

13. **Multi-Factor Authentication (MFA)**

- Adds an extra layer of security with multi-factor authentication.

---

## **Prerequisites**

- Node.js
- NestJS CLI
- Database (PostgreSQL, MySQL, MongoDB, etc.)
- OAuth2 Configuration

---

## **Installation**

1. Clone the repository:

   ```bash
   git clone https://github.com/angelchavez19/nest-auth-template.git
   cd nest-auth-template
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up the environment variables in a `.env` file:

   ```
   DATABASE_URL="mysql://root:mysql@localhost:3306/nextauthdb"
   ```

4. Run the development server:
   ```bash
   npm run start:dev
   ```

---

## **Technologies Used**

- NestJS
- JSON Web Tokens (JWT)
- OAuth2
- Prisma
- Bcrypt for password encryption

---

## **Contributions**

Contributions are welcome! Please open an **issue** or submit a **pull request**.

---

## **License**

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## **Contact**

If you have any questions, feel free to contact us:

- **Email:** infoangelchavez@gmail.com
- **GitHub:** [angelchavez19](https://github.com/angelchavez19)
- **LinkedIn:** [Angel Chávez](https://www.linkedin.com/in/angel-ch%C3%A1vez)
