const app = require('./app');
const invitationRoutes = require('./routes/invitationRoutes');
const indexRoutes = require('./routes/indexRoutes');
const submitRoutes = require('./routes/submitRoutes');
const healthRoutes = require('./routes/healthRoutes');
const port = process.env.PORT || 3000;
const express = require('express');

app.use('/', indexRoutes);
app.use('/', invitationRoutes);
app.use('/', submitRoutes);
app.use('/', healthRoutes);
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
