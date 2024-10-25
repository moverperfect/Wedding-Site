require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const setCacheHeaders = require('./middlewares/setCacheHeaders');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(setCacheHeaders);

module.exports = app;
