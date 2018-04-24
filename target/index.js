var express = require('express');
var app = express();
app.get('/admin/health', function (req, res) {
	console.log("status hit")
  res.send('{"status":"success"}');
});
app.get('/customer', function (req, res) {
  res.send('{"customer":"data"}');
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
