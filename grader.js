#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var rest = require('restler');
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertValidUrl = function(inputUrl) {
    // check for valid input url
    inputUrl = inputUrl.trim();
    if (inputUrl == "") {
        console.log("Please enter a URL");
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return inputUrl;
}

var performChecks = function(inputStr, checksfile) {
    var $ = cheerio.load(inputStr);
    var checks = JSON.parse(fs.readFileSync(checksfile)).sort();
    var checkResults = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        checkResults[checks[ii]] = present;
    }
    console.log(JSON.stringify(checkResults, null, 4));
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {

    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to web page', clone(assertValidUrl), URL_DEFAULT)
        .parse(process.argv);

    var url = program.url.trim();
    if (!url) {
        //console.log("FROM FILE - " + program.file);
        var buffer = new Buffer(fs.readFileSync(program.file), "utf-8");
        result = buffer.toString();
        performChecks(result, program.checks);
    }
    else {
        //console.log("FROM URL - " + url);
        rest.get(url).on('complete', function(result) {
            if (result instanceof Error) {
                console.log("Invalid url");
                process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
            } else {
                performChecks(result, program.checks);
            }
        });
    }
} else {
    //exports.checkHtmlFile = checkHtmlFile;
    exports.performChecks = performChecks;
}

