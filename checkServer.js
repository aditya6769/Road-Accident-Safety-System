const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/'
};

http.get(options, (res) => {
  console.log('Server is running. Status code:', res.statusCode);
}).on('error', (e) => {
  console.error('Server is not running. Error:', e.message);
});
