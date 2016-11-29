var http = require('http');
var express = require('express')
app = express();
port = process.env.PORT || 3000;

var redis = require("redis"), // require the redis module
redisClient,
services,
redisCredentials;


// set up our services
if (process.env.VCAP_SERVICES) {
	services = JSON.parse(process.env.VCAP_SERVICES);
	redisCredentials = services["rediscloud"][0].credentials;
} else {
	redisCredentials = {
		"hostname": "127.0.0.1",
		"port": "6379",
		"password": null
	};
}

// create a client to connect to Redis
client = redis.createClient(redisCredentials.port, redisCredentials.hostname);
client.auth(redisCredentials.password, function (response) {
	console.log(response);
});

app.use(express.static(__dirname + "/client"));
app.use(express.urlencoded());
// create Express-powered HTTP server
http.createServer(app).listen(port);

//
app.post("/store", function (req, res) {
	var keyValue = req.body,
	response;

	client.set(keyValue["key"], keyValue["value"]);

	response = keyValue;
	console.log("Received KeyValue:" + JSON.stringify(response) + "\n");
	return res.json(response);	
});

// 
app.post("/search", function(req, res){
	var key = req.body,
	response;

	client.exists(key["key"], function(err, reply) {
		if (reply === 1) { //Key Found
			client.get(key["key"], function(err, reply) {
				var value = reply;
				response = {
					"key": key["key"],
					"value": value
				}
				console.log("Responded KeyValue:" + JSON.stringify(response) + "\n");
				return res.json(response);
			});
			
		} else {
			response = { //Key Not Found
				"key": "Does not exist",
				"value": "Does not exist"
			}
			console.log("Responded KeyValue:" + JSON.stringify(response) + "\n");
			return res.json(response);
		}
	});

	
});