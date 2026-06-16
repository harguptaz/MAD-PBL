const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("c:\\Users\\Admin\\OneDrive\\Documents\\Study_Material\\sem2\\MAD\\PBL\\client\\public\\india-states.json");
https.get("https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson", function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download complete');
  });
}).on('error', function(err) {
  fs.unlink("c:\\Users\\Admin\\OneDrive\\Documents\\Study_Material\\sem2\\MAD\\PBL\\client\\public\\india-states.json");
  console.error('Error:', err.message);
});
