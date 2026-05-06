# Vercel Deployment Notes

- Build Command: `npm run build`
- Output Directory: `dist`
- Recommended Node version: `20.x` to match CI

## Notes

- Keep the project root pointed at the repository folder that contains `package.json`.
- `vercel.json` is configured to use the standard Vite output in `dist` and should not require additional build overrides.