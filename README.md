# 🚗 AutoPark Vision AI

An AI-powered ticketless parking management system built on AWS that automatically detects vehicle license plates, records parking sessions, calculates parking duration and parking fees, and provides a real-time parking history dashboard.

The project demonstrates a modern serverless architecture by combining React, API Gateway, AWS Lambda, Amazon Rekognition, Amazon S3, and Amazon RDS MySQL to automate vehicle entry and exit processing.

---
# 🏗️ AWS Architecture

<img width="1000" height="778" alt="parking system drawio" src="https://github.com/user-attachments/assets/9be3edac-6892-4a37-b07a-85a5e8f7434b" />

---



# ✨ Features

- 🚘 Automatic license plate recognition
- 📤 Vehicle entry processing
- 📥 Vehicle exit processing
- ⏱ Automatic parking duration calculation
- 💰 Automatic parking fee calculation
- 📋 Parking session history
- ☁ Serverless backend
- 🤖 AI-powered text detection
- 🔄 REST API integration

---

# 🏛️ Architecture Design Decisions

This project was designed with scalability, maintainability and AWS best practices in mind. Several architectural decisions were made to overcome AWS service limitations while keeping the application modular.

## ⚡ Why Three Lambda Functions?

Instead of placing all business logic inside a single Lambda function, the backend was divided into three independent services.

### 🚘 Lambda 1 – Image Processing

Responsible only for:

- Receiving images from the frontend
- Uploading images to Amazon S3
- Calling Amazon Rekognition
- Extracting the licence plate
- Invoking the session management service

---

### 🗄️ Lambda 2 – Session Management

Responsible only for:

- Creating parking sessions
- Closing parking sessions
- Calculating parking duration
- Calculating parking fees
- Writing data to the database

---

### 📋 Lambda 3 – Session Retrieval

Responsible only for:

- Reading parking sessions from the database
- Returning results to the frontend

---

### ✅ Why this approach?

Separating responsibilities into multiple Lambda functions provides several advantages:

- Easier maintenance
- Smaller deployment packages
- Independent scaling
- Better debugging
- Clear separation of concerns
- Easier future expansion

---

## 🌍 Why is the S3 Bucket in Ireland?

Although the application is deployed in the **Africa (Cape Town)** region (`af-south-1`), **Amazon Rekognition is currently unavailable in South Africa**.

To overcome this limitation:

- The S3 bucket was created in **EU (Ireland)** (`eu-west-1`)
- Vehicle images are uploaded directly into the Ireland bucket
- Amazon Rekognition processes the image from the same region
- Only the detected licence plate is returned to the application

This solution allows the application to use Rekognition without moving the rest of the infrastructure outside South Africa. The API Gateway, Lambda functions and RDS database all remain deployed in the Africa (Cape Town) region. I understand that it is a good practice to have two buckets — one in the host region for primary data storage or processing, and a replica bucket in the target region using Amazon S3 Cross-Region Replication (CRR) to ensure low latency, high availability, and disaster recovery for local AWS services, especially for big enterprice systems. However, for the system I opted for using 1 bucket in a different region to show that I understand the concept of cross-region

---

# ☁️ AWS Services Used

| Service | Purpose |
|----------|----------|
| React + Vite | Frontend SPA |
| API Gateway | HTTP API |
| AWS Lambda | Serverless compute |
| Amazon S3 | Temporary image storage |
| Amazon Rekognition | AI licence plate detection |
| Amazon RDS MySQL | Persistent session storage |

---

# 📂 Project Structure

```
AutoPark-Vision/
│
├── frontend/
│
├── backend/
│   ├── process-image/
│   ├── manage-session/
│   └── get-sessions/
│
└── README.md
```

---

# 🔄 System Workflow

## 🚘 Vehicle Entry

1. Upload vehicle image.
2. React converts the image to Base64.
3. API Gateway routes the request to Lambda 1.
4. Lambda 1 uploads the image to Amazon S3.
5. Rekognition scans the image.
6. The licence plate is extracted.
7. Lambda 2 creates an ACTIVE parking session.
8. Session data is stored in Amazon RDS.
9. Results are returned to the frontend.

---

## 🚗 Vehicle Exit

1. Upload vehicle image.
2. Licence plate is detected.
3. Lambda 2 searches for the ACTIVE session.
4. Exit time is recorded.
5. Parking duration is calculated.
6. Parking fee is calculated.
7. Session status is updated to COMPLETED.
8. Updated session is returned to the frontend.

---

## 📋 Session History

1. User opens the Sessions page.
2. React sends a GET request.
3. API Gateway invokes Lambda 3.
4. Lambda 3 retrieves all sessions from RDS.
5. Results are displayed in the dashboard.

---

# 🚧 Challenges & Solutions

## 🌍 Amazon Rekognition Regional Limitation

**Challenge**

Amazon Rekognition is unavailable in the Africa (Cape Town) region.

**Solution**

A dedicated S3 bucket was created in Ireland to allow Rekognition to process uploaded images while the remainder of the application stayed in South Africa.

---

## 🔐 IAM Permission Configuration

**Challenge**

Lambda 1 repeatedly failed to invoke Lambda 2 due to IAM permission issues.

**Solution**

The execution role was updated with the required `lambda:InvokeFunction` permission, allowing secure Lambda-to-Lambda communication.

---

## 🔗 Cross-Service Integration

Integrating multiple AWS services required careful configuration of:

- IAM Roles
- API Gateway
- Lambda permissions
- Amazon S3
- Amazon Rekognition
- Amazon RDS
- Environment variables

---

## 🧠 Licence Plate Extraction

Amazon Rekognition returns all detected text from an image rather than only licence plates.

A filtering algorithm was implemented to identify and extract only the correct South African registration number.

---

## 🌐 CORS Configuration

The React frontend communicates with API Gateway.

Proper CORS configuration was required to allow requests from the frontend during development and testing.

---

# 🚀 Future Improvements

- 🔍 Search vehicles by registration number
- 📧 Email parking receipts
- 📄 PDF receipt generation
- 📷 Multi-camera support
- 📊 Parking analytics dashboard
- 🚧 Automatic gate integration
- 👤 Authentication and role management

---

# 💻 Technologies

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- AWS SDK v3
- AWS Lambda
- API Gateway
- Amazon S3
- Amazon Rekognition
- Amazon RDS MySQL

---

# 📸 Demo

<img width="1588" height="773" alt="demo1" src="https://github.com/user-attachments/assets/49a21bde-b1f9-4e2c-a51d-51eee3834bfa" />
<img width="1580" height="775" alt="demo2" src="https://github.com/user-attachments/assets/d76d1f8e-a2be-49ff-9f16-dfc11f5d7a4f" />
<img width="1575" height="769" alt="demo4" src="https://github.com/user-attachments/assets/74889594-803a-4e8b-8797-dc4697f5ff8a" />

---

# 👩‍💻 Author

**Noluthando Masemula**

Cloud Computing | Software Development | AWS
