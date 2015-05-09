#include "../../../dependencies/jasmine.js";

if(typeof exports != 'undefined'){
	exports.jasmine = jasmine;
	exports.spyOn = spyOn;
	exports.it = it;
	exports.xit = xit;
	exports.expect = expect;
	exports.runs = runs;
	exports.waits = waits;
	exports.waitsFor = waitsFor;
	exports.beforeEach = beforeEach;
	exports.afterEach = afterEach;
	exports.describe = describe;
	exports.xdescribe = xdescribe;
}

if(typeof require != 'undefined')
	var Template = require("templating").Template;

function sumResults(results,type){
	var sum = 0;
	for(var i = 0; i < results.length; i++){
		var result = results[i];
		sum += result[type];
	}
	return sum;
}

var TestRunner = function () {
	this._clean_results = function (suites, results) {
		var cleaned_results = [];
		var len = suites.length;
	    for (var i = 0; i < len; i++){
	    	var suite = suites[i];
			var total = suite.children.length;
			var passed = 0;
			var specs = [];
			for(var j = 0; j < total; j++){
				var spec = suite.children[j];
				specs.push({
					'name': spec.name, 
					'result': results[spec.id].result, 
					'messages': results[spec.id].messages
					});
				if(results[spec.id].result == "passed") passed++;
			}
			
			cleaned_results.push({
				'name': suite.name,
				'passed': passed,
				'failed': new Number(total - passed),
				'total': total,
				'specs': specs
				});
		}
		return cleaned_results;
	}

	this.run = function () {
		var reporter = new jasmine.JsApiReporter();
		jasmine.getEnv().addReporter(reporter);
		jasmine.getEnv().execute();
		return this._clean_results(reporter.suites_, reporter.results());
	}

	this.get_environment = function () {
		var env = {
			'OS': $.os,
			'ExtendScript build': $.build,
			'ExtendScript version': $.version,
			'path': $.includePath,
			'locale': $.locale,
			'app': app.name,
			'app version': app.version
		}
		var keyMap = [];
		for(var key in env){
			if(env.hasOwnProperty(key))
				keyMap.push({'key': key, 'value': env[key]});
		}
		return keyMap;
	}

	// we'll add this into the html representation, 
	// so people can upload structured test reports to our central server.
	this.as_json = function () {
		
	}

	this.to_console = function () {
		var results = this.run();

		for(var i = 0; i < results.length; i++){
			var suite = results[i];
			$.writeln("\nSuite: " + suite.name + " \tran " + suite.total + " tests, " + suite.failed + " failure(s)");
			for(var j = 0; j < suite.specs.length; j++){
				$.writeln("\t" + suite.specs[j].result.toUpperCase() + "\t" + suite.specs[j].name);
			}
		}		
	}

	this.to_log = function () {
		// todo
	}

	this.to_html = function (filename) {
		// some background info
		var datetime = new Date();
		var date = datetime.toDateString();
		var time = datetime.getHours() + ":" + datetime.getMinutes();
		var environment = this.get_environment();	

		// run tests
		var results = this.run();
		
		// tidy up results
		for(var i = 0; i < results.length; i++){
			var suite = results[i];
			for(var j = 0; j < suite.specs.length; j++){
				if (suite.specs[j].result == 'failed') {
					var messages = [];
					for(var k = 0; k < suite.specs[j].messages.length; k++){
						if(suite.specs[j].messages[k] != 'Passed.')
							messages.push(suite.specs[j].messages[k]);
					}
					suite.specs[j].problem = '<p class="problem">' + messages.join("<br />") + '</p>';
				} else {
					suite.specs[j].problem = '';
				}
			}
		}

		var duration = ((new Date().getTime() - datetime.getTime())/1000).toFixed(2);

		if(typeof module != 'undefined')
        	var template = new Template("report.html", module);
        else{
        	var path = new File($.fileName).fullName;
        	var module = {id: "index", uri: path};
        	var template = new Template("report.html", module);
        }
		template.render({
		  'date': date, 
		  'time': time, 
		  'duration': duration, 
		  'suites': results, 
		  'total': sumResults(results,'total'),
		  'fails': sumResults(results,'failed'),
		  'passes': sumResults(results,'passed'),
		  'environment': environment
		});
		template.write_to(filename);
	}

	// would be incredibly interesting to see usage patterns and whether certain tests
	// fail consistently on the same platform or app version or ...
	this.to_central_server = function () {
		// todo
	}
}

if(typeof exports != 'undefined')
	exports.tests = new TestRunner();