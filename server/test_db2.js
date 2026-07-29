const { MongoClient } = require('mongodb');
const uri = "mongodb://kumarshubham50102_db_user:DMnR3QcPrU2iJnbf@ac-aabwxwp-shard-00-00.zxaccpw.mongodb.net:27017,ac-aabwxwp-shard-00-01.zxaccpw.mongodb.net:27017,ac-aabwxwp-shard-00-02.zxaccpw.mongodb.net:27017/hindu_qna?ssl=true&replicaSet=atlas-ot85ef-shard-0&authSource=admin&appName=Cluster0";
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('vedabase');
  const count = await db.collection('verses').countDocuments();
  console.log("Verses count in MONGODB_URI vedabase:", count);
  await client.close();
}
run();
