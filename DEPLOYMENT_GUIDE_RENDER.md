# Deployment Guide for CipherAxis on Render

## Overview

This guide details the steps to deploy the CipherAxis application to Render.

**Note on Payment:** If the "Blueprint" method asks for payment/credit card details, we will use the **Manual Web Service** method described below. This is free and does not require using the `render.yaml` blueprint flow.

## Prerequisites

- A [Render](https://render.com) account.
- The project pushed to a GitHub repository (`cipherAxis`).

## Deployment Steps (Manual Method - Recommended for Free Tier)

Since the Blueprint flow is requesting payment, follow these steps to deploy manually for free.

### 1. Create a New Web Service

1.  Go to your [Render Dashboard](https://dashboard.render.com/).
2.  Click the blue **New +** button in the top right corner.
3.  Select **Web Service**.

### 2. Connect Your Repository

1.  You will see a list of your repositories.
2.  Find `gaurawsinghbusiness-sys/cipherAxis`.
3.  Click **Connect**.

### 3. Configure the Service

Enter the following details in the configuration form:

| Field              | Value                                          |
| :----------------- | :--------------------------------------------- |
| **Name**           | `cipher-axis` (or any unique name)             |
| **Region**         | Singapore (or closest to you)                  |
| **Branch**         | `main` (or your default branch)                |
| **Root Directory** | _(Leave blank)_                                |
| **Runtime**        | `Node`                                         |
| **Build Command**  | `npm install`                                  |
| **Start Command**  | `npm start` (Do NOT use `node index.js`)       |
| **Instance Type**  | **Free** (Make sure to select the "Free" card) |

### 4. Environment Variables

Scroll down to the **Environment Variables** section and click **Add Environment Variable**. Add the following:

| Key                    | Value                                              |
| :--------------------- | :------------------------------------------------- |
| `NODE_VERSION`         | `20.11.0`                                          |
| `GOOGLE_SHEET_CSV_URL` | _(Paste your Google Sheet CSV URL here)_           |
| `PORT`                 | `10000` (Optional, Render sets this automatically) |

_(Add any other secrets from your local `.env` file here)_

### 5. Deploy

1.  Click **Create Web Service**.
2.  Render will start building your application. You can watch the logs in the dashboard.

## Post-Deployment Verification

1.  Wait for the build to finish (it may take a few minutes).
2.  Once users see "Live", the URL will be available (e.g., `https://cipher-axis.onrender.com`).
3.  Click the URL to open your app.
4.  Visit `/health` to verify the backend status.

## Troubleshooting

- **"Payment Required" again?** Ensure you explicitly selected the **Free** instance type card in step 3. It's usually on the far left or specifically labeled "Free $0/month".
- **Build Error:** Check if `npm install` failed. Ensure your `package-lock.json` is committed (it is).
