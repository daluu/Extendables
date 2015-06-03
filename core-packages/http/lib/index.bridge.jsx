// convenience shortcuts
// basic_auth (opt): any object that satisfies {'username': x, 'password': y}

// exports
if(typeof exports != 'undefined'){
	exports.get = get;
	exports.head = head;
	exports.post = post;
	exports.put = put;
	exports.del = del;
	exports.has_internet_access = has_internet_access;
	exports.HTTPError = HTTPError;
	exports.HTTPRequest = HTTPRequest;
}
// imports
var url = "";
if(typeof exports != 'undefined' && typeof require != 'undefined')
	url = exports.url = require("http/url");

if(typeof require != 'undefined')
	var ByteString = require("io/octals").ByteString;
else{
	#include "../../io/lib/octals.jsx";
	var ByteString = ByteString;
}

// definitions
var HTTPError;
if(typeof Error.factory != 'undefined')
	HTTPError = Error.factory("HTTPError");
else
	HTTPError = Error;

// basic_auth: authentication with an intranet is a common use-case
// timeout: we want to make it easy to do long polling
function _pull (request, basic_auth, timeout) {
	// will simply return false if basic_auth is undefined
	request.auth.basic(basic_auth);
	if (timeout != undefined) {
		request.timeout(timeout);
	}
	return request.do();	
}

function _push (request, data, basic_auth, timeout) {
	request.content(data);
	return _pull(request, basic_auth, timeout);
}

/**
 * @desc Performs a GET request on the specified resource.
 * @param {String} url The URL for the resource
 * @param {Object} [basic_auth] Basic authentication — any object with ``username`` and ``password`` properties will do.
 * @param {Number} [timeout=5] How long before the http client should give up.
 */

function get (url, basic_auth, timeout) {
	var request = new HTTPRequest("GET", url);
	return _pull(request, basic_auth, timeout);
}

/**
 * @desc Performs a HEAD request on the specified resource. Similar to a GET request, but only returns the http headers.
 * @param {String} url The URL for the resource
 * @param {Object} [basic_auth] Basic authentication — any object with ``username`` and ``password`` properties will do.
 * @param {Number} [timeout=1] How long before the http client should give up.
 */

function head (url, basic_auth, timeout) {
	var request = new HTTPRequest("HEAD", url);
	return _pull(request, basic_auth, timeout);
}

/**
 * @desc Performs a POST request on the specified resource.
 * @param {String} url The URL for the resource
 * @param {Object|String} data Either an object, to be urlencoded by this function, or a string that 
 * will be passed along unchanged.
 * @param {Object} [basic_auth] Basic authentication — any object with ``username`` and ``password`` 
 * properties will do.
 * @param {Number} [timeout=5] How long before the http client should give up.
 */

function post (url, data, basic_auth, timeout) {
	var request = new HTTPRequest("POST", url);
	return _push(request, data, basic_auth, timeout);
}

/**
 * @desc Performs a PUT request on the specified resource. PUT requests are like POST requests, but idempotent.
 * @param {String} url The URL for the resource
 * @param {Object|String} data Either an object, to be urlencoded by this function, or a string that 
 * will be passed along unchanged.
 * @param {Object} [basic_auth] Basic authentication — any object with ``username`` and ``password`` 
 * properties will do.
 * @param {Number} [timeout=1] How long before the http client should give up.
 */

function put (url, data, basic_auth, timeout) {
	var request = new HTTPRequest("PUT", url);
	return _push(request, data, basic_auth, timeout);
}

/**
 * @desc Performs a DELETE request on the specified resource.
 * @param {String} url The URL for the resource
 * @param {Object} [basic_auth] Basic authentication — any object with ``username`` and ``password`` 
 * properties will do.
 * @param {Number} [timeout=1] How long before the http client should give up.
 */

function del (url, basic_auth, timeout) {
	var request = new HTTPRequest("DELETE", url);
	return _pull(request, basic_auth, timeout);
}

/**
 * @desc Tests whether the application has access to the internet.
 * If not, this might either imply that the user is simply not connected, 
 * or otherwise that a firewall is blocking internet access for the active
 * Creative Suite app.
 */

function has_internet_access () {
	var response = head("http://www.w3.org/");
	// the socket won't even open if we don't have an internet connection, 
	// so there are probably more robust tests we could do than this one
	if (response.status = 200) {
		return true;
	} else {
		return false;
	}
}

