const express = require('express');

const bodyParser = require('body-parser');

const {
  assign,
} = require('./github-pr-script.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 3500;

app.post('/assign', (req, res) => {
  console.log(req.body);

  const { prNumber, author } = req.body;

  assign(prNumber, author).then(() => {
    res.send('Done');
  }).catch((err) => {
    console.error(err);

    res.send('Failed');
  });
});

app.get('/ping', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Slack ALB UI app listening on port ${port}`)
})