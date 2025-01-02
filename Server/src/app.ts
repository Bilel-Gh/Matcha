import express from 'express';

const app = express();
const port = process.env.SERVER_PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Matcha API is running!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
