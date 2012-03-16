if (typeof d3.chart != "object") d3.chart = {};

d3.chart.factory = function () {
	var factory = {},
	p = 0,
	data = [],
	queue = [],
	start = true,
	datef = d3.time.format("%Y-%m-%d %X"),
	short = d3.time.format("%Y-%m-%d"),
	s,e,
	rangeStart,
	rangeEnd,
	request,
	selector,
	w,h,d,m;

	factory.source = function(s) {
		request_fullurl = request_url+"&type="+s;

		return factory;
	};

	factory.range = function(start,end){
		s = datef.parse(start);
		e = datef.parse(end);

		if ( !rangeStart ) {
			rangeStart = s;
			rangeEnd = e;
		}

		return factory;
	};

	factory.canvas = function(width, height, margin) {
		w = width;
		h = height;
		m = margin;

		return factory;
	};

	factory.target = function(sel) {
		selector = sel;

		p++;

		return factory;
	};

	factory.create = function(t) {
		queue.push({start:s,end:e,width:w,height:h,margin:m,target:selector,pos:p,type:t});

		if ( start ) {
			start = false;

			factory.triggerqueue();
		}

		return factory;
	};

	factory.triggerqueue = function() {
		if ( queue.length ) {
			factory.getData(queue.shift());
		} else {
			start = true;
		}
	};

	factory.getData = function(request) {
		if ( data.length < 1 ) {
			factory.requestData(function(json) { factory.acquireData(json, request); }, request.start, request.end);
		} else if ( ( request.start >= rangeStart ) && ( request.end <= rangeEnd ) ) {
			factory.doCallback(request);
		} else if ( request.start < rangeStart ) {
			if ( ( request.end > rangeEnd ) ) {

				factory.requestData(
						function(json) {
							jsonx = json;
							factory.requestData(
									function(json) {
										factory.acquireData(json.concat(jsonx), request);
									}, rangeEnd, request.end
							);
						}, request.start, rangeStart
				);
	
			} else { 
				factory.requestData(function(json) { factory.acquireData(json, request); }, request.start, rangeStart);
			}
		} else if ( request.end > rangeEnd ) {
			factory.requestData(function(json) { factory.acquireData(json, request); }, rangeEnd, request.end);
		}
	};

	factory.requestData = function(callback, start, end) {
		factory.json(request_fullurl+"&start="+encodeURI(datef(start))+"&end="+encodeURI(datef(end)), callback);
	};

	factory.json = function(url, callback) {
		var req = new XMLHttpRequest;

		if (arguments.length < 2) callback = "application/json";
		else if ("application/json" && req.overrideMimeType) req.overrideMimeType("application/json");

		req.open("GET", url, true);
		req.onreadystatechange = function() {
			if (req.readyState === 4) {
				factory.dequeue((req.status < 300 ? JSON.parse(req.responseText) : null), callback)
			}
		};

		req.send(null);
	};

	factory.acquireData = function(json, request) {
		for (i=0; i<json.length; i++) {
			if ( typeof json[i] != 'undefined' ) {
				json[i].date = short.parse(json[i].date);
				data.push(json[i]);
			}
		}

		if ( request.start < rangeStart ) {
			rangeStart = request.start;
		}

		if ( request.end > rangeEnd ) {
			rangeEnd = request.end;
		}

		factory.doCallback(request);
	};

	factory.mergeData = function(json, callback) {
		for (i=0; i<json.length; i++) {
			if ( typeof json[i] != 'undefined' ) {
				json[i].date = short.parse(json[i].date);
				data.push(json[i]);
			}
		}

		callback;
	};

	factory.doCallback = function(request) {
		var selection = data.filter( function(x){ return (x.date >= request.start) && (x.date <= request.end); });

		var chart = d3.chart[request.type]()
			.parent(request.target, request.pos)
			.margin([request.margin, request.margin, request.margin, request.margin])
			.size([request.width, request.height])
			.data(selection);

		factory.triggerqueue();
	};

	factory.dequeue = function(data, callback) {
		callback(data);
	};

	return factory;
}
