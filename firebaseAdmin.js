var admin = require("firebase-admin");

var serviceAccount = require("../knitnation/service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ecom-5efc6-default-rtdb.asia-southeast1.firebasedatabase.app"
});
