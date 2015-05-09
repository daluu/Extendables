if(typeof exports != 'undefined')
	exports.Template = Template;

function Template (path, for_module) {
	var self = this;
	var templates_folder = new Folder(new File(for_module.uri).parent.path + "/templates");
	var template_file = new File(templates_folder.fullName + "/" + path); //new File(path).at("templates").at(new File(for_module.uri).parent.parent);
	if (!template_file.exists) {
		throw Error("Couldn't open template: "+template_file.fullName);
	}
	template_file.open("r");
	this.template = template_file.read();
	template_file.close();
	
	this._output = false;

	this.process_partials = function (replacement_obj) {
		var out = self.template;
		var partial_syntax = new RegExp(/\{(\S+) => (\S+)\}/g);
		var matches = self.template.match(partial_syntax);
		if (!matches) return out;
		var replacements = [];
		for(var i = 0; i < matches.length; i++){
			var partial = partial_syntax.exec(self.template);
			var name = partial[1];
			var obj = replacement_obj[name];
			var path = partial[2];
			// if we're dealing with an array, loop through it
			if (obj instanceof Array) {
				var template_elements = [];
				for(var j = 0; j< obj.length; j++)
					template_elements.push(new Template(path, for_module).render(obj[j]));
				var output = template_elements.join('');				
			} else {
				var output = new Template(path, for_module).render(obj);	
			}
			replacements.push({'from': matches[i], 'to': output});
		}
		for(var k = 0; k < replacements.length; k++)
			out = out.replace(replacements[k].from, replacements[k].to);
		return out;
	}
	
	this.render = function () {
		// partials
		self._output = self.process_partials(arguments[0]);
		// string formatting
		var dict = arguments[0];
		var keys = [];
		for (var key in dict)
	        if (dict.hasOwnProperty(key) && !(dict[key] instanceof Function)) keys.push(key);	    
		for(var i = 0; i < keys.length; i++)
			self._output = self._output.replace("{" + keys[i] + "}", dict[keys[i]], "g");
		return self._output;
	}

	this.write_to = function (path) {
		var logfolder = new Folder(new File($.fileName).parent.parent.parent.path + "/log");
		var out = new File(logfolder.fullName + "/" + path); //new File(path).at("log").at(Folder.extendables);
		if (this._output) {
			out.open("w");
			out.write(this._output);
			out.close();
		} else {
			throw new Error("There's no output to write. Did you call the render method first?");
		}
	}
}