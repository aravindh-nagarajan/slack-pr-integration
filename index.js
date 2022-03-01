const express = require('express');

const bodyParser = require('body-parser');

const {
  updateReviewers,
} = require('./github-pr-script.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 3500;

app.post('/assign', (req, res) => {
  console.log(req.body);

  res.send('Hello World!')
});

app.get('/ping', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})