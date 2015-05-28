/* Modified barebones version of Extendables test framework
 * containing only the core modules:
 * logging, testing, templating, Jasmine
 * as needed for testing scripts/code
 * leaving out the extraneous object/array/string prototype "extensions", etc.
 */

//import Extendables minimum core libraries for testing
#include "../core-packages/templating/lib/index.jsx";
#include "../core-packages/testing/lib/index.jsx";
#include "../core-packages/logging/lib/index.jsx";
var tests = new TestRunner();
var datetime = new Date();
var timestamp = datetime.toDateString() + " " + datetime.getHours() + "-" + datetime.getMinutes();
var log = new Log("WhateverYouNameThisTestSuiteResults " + timestamp + ".log",5); //under Extendables/log

var specs = [];
var tempSpecs = new File($.fileName).parent.getFiles("*.specs");
for(var i = 0; i < tempSpecs.length; i++){
	if(tempSpecs[i] instanceof File){ //or != Folder
		specs.push(tempSpecs[i]);
	}
}

for(var j = 0; j < specs.length; j++){
	var specfile = specs[j];
	try {
		$.evalFile(specfile);
	} catch (error) {
		$.writeln(specfile + " is not a valid specifications file.\n" + error);
	}
}

tests.to_html("WhateverYouNameThisTestSuiteResults " + timestamp + ".html");
//tests.to_xml("WhateverYouNameThisTestSuiteResults " + timestamp + ".xml");
//log.info(tests.as_json().toSource());
