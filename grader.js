var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var sys = require('util');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://floating-citadel-8367.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var myURLChecker = function(url_entered) {
   rest.get(url_entered).on('complete', function(result) {
        if (result instanceof Error) { 
           sys.puts('Error: ' + result.message); this.retry(5000); // try again after 5 sec
        } else { 
                fs.writeFile("result.json", result, function(err) { 
                            if(err) { console.log(err); 
                            } else {
                                     var checkJson_html = checkHtmlFile("result.json", program.checks);
                                     var outJson = JSON.stringify(checkJson_html, null, 4);
                                     console.log(outJson);
                                   };
                 });
        };
    });
};

if(require.main == module) {
    program
        .option('-c, --checks', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url', 'Path to url', clone(myURLChecker), URL_DEFAULT)
        .parse(process.argv);

    if (program.file) {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    } else {
           if (program.url) {
              var checkJson = myURLChecker(process.argv[5], program.checks);
           };
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
} 
