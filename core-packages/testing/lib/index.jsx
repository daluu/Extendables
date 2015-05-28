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
	this.results = null;
	this.runInfo = {
		duration: 0,
		date: null,
		time: null,
		environment: null,
		testRan: false
	}

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

	this.parseResults = function(){
		// some background info
		var datetime = new Date();
		this.runInfo.date = datetime.toDateString();
		this.runInfo.time = datetime.getHours() + ":" + datetime.getMinutes();
		this.runInfo.environment = this.get_environment();
		this.results = this.run(); // run tests
		this.runInfo.duration = ((new Date().getTime() - datetime.getTime())/1000).toFixed(2);
		this.testRan = true;
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

		if(!this.runInfo.testRan) this.parseResults();
		
		// tidy up results
		for(var i = 0; i < this.results.length; i++){
			var suite = this.results[i];
			for(var j = 0; j < suite.specs.length; j++){
				if (suite.specs[j].result == 'failed') {
					var messages = [];
					for(var k = 0; k < suite.specs[j].messages.length; k++){
						if(suite.specs[j].messages[k] != 'Passed.')
							messages.push(suite.specs[j].messages[k]);
					}
					suite.specs[j].problem = messages.join("\n");
				} else {
					suite.specs[j].problem = '';
				}
			}
		}

		var jsonResult = {};
		var testSuiteLinks = {};
		var resultsOverview = {};
		jsonResult.title = "Extendables test report";
		testSuiteLinks['patch tests'] = "tests.patches.html";
		testSuiteLinks['framework tests'] = "tests.framework.html";
		testSuiteLinks['package tests'] = "tests.packages.html";
		jsonResult['test suites'] = testSuiteLinks;
		jsonResult['date'] = this.runInfo.date;
		jsonResult['time'] = this.runInfo.time;
		resultsOverview['total tests'] = sumResults(this.results,'total');
		resultsOverview['passed tests'] = sumResults(this.results,'passed');
		resultsOverview['failed tests'] = sumResults(this.results,'failed');
		resultsOverview['test duration'] = this.runInfo.duration;
		jsonResult.overview = resultsOverview;
		jsonResult.suites = this.results;
		jsonResult.environment = this.runInfo.environment;

		return jsonResult;
	}

	this.to_console = function () {

		if(!this.runInfo.testRan) this.parseResults();

		for(var i = 0; i < this.results.length; i++){
			var suite = this.results[i];
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

		if(!this.runInfo.testRan) this.parseResults();
		
		// tidy up results
		for(var i = 0; i < this.results.length; i++){
			var suite = this.results[i];
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

		if(typeof module != 'undefined')
        	var template = new Template("report.html", module);
        else{
        	var path = new File($.fileName).fullName;
        	var module = {id: "index", uri: path};
        	var template = new Template("report.html", module);
        }
		template.render({
		  'date': this.runInfo.date, 
		  'time': this.runInfo.time, 
		  'duration': this.runInfo.duration, 
		  'suites': this.results, 
		  'total': sumResults(this.results,'total'),
		  'fails': sumResults(this.results,'failed'),
		  'passes': sumResults(this.results,'passed'),
		  'environment': this.runInfo.environment
		});
		template.write_to(filename);
	}

	this.to_xml = function (filename) {

		if(!this.runInfo.testRan) this.parseResults();
		
		// tidy up results
		for(var i = 0; i < this.results.length; i++){
			var suite = this.results[i];
			for(var j = 0; j < suite.specs.length; j++){
				if (suite.specs[j].result == 'failed') {
					var messages = [];
					for(var k = 0; k < suite.specs[j].messages.length; k++){
						if(suite.specs[j].messages[k] != 'Passed.')
							messages.push(suite.specs[j].messages[k]);
					}
					suite.specs[j].problem = messages.join("\n");
				} else {
					suite.specs[j].problem = '';
				}
			}
		}

		if(typeof module != 'undefined')
        	var template = new Template("report.xml", module);
        else{
        	var path = new File($.fileName).fullName;
        	var module = {id: "index", uri: path};
        	var template = new Template("report.xml", module);
        }
		template.render({
		  'date': this.runInfo.date, 
		  'time': this.runInfo.time, 
		  'duration': this.runInfo.duration, 
		  'suites': this.results, 
		  'total': sumResults(this.results,'total'),
		  'fails': sumResults(this.results,'failed'),
		  'passes': sumResults(this.results,'passed'),
		  'environment': this.runInfo.environment
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