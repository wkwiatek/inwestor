//
// MongoDB connectivity configuration
//
// THIS IS WHERE TO ADD MONGOLAB CONFIG INFO
// exports.databaseUrl = "dbh<server>.mongolab.com:<port>";
// exports.databaseName = "<databasename>";
// exports.username = "<username>";
// exports.password = "<password>";
//
exports.databaseUrl = "localhost";
exports.databaseName = "gpw";
exports.username = "wkwiatek";
exports.password = "wkwi123";

//
// allowedFiles: array of "inbound URL pathnames" mapped to allowed filenames to limit potentially malicious behaviors
//
exports.allowedFiles = { "/index.html" : "index.html",
			 "/" : "index.html",
			 "/3dmongodemo.js" : "3dmongodemo.js",
			 "/glge-compiled-min.js" : "glge-compiled-min.js",
			 "/jquery-1.6.4.min.js" : "jquery-1.6.4.min.js", 
			 "/level.xml" : "level.xml",
			 "/map.png" : "map.png",
			 "/glgelogo.png" : "glgelogo.png",
			 "/MongoLabLogo.jpg" : "MongoLabLogo.jpg",
			 "/crate.jpg" : "crate.jpg",
			 "/wallnorm.jpg" : "wallnorm.jpg",
			 "/random.txt" : "random.txt",
			 "/LICENSE": "LICENSE"};



