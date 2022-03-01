import express from 'express';

import bodyParser from 'body-parser';

import {
  updateReviewers,
} from './github-pr-script.mjs';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 3000

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