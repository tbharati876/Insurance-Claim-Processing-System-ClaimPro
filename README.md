
# ClaimPro - Insurance Claim Processing System

ClaimPro is a web-based Insurance Claim Processing System designed to simplify and manage the insurance claim lifecycle. It allows an administrator to file, track, review, approve, reject, and settle insurance claims through a centralized dashboard.

## Project Overview

The application provides a centralized interface for managing insurance claims, maintaining claim-related documents, processing settlements, and generating reports.

ClaimPro uses a administrator account to manage all application operations.

## Features

### 1. Admin Login
- Secure login interface for the administrator.
- Admin account.
- Logout functionality.

### 2. Dashboard
- View total claims.
- Track claims under review.
- View approved, pending, and rejected claims.
- View total settlement amount.
- Display recent claims.
- View claim status summaries.

### 3. Claim Management
- File new insurance claims.
- Generate unique claim numbers.
- Store claimant and policy information.
- View all submitted claims.
- Search claims by claim number, claimant name, or policy number.
- Filter claims by status and claim type.
- View complete claim details.

### 4. Review and Approval
- Review submitted insurance claims.
- Change claim status.
- Approve or reject claims.
- Add reviewer comments.
- Maintain claim processing history.

### 5. Document Management
- Upload claim-related documents.
- Associate documents with claim numbers.
- View uploaded document information.
- Download uploaded documents.

### 6. Settlement Management
- View approved claims awaiting settlement.
- Enter settlement amounts.
- Record payment dates and settlement notes.
- Update claim status to Settled.
- Prevent duplicate settlement records.

### 7. Reports
- View total claims.
- Calculate approval rate.
- View total claim amount.
- Display claim status statistics.
- Export claim information as CSV.
- Print reports.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Browser LocalStorage
- FileReader API

## Project Structure

```text
ClaimPro/
│
├── index.html
│
├── README.md
│
├── css/
│   └── style.css
│
└── js/
    ├── data.js
    └── app.js
```

## Demo Login Credentials

| Field | Details |
|---|---|
| Account Type | Administrator |
| Email | admin@claimpro.com |
| Password | admin123 |


## Installation and Setup

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Open the project folder:

   ```bash
   cd ClaimPro
   ```

3. Open `index.html` in a web browser.

4. Log in using the administrator credentials.

No backend server or database installation is required.

## Data Storage

ClaimPro uses browser LocalStorage to store:

- Claims
- Documents
- Reviews
- Settlements
- Administrator account information
- Current login session

Data is stored locally in the browser. Clearing browser storage may remove saved application data.

## Learning Outcomes

Through this project, I gained practical experience in:

- Developing a web application using HTML, CSS, and JavaScript.
- Creating responsive user interfaces.
- Implementing form validation.
- Managing application data using LocalStorage.
- Implementing login and session management.
- Performing CRUD-style data operations.
- Managing claim approval workflows.
- Handling document uploads using JavaScript.
- Generating CSV reports.
- Updating application interfaces dynamically.

## Future Enhancements

- Backend integration using Python and FastAPI.
- Database integration using PostgreSQL or MySQL.
- Role-based access control.
- Email notifications for claim status updates.
- Advanced reporting and analytics.
- Cloud-based document storage.
- Improved authentication and security.

