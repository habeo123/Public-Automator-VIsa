# TCS Tashira Consultancy Service - Visa Workflow

An internal document management and AI-powered sorting application for Saudi Arabia Visa processing.

## Features

- **AI Document Analysis**: Automatically identifies document types (Passport, Application Form, etc.) and extracts key information using Gemini 3.1 Flash.
- **Client Management**: Persistent database for tracking visa application status (Incomplete, Ready, Submitted).
- **Team Workload Management**: Owners can assign clients to employees and monitor team performance.
- **Multi-language Support**: Full support for English and Vietnamese.
- **Secure Authentication**: Google Authentication integration for secure team access.
- **Personalized Profiles**: Users can manage their display name, phone number, and address.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4.0, Lucide React, Motion.
- **Backend/Database**: Firebase (Firestore, Authentication).
- **AI Engine**: Google Gemini API (@google/genai).

## Setup Instructions

### Prerequisites

- Node.js 18+
- Firebase Project
- Google Gemini API Key

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Configure Firebase by updating `src/firebase.ts` or providing a `firebase-applet-config.json`.

### Development

Run the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

## Deployment

### Cloud Run

This application is designed to be deployed on Google Cloud Run.

1. Build the Docker image:
   ```bash
   docker build -t gcr.io/[PROJECT_ID]/tcs-visa-workflow .
   ```
2. Push to Google Container Registry:
   ```bash
   docker push gcr.io/[PROJECT_ID]/tcs-visa-workflow
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy tcs-visa-workflow --image gcr.io/[PROJECT_ID]/tcs-visa-workflow --platform managed
   ```

Alternatively, use the provided `cloudrun.yaml` for configuration-based deployment:
```bash
gcloud run services replace cloudrun.yaml
```

## API Documentation

### Gemini AI Integration

The app uses the `@google/genai` SDK to interact with Gemini 3.1 Flash.

- **Model**: `gemini-3-flash-preview`
- **Functionality**: Analyzes base64-encoded document images/PDFs to extract:
  - Document Type
  - Customer Name
  - Visa Type
  - Expiry Dates
  - Contact Information

### Firestore Schema

- `users`: Stores user profiles and roles.
- `clients`: Stores client visa application metadata.
- `clients/{id}/documents`: Sub-collection for analyzed document results.

## License

This project is licensed under the Tashira Ltd License - see the [LICENSE](LICENSE) file for details.
