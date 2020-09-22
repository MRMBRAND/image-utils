// CONFIGURATION - START
var sourceFolder = './sourceFolder';  // where are the files that I want to process?
var targetFolder = './targetFolder';  // where should processed files be saved to?
// CONFIGURATION - END

var fs = require('graceful-fs');
var path = require('path');
var gm = require('gm').subClass({imageMagick: true});
const readline = require('readline');

async function processFilenamesFromFile() {
  const fileStream = fs.createReadStream('removeBackgroundFilenames.txt');

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
  processFilenames(sourceFolder, targetFolder, filenames);
}


function removeBackground(image) {
    image.fill("none");
    image.fuzz(3, true);
    image.draw("alpha 0,0 floodfill");
    image.flop();
    image.draw("alpha 0,0 floodfill");
    image.flop();
    image.trim();
    return image;
}

function processFilenames(sourceFolder, targetFolder, filenames){
    return filenames.reduce( async (previousPromise, filename) => {
        await previousPromise;
        return processFilename(sourceFolder, targetFolder, filename);
    }, Promise.resolve()).then(function(){
        console.log("All done!");
    });
}

function processFilename(sourceFolder, targetFolder, filename) {
    var sourceFilePath = path.join(sourceFolder, filename);
    var fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
    var fileExtension = filename.split('.').pop();
    if (fileExtension == 'jpg') {
        var sourceImage = gm(sourceFilePath);
        var targetImage = removeBackground(sourceImage);
        var targetFilenameLowRes = path.join(targetFolder, 'low_res', fileNameWithoutExtension) + '.png';  //100px high
        var targetFilenameHighRes = path.join(targetFolder, 'high_res', fileNameWithoutExtension) + '.png'; //900px high
        var targetImageHighRes = targetImage.resize(null, 900);
        var highResImageSavePromise = saveImage(targetImageHighRes, targetFilenameHighRes); 
        var targetImageLowRes = targetImage.resize(null, 100);
        var lowResImageSavePromise = saveImage(targetImageLowRes, targetFilenameLowRes); 
    }
    return Promise.all([highResImageSavePromise, lowResImageSavePromise]);
}

function saveImage(targetImage, targetFilename) {
    return new Promise((resolve, reject) => {
        targetImage.write(targetFilename, function (err) {
            if (err) {
                console.log('error: ' + targetFilename + ' (' + err + ')');
                return reject();
            }
            console.log('success: ' + targetFilename);
            resolve();
        });
    });
}

processFilenamesFromFile();