// CONFIGURATION - START
var sourceFolder = './sourceFolder';  // where are the files that I want to process?
var targetFolder = './targetFolder';  // where should processed files be saved to?
// CONFIGURATION - END

var fs = require('fs');
var path = require('path');
var gm = require('gm').subClass({imageMagick: true});
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('filenamesToProcess.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let filenames = [];

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    filenames.push(line);
  }
  process_filenames(sourceFolder, targetFolder, filenames);
}


function remove_background(image) {
    image.fill("none");
    image.fuzz(3, true);
    image.draw("alpha 0,0 floodfill");
    image.flop();
    image.draw("alpha 0,0 floodfill");
    image.flop();
    image.trim();
    return image;
}

function process_folder(sourceFolder, targetFolder) {
    fs.readdir(sourceFolder, function (err, filenames) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        process_filenames(sourceFolder, targetFolder, filenames);
    });
}

function process_filenames(sourceFolder, targetFolder, filenames){
    //listing all files using forEach
    filenames.forEach(function (filename) {
        var sourceFilePath = path.join(sourceFolder, filename);
        var fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
        var fileExtension = filename.split('.').pop();
        if (fileExtension == 'jpg') {
            var sourceImage = gm(sourceFilePath);
            var targetImage = remove_background(sourceImage);
            var targetFilenameLowRes = path.join(targetFolder, 'low_res', fileNameWithoutExtension) + '.png';  //100px high
            var targetFilenameHighRes = path.join(targetFolder, 'high_res', fileNameWithoutExtension) + '.png'; //900px high
            var targetImageHighRes = targetImage.resize(null, 900);
            save_image(targetImageHighRes, targetFilenameHighRes); 
            var targetImageLowRes = targetImage.resize(null, 100);
            save_image(targetImageLowRes, targetFilenameLowRes); 
        }
    });
}

function save_image(targetImage, targetFilename) {
    targetImage.write(targetFilename, function (err) {
        if (err) {
            return console.log('error: ' + targetFilename + ' (' + err + ')');
        }
        console.log('success: ' + targetFilename);
    });
}

processLineByLine();
//process_folder(sourceFolder, targetFolder);