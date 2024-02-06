const fs = require('fs');
const {Transform} = require('stream');
const csvParser = require('csv-parser');

const filtersRedundancy = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      callback(null, Object.assign({}, chunk, {chunked_1:true}));
    }
  });

  const transformStream4 = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Transform logic for stream 3
      console.log(chunk)
      this.push(chunk);
      callback();
    }
  });

const reader = fs.createReadStream('./testfile0.csv')
    .pipe(csvParser({headers:['A','B','C','D','E','F','G','H','I','J','K','L','M']}))
    .pipe(filtersRedundancy)
    .pipe(transformStream4)
    .on('finish', ()=>{
        console.log('Finished');
    })
