const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;
console.log(MONGO_URL);

const connect = () => {
  if (NODE_ENV !== 'production') mongoose.set('debug', true);

  mongoose.connect(
    MONGO_URL,
    {
      dbName: 'nodeplace',
      useNewUrlParser: true,
      useCreateIndex: true,
    },
    (err) => {
      if (err) {
        console.log('몽고디비 연결에러', err);
      } else {
        console.log('몽고 디비 연결 성공');
      }
    },
  );
};

mongoose.connection.on('error', (err) => {
  console.error('mongoDB connection error', err);
});

mongoose.connection.on('disconnect', () => {
  console.long('mongoDB disconnection, retry..');
  connect();
});

module.exports = connect;
