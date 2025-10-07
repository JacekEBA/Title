# Title - Golf RCS Platform

A Next.js application for managing RCS messaging campaigns for golf courses.

## Features

- 🏌️ Multi-tenant organization management
- 📅 Campaign scheduling and calendar management
- 💬 Inbox for RCS message conversations
- 📊 Analytics and reporting
- 🎯 Contact management and list segmentation
- ✅ RCS brand verification workflow
- 🔐 Role-based access control

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **RCS Provider**: Pinnacle
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Pinnacle API account

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pinnacle
PINNACLE_API_KEY=your_pinnacle_api_key
PINNACLE_WEBHOOK_SECRET=your_webhook_secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations (if needed)
# Apply the schema from Supabase reference.txt

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/           # Authentication pages
│   │   └── reset-password/
│   ├── agency/              # Agency dashboard
│   │   ├── calendar/        # Calendar & campaign scheduling
│   │   ├── clients/         # Client list
│   │   ├── inbox/           # All conversations
│   │   ├── analytics/       # Agency-wide analytics
│   │   └── settings/        # Agency settings
│   ├── org/[orgId]/         # Organization-specific pages
│   │   ├── calendar/
│   │   ├── courses/
│   │   ├── inbox/
│   │   └── settings/
│   ├── api/
│   │   ├── webhooks/        # Pinnacle webhook handlers
│   │   ├── jobs/            # Background job processors
│   │   └── pinnacle/        # Pinnacle API routes
│   └── dashboard/           # Org selector/router
├── components/              # React components
├── lib/
│   ├── supabase/           # Supabase client utilities
│   ├── pinnacle/           # Pinnacle API integration
│   ├── auth/               # Authentication helpers
│   └── types.ts            # TypeScript types
└── styles/
    └── globals.css         # Global styles & Tailwind
```

## Key Concepts

### User Roles

- **Owner**: Full agency access
- **Agency Staff**: Agency dashboard access
- **Client Admin**: Organization management
- **Client Viewer**: Read-only organization access

### Campaign Flow

1. Create campaign from Agency Calendar
2. Select organization, course, and template
3. Schedule send time
4. System creates:
   - Campaign record
   - Calendar event
   - Send job
5. Background worker processes send job at scheduled time
6. Messages sent via Pinnacle RCS API
7. Webhook updates track delivery/read status

### Message Flow

**Outbound (Campaigns)**:
Campaign → Send Job → Messages → Pinnacle API → Customers

**Inbound (Replies)**:
Customer → Pinnacle → Webhook → Conversations → Inbox

## Database Schema

See `Supabase reference.txt` for the complete schema. Key tables:

- `organizations`: Client organizations
- `courses`: Golf courses
- `contacts`: Customer contacts
- `campaigns`: Marketing campaigns
- `messages`: Individual messages
- `conversations`: Message threads
- `calendar_events`: Calendar items

## API Routes

### Webhooks

- `POST /api/webhooks/pinnacle`: Receive Pinnacle events (messages, status updates)

### Jobs

- `GET /api/jobs/send`: Process pending send jobs (called by cron/scheduler)

### Pinnacle

- `POST /api/pinnacle/brands`: Create RCS brand verification request

## Development

### Code Style

- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use server components by default
- Client components only when needed (interactivity)
- Consistent styling with Tailwind utilities

### Testing Webhooks Locally

Use a tool like ngrok to expose your local server:

```bash
ngrok http 3000
# Use the ngrok URL in Pinnacle webhook settings
```

### Running Background Jobs

The send job processor needs to run periodically. Options:

1. **Manual**: Visit `/api/jobs/send` to trigger
2. **Cron**: Set up a cron job or scheduled task
3. **Vercel Cron**: Use Vercel cron jobs in production

## Deployment

### Vercel (Recommended)

1. Connect your Git repository
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

Ensure the platform supports:
- Node.js 18+
- Next.js App Router
- Environment variables
- Cron jobs (for send worker)

## Security

- All database queries use Supabase RLS policies
- Webhook signatures verified via Pinnacle secret
- Server actions validate user permissions
- API routes check authentication

## Troubleshooting

### Webhooks not working

- Verify `PINNACLE_WEBHOOK_SECRET` is correct
- Check webhook signature validation in logs
- Ensure webhook URL is publicly accessible

### Messages not sending

- Check send job status in database
- Verify `PINNACLE_API_KEY` is valid
- Check organization has `brand_id` in `org_integrations`
- Ensure contacts have valid E.164 phone numbers

### Styling issues

- Verify Tailwind CSS is properly configured
- Check `globals.css` is imported in root layout
- Clear `.next` cache and rebuild

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

Contact your system administrator or development team for support.

test