/**
 * @class
 * 
 * @desc An incomplete but "good enough" implementation of the hypertext transfer protocol
 * for the client side. This is a lower-level interface. It feeds the :func:`get`, :func:`head`, 
 * :func:`post`, :func:`put` and :func:`del` convenience functions.
 *
 * Supports:
 *
 * * most HTTP methods: ``GET``, ``HEAD``, ``POST``, ``PUT``, ``DELETE``
 * * persistent connections
 * * chunked responses
 * * redirects
 *
 * Soon:
 *
 * * focus on reliability, more tests
 * * basic authentication
 *
 * Most likely never: 
 *
 * * digest authentication
 * * cookies
 * * proxies
 * * caching / 304 Not Modified
 *
 * HTTPRequest objects are entirely getter/setter-based, so e.g. use ``req.method()``
 * to get the current request method, and use ``req.method("POST")`` to change the 
 * request method.
 *
 * @param {String} [method]
 * @param {String} url
 * @param {Number} [timeout]
 *
 * @example
 *      var http = require("http");
 *      var example = "http://www.example.com"
 *      var response = http.HTTPRequest("GET", example);
 *      if (response.status == 200) {
 *          $.writeln(response.body);
 *      } else {
 *          $.writeln("Couldn't fetch {}".format(example));
 *      }
 */

