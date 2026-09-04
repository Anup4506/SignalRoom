#Production credentials

Username=SignalRoom Sentiment Analyzer
password=Ronaldo@7

# SignalRoom Sentiment Analyzer

SignalRoom is a full-stack conversation intelligence application for customer-support transcripts. It accepts `.txt` files and produces overall sentiment, sentence-level analysis, emotion signals, call-quality KPIs, a summary, key issues, recommended actions, and a presentation-ready PDF report.

## Architecture

```text
Browser UI (Next.js + React)
        |
        | HTTPS / JSON
        v
Next.js serverless routes
  |-- signed HTTP-only session
  |-- input validation and limits
  |-- prompt and schema orchestration
        |
        v
Groq Chat Completions API
  |-- structured output with Zod
  |-- configurable model
        |
        v
Typed dashboard response
```

The Groq key stays on the server. The browser never receives it. The application does not include a database, so uploaded transcripts and analysis results are not persisted by the app.

## Local setup

1. Install Node.js 20.9 or newer and pnpm.
2. Install packages with `pnpm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `GROQ_API_KEY`, `APP_USERNAME`, `APP_PASSWORD`, and a long random `AUTH_SECRET`.
5. Run `pnpm dev` and open `http://localhost:3000`.

Without custom local login values, development mode accepts:

```text
Username: reviewer
Password: sentiment-demo
```

Production requires explicit application credentials and an authentication secret.

## Environment variables

| Variable       | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `GROQ_API_KEY` | Server-side Groq API credential                 |
| `GROQ_MODEL`   | Groq model ID; defaults to `openai/gpt-oss-20b` |
| `APP_USERNAME` | Reviewer login username                         |
| `APP_PASSWORD` | Reviewer login password                         |
| `AUTH_SECRET`  | Secret used to sign session cookies             |

## Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm start
```

## Deploy to Vercel

1. Push the project to a Git repository.
2. Import the repository in Vercel.
3. Add all five environment variables in Project Settings > Environment Variables.
4. Deploy. Vercel detects Next.js and deploys the API route as a serverless function.

## Deploy to Netlify

1. Push the project to a Git repository.
2. Import the repository in Netlify.
3. Use `pnpm build` as the build command and leave the publish directory on the framework default.
4. Add all five environment variables in Site configuration > Environment variables.
5. Deploy. Netlify's Next.js adapter provisions the server routes.

## Analysis contract

The model is required to produce a validated object containing:

- Overall sentiment, confidence, and concise rationale
- Ordered utterance-level sentiment, emotion, speaker, and confidence
- Customer satisfaction, agent performance, resolution likelihood, empathy, and escalation risk scores
- Primary topic, customer intent, resolution status, key issues, and action items
- A two-to-three sentence conversation summary
- A branded multi-page PDF report with all dashboard insights

Requests are rejected if unauthenticated, empty, or longer than 50,000 characters. The model response is checked against a Zod schema before it reaches the dashboard.
