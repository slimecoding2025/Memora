# Security Policy

## Reporting a vulnerability
Please do not open a public issue. Email the maintainer with steps to reproduce. You will get a reply within a few days.

## Design rules
- Row Level Security is enabled on every table; the browser never sends a `user_id`.
- The Supabase service-role key is never used by this project.
- Memories are never sent to any third-party AI service.
- Markdown is rendered as React elements, never as raw HTML.
