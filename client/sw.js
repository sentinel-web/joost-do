import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.end(`
    self.addEventListener('install', function(event) {
      event.waitUntil(self.skipWaiting());
    });

    self.addEventListener('activate', function(event) {
      event.waitUntil(self.clients.claim());
    });
  `);
});