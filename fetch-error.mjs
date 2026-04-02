import http from 'http';
import fs from 'fs';

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('server-error.html', data);
  });
}).on('error', (err) => {
  fs.writeFileSync('server-error.html', "Fetch Error: " + err.message);
});
