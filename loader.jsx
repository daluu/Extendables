/*
 * A more-or-less CommonJS-compliant module import system.
 * Namespaces for Javascript -- yay!
 */

var __modules__ = {};
function require (module_id) {
	// CommonJS: A module identifier is a String of "terms"
	var terms = module_id.split('/');
	var module = terms.shift();
	if (__modules__.hasOwnProperty(module)) {
		if (terms.length) {
			return __modules__[module].get_submodule(terms).load().exports;
		} else {
			return __modules__[module].load().exports;
		}
	} else {
		throw Error("No package named " + module_id);
	}
}

// extracts a module into the global namespace (like the eponymous PHP function);
// to be avoided, but sometimes convenience trumps stringency
function extract (module_id) {
	var module = require(module_id);
	for (var name in module) {
		$.global[name] = module[name];
	}
}

function _is_valid_module (file_or_folder) {
	//return file_or_folder.is(Folder) || file_or_folder.name.endswith(".jsx");
	return file_or_folder instanceof Folder || new Boolean(file_or_folder.name.length && file_or_folder.name.indexOf(".jsx") == (file_or_folder.name.length - ".jsx".length)).valueOf();	
}

function Module (file_or_folder, is_package) {	
	var self = this;
	
	this.eval = function (file) {
		var exports = {};
		var module = {
			'id': self.id,
			'uri': self.uri
			};

		try {
			$.evalFile(file);
		} catch (error) {
			if(typeof log_buffer != 'undefined')
				log_buffer.push([3, "Could not fully load " + module.id + "\n" + error]);
		}
		if(typeof exports.wrap_methods_with_try_catch != 'undefined'){
			if(exports.wrap_methods_with_try_catch){
				var props = [];
				for (var prop in exports) {
			        if (exports.hasOwnProperty(prop) && !(exports[prop] instanceof Function)) props.push(prop);
			    }
			    for(var i = 0; i < props.length; i++){
			    	var k = props[i];
			    	if(typeof exports[k] === 'function' && k[0].toLowerCase() === k[0]){
						var original = exports[k];
						exports[k] = function(){
							try {
								return original.apply(this, arguments);
							}
							catch(e){
								throw e;
							}
						};
					}
			    }
			}
		}		
		return exports;		
	};

	this.extract_submodules = function () {
		var base = file_or_folder;
		if (is_package) {
			base.changePath("./lib");
		}
		var submodule_files = base.getFiles(_is_valid_module);

		for(var i = 0; i < submodule_files.length; i++){
			var submodule = new Module(submodule_files[i]); //new Module(submodule);
			self.submodules[submodule.id] = submodule;
		}
	};

	this.get_submodule = function (terms) {
		var submodule = self.submodules[terms.shift()]
		if (terms.length) {
			return submodule.get_submodule(terms);
		} else {
			return submodule;
		}
	};

	this.get_subpackages = function () {
		var keys = [];
		for (var key in self.submodules){
        	if (self.submodules.hasOwnProperty(key) && !(self.submodules[key] instanceof Function))
        		keys.push(key);
        }
        var values = [];
		for (var i = 0; i < keys.length; i++){
			var submodule = self.submodules[keys[i]];
			if(submodule.packaged && submodule.id != 'tests')
				values.push(submodule);
		}
		return values;		
	}

	this.has_subpackages = function () {
		return !!self.get_subpackages().length;
	}

	this.get_tests = function () {
		var testfolder = new Folder(new Folder(self.uri).fullName + "/test"); //new Folder("test").at(self.uri);
		if (testfolder.exists) {
			return testfolder.getFiles("*.specs");
		} else {
			return [];
		}
	}

	this.load = function () {
		if (self.packaged) {
			self.exports = self.submodules['index'].load().exports;
		} else {
			self.exports = self.eval(self.uri);
		}
		return self
	}
	
	/* init */
	this.id = file_or_folder.displayName.split('.')[0];
	this.uri = file_or_folder.absoluteURI;
	this.packaged = file_or_folder instanceof Folder;
	this.submodules = {};
	if (this.packaged) {
		this.extract_submodules();
	}
}

function load_modules (packagefolders) {
	for(var i = 0; i < packagefolders.length; i++){
		var packagefolder = packagefolders[i];
		if (typeof packagefolder === 'string') {
			var folder = new Folder(new File($.fileName).path + packagefolder); //new Folder(packagefolder).at(Folder.extendables);
		} else {
			var folder = packagefolder;
		}
		var packages = folder.getFiles(_is_valid_module);

		for(var j = 0; j < packages.length; j++){
			var file_or_folder = packages[j];
			// An alias regists as a file in ExtendScript, even if it refers to a folder.
			// Check if the file is an alias and, if so, resolve it.
			if (file_or_folder.alias) file_or_folder = file_or_folder.resolve();
			var module = new Module(file_or_folder, true);
			__modules__[module.id] = module;
		}		
	}	
}