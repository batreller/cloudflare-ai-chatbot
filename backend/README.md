# Backend - quick start

Cloudflare AI chatbot

---

## Getting Started

### Prerequisites

* Node.js (LTS recommended)
* npm

### Installation

1. Clone the repository.
2. Navigate to the same folder where this README.md file is located:
   `cd cloudflare-ai-chatbot/backend`
3. Install dependencies:
   `npm install`

### Configuration

Generate wrangler types:
1. Run `npx wrangler types`

Set your JWT secret (for production only):

1. Run `npx wrangler secret put JWT_SECRET`
2. Enter the secret value when prompted.

Set your JWT secret (for development only):

1. Copy `.dev.vars.example` into `.dev.vars` and set the required variables

---

## Running the Project

### Local Development

To start the project locally use the following command:

`npx wrangler dev`

### Deployment

Deploy the project to Cloudflare Workers:

`npx wrangler deploy`
