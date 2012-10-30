var fs = require('fs')

var loadTemplates = function(path) {
  var templates = {}
  // Load all files from the views path and save them to the templates object
  fs.readdir(path, function (err, files) {
    if (err) {
      return console.log(err)
    }
    files.forEach(function (file) {
      loadTemplateFromDisk(file, path, templates)
    })
  })

  return templates;
}

var loadTemplateFromDisk = function(file, path, templates) {
  fs.readFile(path + file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err)
    }
    fileName = file.split('.')[0]
    templates[fileName] = data
  })
}

module.exports = loadTemplates;