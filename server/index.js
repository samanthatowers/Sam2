const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// In-memory patient data
const patients = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Patient ${i + 1}`,
  prn: [],
  scheduled: [],
  notes: ''
}));

function sendJSON(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const segments = parsed.pathname.split('/').filter(Boolean);

  // API routes
  if (segments[0] === 'api' && segments[1] === 'patients') {
    const id = segments[2] ? parseInt(segments[2]) : null;
    if (req.method === 'GET' && !id) {
      const list = patients.map(p => ({ id: p.id, name: p.name }));
      return sendJSON(res, list);
    }
    const patient = patients.find(p => p.id === id);
    if (!patient) {
      return sendJSON(res, { error: 'Patient not found' }, 404);
    }
    if (req.method === 'GET') {
      return sendJSON(res, patient);
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        let data = {};
        try { data = JSON.parse(body); } catch {}
        if (segments[3] === 'medications') {
          if (data.type === 'prn') patient.prn.push(data.medication);
          else patient.scheduled.push(data.medication);
          return sendJSON(res, { ok: true });
        }
        if (segments[3] === 'notes') {
          patient.notes = data.notes || '';
          return sendJSON(res, { ok: true });
        }
        sendJSON(res, { error: 'Invalid request' }, 400);
      });
      return;
    }
  }

  // Static files
  const filePath = path.join(__dirname, '..', 'client', parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
