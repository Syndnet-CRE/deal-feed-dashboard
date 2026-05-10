import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DEV ONLY: exposes /__dev_login on the Vite dev server. Reads creds from
// .dev-auth.json (gitignored, project-local), POSTs to the production backend,
// returns the token to the frontend. Lets localhost auto-authenticate without
// ever showing a login screen. The endpoint does NOT exist in production
// builds — Netlify only serves dist/, never runs Vite middleware.
function devAuthPlugin() {
  return {
    name: 'dev-auth-login',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev_login', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        const credsPath = path.resolve(__dirname, '.dev-auth.json');
        if (!fs.existsSync(credsPath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'No .dev-auth.json found in project root' }));
          return;
        }
        let creds;
        try {
          creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Bad .dev-auth.json: ' + e.message }));
          return;
        }
        if (!creds.email || !creds.password) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '.dev-auth.json must have email and password' }));
          return;
        }
        const body = JSON.stringify({ email: creds.email, password: creds.password });
        const apiReq = https.request(
          {
            hostname: 'scoutgpt-app.onrender.com',
            port: 443,
            path: '/api/dealfeed/auth/login',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
          },
          (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
              res.statusCode = apiRes.statusCode || 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            });
          }
        );
        apiReq.on('error', (err) => {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Upstream error: ' + err.message }));
        });
        apiReq.write(body);
        apiReq.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devAuthPlugin()],
  test: {
    exclude: ['tests/**', 'node_modules/**'],
  },
});