function HTTPRequest (method, url, timeout) {
	
	var self = this;

	this._headers = {
		"User-Agent": "Adobe ExtendScript",
		"Accept": "*/*",
		"Connection": "close"
	}

	this.user = undefined;
	this.password = undefined;

	/**
	 * @desc The headers for this request.
	 * By default, these headers are included: 
	 * 
	 * User-Agent
	 *     InDesign ExtendScript
	 * Accept
	 *	*\/*
	 * Connection
	 *	close
	 *
	 * @param {Object} hash A key-value object. Replaces all existing headers.
	 * Use the ``header`` method instead when fetching or changing a single header.
	 */
	this.headers = function (hash) {
		if (hash) {
			// todo: check if we're passed a hash, not a string
			this._headers = hash;
		} else {
			return this._headers;
		}
	}

	/** @desc Get or set a single header. */
	this.header = function (name, value) {
		if (value) {
			this._headers[name] = value;
		} else if (value === false) {
			delete this._headers[name];
		} else {
			return this._headers[name];
		}
	}

	this._convertHeadersObjectToArray = function (){
		var headersArray = [];
		for (header in this._headers){
			if(this._headers.hasOwnProperty(header)){
				//HttpConnection.requestheaders = ["MyHeader" , "MyValue"];
				headersArray.push(header);
				headersArray.push(this._headers[header]);
			}			
		}
		return headersArray;
	}

	/** @desc The resource to request */
	this.url = function (url) {
		if (url) {
			try{
				this._url = require("http/url").parse(url);
				this.header("Host", this._url.host);
			}catch(e){
				this._url = url;
			}			
		} else {
			return this._url;
		}
	}
	this.url(url);

	try{
		this._port = this.url().port || 80;
	}catch(e){
		this._port = 80;
	}	
	/** @desc The server port the request should be directed to. */
	this.port = function (number) {
		if (number) {
			this._port = number;
		} else {
			return this._port;
		}
	}
	
	this._method = method || "GET";
	/** @desc The request method. One of ``GET``, ``HEAD``, ``POST``, ``PUT`` or ``DELETE``. ``GET`` by default. */
	this.method = function (type) {
		if (type) {
			this._method = type;
		} else {
			return this._method;
		}
	}

	this._timeout = timeout || 5;
	/** @desc How long before the http client should give up the request. 5 seconds by default. */
	this.timeout = function (duration) {
		if (duration) {
			if (!duration.is(Number)){
				if(typeof TypeError != undefined)
					throw new TypeError("Timeout should be a number of seconds.");
				else
					throw new Error("Timeout should be a number of seconds.");
			}
			this._timeout = duration;
		} else {
			return this._timeout;
		}
	}

	this._max_redirects = 5;
	/** 
	 * @desc How much redirects the http client should follow before giving up.
	 * @default 5 redirects
	 */
	this.max_redirects = function (value) {
		if (value) {
			this._max_redirects = value;
		} else {
			return this._max_redirects;
		}		
	}

	// From the HTTP 1.1 specs: 
	// "If the 307 status code is received in response to a request other than GET or HEAD, the
	// user agent MUST NOT automatically redirect the request unless it can be confirmed by the
	// user, since this might change the conditions under which the request was issued."
	if (method == "GET" || method == "HEAD") {
		this._follow_redirects = true;
	} else {
		this._follow_redirects = false;
	}
	/** @desc Whether to follow redirects when requesting a resource. By default, true for GET and HEAD requests, false for POST and PUT requests. */
	this.follow_redirects = function (value) {
		if (value || value === false) {
			this._follow_redirects = value;
		} else {
			return this._follow_redirects;
		}
	}

	/** @desc Whether to establish a persistent connection. False by default, and best left that way. */
	this.persistent = function (value) {
		if (value) {
			// set header
		} else {
			// return value
		}
	}

	this._content = '';
	/** @desc Any content to send along with a ``PUT`` or ``POST`` request. */
	this.content = function (data) {
		if (data) {
			this._content = data;
			var m = this.method();
			// we could easily change this request to a POST request if it isn't one, 
			// but Extendables doesn't try to guess too much for the end developer.
			if (m =! "POST" && m != "PUT") {
				throw new HTTPError("Only PUT and POST requests can carry content. This is a " + m + " request");
			}
			this.header("Content-Type", "application/x-www-form-urlencoded");
			this.header("Content-Length", data.length);
		} else if (data === false) {
			this._content = '';
			this.header("Content-Type", false);
			this.header("Content-Length", false);
		} else {
			return this._content;
		}
	}

	/** 
	 * @desc Basic authentication
	 */
	this.auth = {
		basic: function (user) {
			if (user) {
				self.user = user.username;
				self.password = user.password;
			} else {
				return new Boolean(self.header("Authorization"));
			}
		}
	}

	this._encoding = "UTF-8";
	/** @desc The character encoding in which to send this request, which is also the preferred response encoding. */
	this.encoding = function (encoding) {
		var encodings = ['ASCII', 'BINARY', 'UTF-8'];
		if (encoding) {
			// normalize encoding name
			encoding = encoding.toUpperCase();
			// todo: test if encoding is one of ASCII, BINARY or UTF-8, throw an error otherwise
			if (encodings.indexOf(encoding) == -1) {
				throw new HTTPError("Encoding should be one of " + encodings.join(", ") + ". Received " + encoding + " instead.");
			} else {
				this._encoding = encoding;
			}
		} else {
			return this._encoding;
		}
	}

	this._execute = function () {
		var bt = new BridgeTalk();
	    bt.target = 'bridge';
	    var httpTimeout = timeout;
	 
	    //var script = '#include "/pathTo/Extendables/core-packages/http/lib/index.jsx";';
	    var script = '#include "C:\\Users\\dluu\\Documents\\GitHub\\Extendables\\core-packages\\http\\lib\\index.jsx";';
	    script += "if ( !ExternalObject.webaccesslib )\n";
	    script += "  ExternalObject.webaccesslib = new ExternalObject('lib:webaccesslib');\n";
	    script += "var response = undefined;\n";
	    script += "var retry = true;\n";
	    script += "while (retry) {\n";
	    script += "  var http = new HttpConnection('" + this.url + "') ; \n";	    
	    script += "  http.method = '" + this.method() + "';\n";
	    script += "  http.mime = '" + this.header("Content-Type") + "';\n";
	    script += "  http.requestencoding = '" + this.encoding() + "';\n";
	    script += "  http.timeout  = " + this.timeout() + ";\n";
	    script += "  http.redirect  = " + this.max_redirects() + ";\n";
	    script += "  http.requestheaders  = " + this.convertHeadersObjectToArray() + ";\n";
	    script += "  http.request = '" + this.content() + "';\n";
	    script += "  if(this.user != undefined){\n";
	    script += "    http.username = '" + this.user + "';\n";
	    script += "    http.password = '" + this.password + "';\n";
	    script += "  }\n";		
	    script += "  http.execute() ;\n";
	    script += "  try{\n";
	    script += "    response = new HttpResponse('" + this.method() + "', '" + this.encoding() + "', http);\n";
	    script += "    response.process_headers();\n";
	    script += "    response.process();\n";
	 	script += "    retry = false;\n";
	 	script += "  } catch (e){\n";
	 	script += "    BridgeTalk.bringToFront('bridge');\n";
	 	script += "    if (!confirm('There was an error communicating with the server. Would you like to retry?'))\n";
	 	script += "      retry = false;\n";
	 	script += "  }\n";
	 	script += "}\n";
	 	script += "response;\n"; //this is what's returned at the end
	 	
	    bt.body = script;
	    return bt.sendSynch(timeout);
	}

	// _redirect can be safely called even when no redirects are needed;
	// it'll just return the original response.
	this._redirect = function (response) {
		var max = this.max_redirects();
		while (response.is_redirect && response.redirects.length < max) {
			response = response.follow();
		}
		if (response.is_redirect) {
			throw new HTTPError("Gave up after " + max + " redirects.");
		}
		return response;
	}

	/** 
	 * @desc Executes the request.
	 * @returns {Object} Returns a :func:`HTTPResponse` object.
	 */
	this.do = function () {
		var start = new Date();
		var response = this._execute();
		
		// handle redirects, if any
		/* Adobe's HttpConnection should auto-handle redirects?
		if (this.follow_redirects()) {
			response = this._redirect(response);
		}
		*/
		response.response_time = new Date().getTime() - start.getTime();
		return response; //response.process();
	}
}


