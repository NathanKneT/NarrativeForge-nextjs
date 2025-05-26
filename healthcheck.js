#!/usr/bin/env node

const http = require('http');

const options = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log(`Health check failed with status code: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.end();