[![Deploy to Appwrite](https://img.shields.io/badge/Deploy%20to-Appwrite-f02e65?style=for-the-badge&logo=appwrite&logoColor=f02e65&labelColor=1d1d1d)](https://cloud.appwrite.io/console)

# 🪴 Introducing ErrExplain

**Turn cryptic errors into plain English.** 

Instantly analyze programming errors with AI-powered explanations, root cause analysis, and actionable solutions.

## 🛠️ Key Features

- **🔍 Smart Error Analysis** - Paste any error message and get structured explanations
- **🎯 Root Cause Detection** - Understand what actually caused the error
- **🛠️ Actionable Solutions** - Step-by-step fixes that actually work
- **🔗 Collaborative Sharing** - Generate shareable links for team debugging
- **📊 Error History** - Track and analyze your debugging patterns
- **⚡ Rate Limiting** - Fair usage with 5 free analyses per day
- **📱 Mobile Friendly** - Works seamlessly across all devices

## 🤔 Why ErrExplain?

| Feature | ErrExplain | ChatGPT/Claude | Stack Overflow |
|---------|------------|----------------|----------------|
| **Error Focus** | ✅ Specialized for errors | ❌ General purpose | ❌ Manual search |
| **Structured Output** | ✅ Meaning → Causes → Fixes | ❌ Raw text response | ❌ Mixed quality answers |
| **Memory & Analytics** | ✅ Dashboard with charts & insights | ❌ Limited conversation memory | ❌ No personal dashboard |
| **Language Intelligence** | ✅ Top languages, severity tracking | ❌ No pattern recognition | ❌ No personal insights |

## 🚀 Tech Stack

- **Frontend**: Next.js 15+, React 19, Tailwind CSS 4, clsx
- **Backend**: Next.js API Routes, Node.js, node-appwrite
- **Database**: Appwrite (NoSQL)
- **AI**: Groq (Llama 4 Maverick)
- **Vercel AI SDK**: ai, @ai-sdk/groq
- **Validation**: Zod
- **UI**: Sonner (toasts)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Appwrite Sites

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Appwrite account and project
- Groq API key

### Quick Start

```bash
# Clone repository
git clone https://github.com/AbhiVarde/errexplain.git
cd errexplain

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start analyzing errors.

### Environment Configuration

Create `.env.local` with these variables:

```env
# Groq AI
GROQ_API_KEY=your_groq_api_key

# Appwrite
APPWRITE_API_KEY=your_appwrite_api_key
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID=your_collection_id

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ERROR_ANALYSIS_PROMPT=your_custom_ai_prompt
```

**Appwrite Collections Setup:**

- **error-submissions**: `clientId`, `errorMessage`, `language`, `explanation`, `causes`, `solutions`, `category`, `severity`, `isShared`, `shareId`, `sharedAt`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Development Guidelines:**
- Follow existing code patterns
- Test error scenarios thoroughly
- Maintain responsive design
- Keep commits focused and descriptive

## 🌩️ Appwrite Cloud Beta

Proud to be a part of the **Appwrite Cloud Public Beta**!  
Click the card to view it live:

<a href="https://cloud.appwrite.io/card/653e053411ff36b703e7" target="_blank">
  <img width="350" src="https://cloud.appwrite.io/v1/cards/cloud?userId=653e053411ff36b703e7" alt="Appwrite Cloud Card" />
</a>

## License

ErrExplain is licensed under the [MIT License](http://choosealicense.com/licenses/mit/). All rights reserved.

## Authors

ErrExplain is created and maintained by [Abhi Varde](https://www.abhivarde.in/).
