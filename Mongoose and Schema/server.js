const app = require('./src/app'); // app.js file ke import kora jate server.js file e use kora jay
const connectDB = require('./src/db/db'); // db.js file ke import kora jate server.js file e use kora jay

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


connectDB(); // connectDB function ke call kora jate MongoDB te connect kora jay




app.listen(3000, () => {
    console.log('Server is running on port 3000');
})