/**
 * @class
 * @desc The response to an HTTP request. These are returned by :func:`HTTPRequest` objects, 
 * you should never have to construct them yourself.
 *
 * @param method The request method.
 * @param encoding The expected response encoding.
 * @param request The original request; mainly handy for debugging.
 * Available as ``for_request`` on the response object.
 */

function HTTPResponse (method, encoding, httpConnection) {

	this.complete = function () {
		return this.for_request.status; //or "return this.for_request.network;" perhaps
	}

	this.process_headers = function () {
		this.headers = this._convertHeadersArrayToObject();
		this.status = this.for_request.responseStatus;
		// flagging redirects
		// 303 requests, according to the spec, should be changed into a GET request,
		// whereas 301, 302 and 307 requests should be reissued as-is, albeit using the 
		// new URL.
		if (this.status == 303) {
			this.is_redirect = true;
			this.redirection_type = 'get';
		} else if ([301, 302, 307].contains(this.status)) { //to unextend obj method for use standalone w/ minimal imports/includes
			this.is_redirect = true;
			this.redirection_type = 'repeat';
		}
	}

	this._convertHeadersArrayToObject(){
		var headersObj = new Object();
		//for (var i = 0; i <  headersArray.length; i += 2){
		for (var i = 0; i <  this.for_request.responseheaders.length/2; i++){
			//alert(HttpConnection.responseheaders); //contains ["MyHeader" , "MyValue"];
			//headersObj[headersArray[i]] = headersArray[i+1];
			headersObj[this.for_request.responseheaders[i*2]] = this.for_request.responseheaders[i*2+1];			
		}
		return headersObj;
	}

	this.process = function () {
		this.body = this.for_request.response;
		// change state
		this.processed = true;
		return this;
	}

	this.follow = function () {
		if (!this.is_redirect) {
			throw new HTTPError("No redirect to follow.");
		} else {
			/* Adobe's HttpConnection should auto-handle redirects?
			var request = {}.merge(this.for_request); //to unextend obj method for use standalone w/ minimal imports/includes
			var from = this.for_request.url().href;
			var to = this.headers["Location"];
			request.url(to);
			// no recursion
			request.follow_redirects(false);
			if (this.redirection_type == 'get') {
				request.method("GET");
				request.content(false);
			}
			var response = request.do();
			response.redirects = this.redirects;
			response.redirects.push(from);
			return response;
			*/
		}
	}

	/** @desc The original HTTPConnection object that led to this response. */
	this.for_request = httpConnection;
	/**
	 * @desc Whether we've received a response with a redirect code.
	 * @type {Boolean}
	 */
	this.is_redirect = false;
	/**
	 * @desc If redirected, distinguishes between requests that should be re-issued
	 * with a GET request (303) and those that should be re-issued as-is (all the others).
	 * @type {String} Either ``get`` or ``repeat``.
	 */
	this.redirection_type = null;
	/**
	 * @desc An array of any redirects the request might have followed.
	 * @type String[]
	 */
	this.redirects = [];
	/** @desc The response headers. This is an object, not the raw HTTP headers. */
	this.headers;
	/** @desc The body content of the response. */
	this.body = undefined;
	/**
	 * @desc The status code of the response.
	 * @see `HTTP status code definitions <http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html>`_
	 */
	this.status = undefined;
	/** @desc How long it took to request the resource and get a response. In milliseconds. */
	this.response_time = undefined;
	/** @desc The encoding of the response we received. Usually UTF-8. */
	this.encoding = encoding; 
}

/*
 * implementation detail
 *
 * This library is simply a wrapper to Adobe Bridge/Bridgetalk's HttpConnection class,
 * that also provides a similar API to the HTTP core-package module of Extendables
 * to provide backwards compatibility. For use with Extendables when one uses an Adobe
 * app that doesn't support sockets but does have Adobe Bridge/Bridgetalk available
 * (e.g. Adobe Illustrator, Adobe Photoshop).
 */

 BridgeTalk.prototype.sendSynch = function(timeout) {
	var self = this;
	self.onResult = function(res) {
		this.result = res.body;
		this.complete = true;
	}
	self.complete = false;
	self.send();

	if (timeout) {
		for (var i = 0; i < timeout; i++) {
			BridgeTalk.pump(); // process any outstanding messages
			if (!self.complete) {
				$.sleep(1000);
			} else {
				break;
			}
		}
	}

	var res = self.result;
	self.result = self.complete = self.onResult = undefined;
	return res;
}
// for typos, provide an alias
BridgeTalk.prototype.sendSync = BridgeTalk.prototype.sendSynch;