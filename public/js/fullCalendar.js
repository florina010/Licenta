/*!
 * FullCalendar v1.6.4
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */

/*
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, requires jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 */

(function($, undefined) {


;;

var defaults = {

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	weekNumbers: false,
	weekNumberCalculation: 'iso',
	weekNumberTitle: 'W',

	// editing
	//editable: false,
	//disableDragging: false,
	//disableResizing: false,

	allDayDefault: true,
	ignoreTimezone: true,

	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',

	// time formats
	titleFormat: {
		month: 'MMMM yyyy',
		week: "MMM d[ yyyy]{ '—'[ MMM] d yyyy}",
		day: 'dddd, MMM d, yyyy'
	},
	columnFormat: {
		month: 'ddd',
		week: 'ddd M/d',
		day: 'dddd M/d'
	},
	timeFormat: { // for event elements
		'': 'h(:mm)t' // default
	},

	// locale
	isRTL: false,
	firstDay: 0,
	monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
	buttonText: {
		prev: "<span class='fc-text-arrow'>‹</span>",
		next: "<span class='fc-text-arrow'>›</span>",
		prevYear: "<span class='fc-text-arrow'>«</span>",
		nextYear: "<span class='fc-text-arrow'>»</span>",
		today: 'today',
		month: 'month',
		week: 'week',
		day: 'day'
	},

	// jquery-ui theming
	theme: false,
	buttonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e'
	},

	//selectable: false,
	unselectAuto: true,

	dropAccept: '*',

	handleWindowResize: true

};

// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	buttonText: {
		prev: "<span class='fc-text-arrow'>›</span>",
		next: "<span class='fc-text-arrow'>‹</span>",
		prevYear: "<span class='fc-text-arrow'>»</span>",
		nextYear: "<span class='fc-text-arrow'>«</span>"
	},
	buttonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w'
	}
};



;;



var fc = $.fullCalendar = { version: "1.6.4" };
var fcViews = fc.views = {};


$.fn.fullCalendar = function(options) {

	function colorEvents (){

	  $('.fc-event-title:contains("approved")').parent().addClass( "fc-event-approved" );
	  $('.fc-event-title:contains("rejected")').parent().addClass( "fc-event-rejected" );
	}

	// method calling
	if (typeof options == 'string') {
		var args = Array.prototype.slice.call(arguments, 1);
		var res;
		this.each(function() {
			var calendar = $.data(this, 'fullCalendar');
			if (calendar && $.isFunction(calendar[options])) {
				var r = calendar[options].apply(calendar, args);
				if (res === undefined) {
					res = r;
				}
				if (options == 'destroy') {
					$.removeData(this, 'fullCalendar');
				}
			}
		});
		if (res !== undefined) {
			return res;
		}
		return this;
	}

	options = options || {};

	// would like to have this logic in EventManager, but needs to happen before options are recursively extended
	var eventSources = options.eventSources || [];
	delete options.eventSources;
	if (options.events) {
		eventSources.push(options.events);
		delete options.events;
	}


	options = $.extend(true, {},
		defaults,
		(options.isRTL || options.isRTL===undefined && defaults.isRTL) ? rtlDefaults : {},
		options
	);


	this.each(function(i, _element) {
		var element = $(_element);
		var calendar = new Calendar(element, options, eventSources);
		element.data('fullCalendar', calendar); // TODO: look into memory leak implications
		calendar.render();
	});


	return this;

};


// function for adding/overriding defaults
function setDefaults(d) {
	$.extend(true, defaults, d);
}



;;


function Calendar(element, options, eventSources) {
	var t = this;


	// exports
	t.options = options;
	t.render = render;
	t.destroy = destroy;
	t.refetchEvents = refetchEvents;
	t.reportEvents = reportEvents;
	t.reportEventChange = reportEventChange;
	t.rerenderEvents = rerenderEvents;
	t.changeView = changeView;
	t.select = select;
	t.unselect = unselect;
	t.prev = prev;
	t.next = next;
	t.prevYear = prevYear;
	t.nextYear = nextYear;
	t.today = today;
	t.gotoDate = gotoDate;
	t.incrementDate = incrementDate;
	t.formatDate = function(format, date) { return formatDate(format, date, options) };
	t.formatDates = function(format, date1, date2) { return formatDates(format, date1, date2, options) };
	t.getDate = getDate;
	t.getView = getView;
	t.option = option;
	t.trigger = trigger;


	// imports
	EventManager.call(t, options, eventSources);
	var isFetchNeeded = t.isFetchNeeded,
			 fetchEvents = t.fetchEvents,


			// locals
			 _element = element[0],
			 header,
			 headerElement,
			 content,
			 tm, // for making theme classes
			 currentView,
			 elementOuterWidth,
			 suggestedViewHeight,
			 resizeUID = 0,
			 ignoreWindowResize = 0,
			 date = new Date(),
			 events = [],
			 events2=[],
			 _dragElement;



	/* Main Rendering
	-----------------------------------------------------------------------------*/


	setYMD(date, options.year, options.month, options.date);


	function render(inc) {
		if (!content) {
			initialRender();
		}
		else if (elementVisible()) {
			// mainly for the public API
			calcSize();
			_renderView(inc);
		}
	}


	function initialRender() {
		tm = options.theme ? 'ui' : 'fc';
		element.addClass('fc');
		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		else {
			element.addClass('fc-ltr');
		}
		if (options.theme) {
			element.addClass('ui-widget');
		}

		content = $("<div class='fc-content' style='position:relative'/>")
			.prependTo(element);

		header = new Header(t, options);
		headerElement = header.render();
		if (headerElement) {
			element.prepend(headerElement);
		}

		changeView(options.defaultView);

		if (options.handleWindowResize) {
			$(window).resize(windowResize);
		}

		// needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
		if (!bodyVisible()) {
			lateRender();
		}
	}


	// called when we know the calendar couldn't be rendered when it was initialized,
	// but we think it's ready now
	function lateRender() {
		setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
			if (!currentView.start && bodyVisible()) { // !currentView.start makes sure this never happens more than once
				renderView();
			}
		},0);
	}


	function destroy() {

		if (currentView) {
			trigger('viewDestroy', currentView, currentView, currentView.element);
			currentView.triggerEventDestroy();
		}

		$(window).unbind('resize', windowResize);

		header.destroy();
		content.remove();
		element.removeClass('fc fc-rtl ui-widget');
	}


	function elementVisible() {
		return element.is(':visible');
	}


	function bodyVisible() {
		return $('body').is(':visible');
	}



	/* View Rendering
	-----------------------------------------------------------------------------*/


	function changeView(newViewName) {
		if (!currentView || newViewName != currentView.name) {
			_changeView(newViewName);
		}
	}


	function _changeView(newViewName) {
		ignoreWindowResize++;

		if (currentView) {
			trigger('viewDestroy', currentView, currentView, currentView.element);
			unselect();
			currentView.triggerEventDestroy(); // trigger 'eventDestroy' for each event
			freezeContentHeight();
			currentView.element.remove();
			header.deactivateButton(currentView.name);
		}

		header.activateButton(newViewName);

		currentView = new fcViews[newViewName](
			$("<div class='fc-view fc-view-" + newViewName + "' style='position:relative'/>")
				.appendTo(content),
			t // the calendar object
		);

		renderView();
		unfreezeContentHeight();

		ignoreWindowResize--;
	}


	function renderView(inc) {
		if (
			!currentView.start || // never rendered before
			inc || date < currentView.start || date >= currentView.end // or new date range
		) {
			if (elementVisible()) {
				_renderView(inc);
			}
		}
	}


	function _renderView(inc) { // assumes elementVisible
		ignoreWindowResize++;

		if (currentView.start) { // already been rendered?
			trigger('viewDestroy', currentView, currentView, currentView.element);
			unselect();
			clearEvents();
		}

		freezeContentHeight();
		currentView.render(date, inc || 0); // the view's render method ONLY renders the skeleton, nothing else
		setSize();
		unfreezeContentHeight();
		(currentView.afterRender || noop)();

		updateTitle();
		updateTodayButton();

		trigger('viewRender', currentView, currentView, currentView.element);
		currentView.trigger('viewDisplay', _element); // deprecated

		ignoreWindowResize--;

		getAndRenderEvents();
	}



	/* Resizing
	-----------------------------------------------------------------------------*/


	function updateSize() {
		if (elementVisible()) {
			unselect();
			clearEvents();
			calcSize();
			setSize();
			renderEvents();
		}
	}


	function calcSize() { // assumes elementVisible
		if (options.contentHeight) {
			suggestedViewHeight = options.contentHeight;
		}
		else if (options.height) {
			suggestedViewHeight = options.height - (headerElement ? headerElement.height() : 0) - vsides(content);
		}
		else {
			suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
		}
	}


	function setSize() { // assumes elementVisible

		if (suggestedViewHeight === undefined) {
			calcSize(); // for first time
				// NOTE: we don't want to recalculate on every renderView because
				// it could result in oscillating heights due to scrollbars.
		}

		ignoreWindowResize++;
		currentView.setHeight(suggestedViewHeight);
		currentView.setWidth(content.width());
		ignoreWindowResize--;

		elementOuterWidth = element.outerWidth();
	}


	function windowResize() {
		if (!ignoreWindowResize) {
			if (currentView.start) { // view has already been rendered
				var uid = ++resizeUID;
				setTimeout(function() { // add a delay
					if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
						if (elementOuterWidth != (elementOuterWidth = element.outerWidth())) {
							ignoreWindowResize++; // in case the windowResize callback changes the height
							updateSize();
							currentView.trigger('windowResize', _element);
							ignoreWindowResize--;
						}
					}
				}, 200);
			}else{
				// calendar must have been initialized in a 0x0 iframe that has just been resized
				lateRender();
			}
		}
	}



	/* Event Fetching/Rendering
	-----------------------------------------------------------------------------*/
	// TODO: going forward, most of this stuff should be directly handled by the view


	function refetchEvents() { // can be called as an API method
		clearEvents();
		fetchAndRenderEvents();
	}


	function rerenderEvents(modifiedEventID) { // can be called as an API method
		clearEvents();
		renderEvents(modifiedEventID);
	}


// qwerty

	function renderEvents(modifiedEventID) { // TODO: remove modifiedEventID hack
		if (elementVisible()) {
			currentView.setEventData(events); // for View.js, TODO: unify with renderEvents
			currentView.renderEvents(events, modifiedEventID); // actually render the DOM elements
			currentView.trigger('eventAfterAllRender');
		}
	}


	function clearEvents() {
		currentView.triggerEventDestroy(); // trigger 'eventDestroy' for each event
		currentView.clearEvents(); // actually remove the DOM elements
		currentView.clearEventData(); // for View.js, TODO: unify with clearEvents
	}


	function getAndRenderEvents() {
		if (!options.lazyFetching || isFetchNeeded(currentView.visStart, currentView.visEnd)) {
			fetchAndRenderEvents();
		}
		else {
			renderEvents();
		}
	}


	function fetchAndRenderEvents() {
		fetchEvents(currentView.visStart, currentView.visEnd);
			// ... will call reportEvents
			// ... which will call renderEvents
	}


	// called when event data arrives
 //qwerty

	function reportEvents(_events) {
		events = _events;
		renderEvents();
	}


	// called when a single event's data has been changed
	function reportEventChange(eventID) {
		rerenderEvents(eventID);
	}



	/* Header Updating
	-----------------------------------------------------------------------------*/


	function updateTitle() {
		header.updateTitle(currentView.title);
	}


	function updateTodayButton() {
		var today = new Date();
		if (today >= currentView.start && today < currentView.end) {
			header.disableButton('today');
		}
		else {
			header.enableButton('today');
		}
	}



	/* Selection
	-----------------------------------------------------------------------------*/


	function select(start, end, allDay) {
		currentView.select(start, end, allDay===undefined ? true : allDay);
	}


	function unselect() { // safe to be called before renderView
		if (currentView) {
			currentView.unselect();
		}
	}



	/* Date
	-----------------------------------------------------------------------------*/


	function prev() {
		renderView(-1);
	}


	function next() {
		renderView(1);
	}


	function prevYear() {
		addYears(date, -1);
		renderView();
	}


	function nextYear() {
		addYears(date, 1);
		renderView();
	}


	function today() {
		date = new Date();
		renderView();
	}


	function gotoDate(year, month, dateOfMonth) {
		if (year instanceof Date) {
			date = cloneDate(year); // provided 1 argument, a Date
		}else{
			setYMD(date, year, month, dateOfMonth);
		}
		renderView();
	}


	function incrementDate(years, months, days) {
		if (years !== undefined) {
			addYears(date, years);
		}
		if (months !== undefined) {
			addMonths(date, months);
		}
		if (days !== undefined) {
			addDays(date, days);
		}
		renderView();
	}


	function getDate() {
		return cloneDate(date);
	}



	/* Height "Freezing"
	-----------------------------------------------------------------------------*/


	function freezeContentHeight() {
		content.css({
			width: '100%',
			height: content.height(),
			overflow: 'hidden'
		});
	}


	function unfreezeContentHeight() {
		content.css({
			width: '',
			height: '',
			overflow: ''
		});
	}



	/* Misc
	-----------------------------------------------------------------------------*/


	function getView() {
		return currentView;
	}


	function option(name, value) {
		if (value === undefined) {
			return options[name];
		}
		if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
			options[name] = value;
			updateSize();
		}
	}


	function trigger(name, thisObj) {
		if (options[name]) {
			return options[name].apply(
				thisObj || _element,
				Array.prototype.slice.call(arguments, 2)
			);
		}
	}



	/* External Dragging
	------------------------------------------------------------------------*/

	if (options.droppable) {
		$(document)
			.bind('dragstart', function(ev, ui) {
				var _e = ev.target;
				var e = $(_e);
				if (!e.parents('.fc').length) { // not already inside a calendar
					var accept = options.dropAccept;
				}
			})
			.bind('dragstop', function(ev, ui) {
				if (_dragElement) {
					currentView.dragStop(_dragElement, ev, ui);
					_dragElement = null;
				}
			});
	}


}

;;

function Header(calendar, options) {
	var t = this;


	// exports
	t.render = render;
	t.destroy = destroy;
	t.updateTitle = updateTitle;
	t.activateButton = activateButton;
	t.deactivateButton = deactivateButton;
	t.disableButton = disableButton;
	t.enableButton = enableButton;


	// locals
	var element = $([]);
	var tm;



	function render() {
		tm = options.theme ? 'ui' : 'fc';
		var sections = options.header;
		if (sections) {
			element = $("<table class='fc-header' style='width:100%'/>")
				.append(
					$("<tr/>")
						.append(renderSection('left'))
						.append(renderSection('right'))
				);
			return element;
		}
	}


	function destroy() {
		element.remove();
	}


	function renderSection(position) {

		var e = $("<td class='fc-header-" + position + "'/>");
		var buttonStr = options.header[position];
		if (buttonStr) {
			$.each(buttonStr.split(' '), function(i) {
				if (i > 0) {
					e.append("<span class='fc-header-space'/>");
				}
				var prevButton;
				$.each(this.split(','), function(j, buttonName) {
					if (buttonName == 'title') {
						e.append("<span class='fc-header-title'><h2> </h2></span>");
						if (prevButton) {
							prevButton.addClass(tm + '-corner-right');
						}
						prevButton = null;
					}else{
						var buttonClick;
						if (calendar[buttonName]) {
							buttonClick = calendar[buttonName]; // calendar method
						}
						else if (fcViews[buttonName]) {
							buttonClick = function() {
								button.removeClass(tm + '-state-hover'); // forget why
								calendar.changeView(buttonName);
							};
						}
						if (buttonClick) {
							var icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null; // why are we using smartProperty here?
							var text = smartProperty(options.buttonText, buttonName); // why are we using smartProperty here?
							var button = $(
								"<span class='fc-button fc-button-" + buttonName + " " + tm + "-state-default'>" +
									(icon ?
										"<span class='fc-icon-wrap'>" +
											"<span class='ui-icon ui-icon-" + icon + "'/>" +
										"</span>" :
										text
										) +
								"</span>"
								)
								.click(function() {

									if (!button.hasClass(tm + '-state-disabled')) {
										buttonClick();
										colorEvents();
									}
								})
								.mousedown(function() {
									button
										.not('.' + tm + '-state-active')
										.not('.' + tm + '-state-disabled')
										.addClass(tm + '-state-down');
								})
								.mouseup(function() {
									button.removeClass(tm + '-state-down');
								})
								.hover(
									function() {
										button
											.not('.' + tm + '-state-active')
											.not('.' + tm + '-state-disabled')
											.addClass(tm + '-state-hover');
									},
									function() {
										button
											.removeClass(tm + '-state-hover')
											.removeClass(tm + '-state-down');
									}
								)
								.appendTo(e);
							disableTextSelection(button);
							if (!prevButton) {
								button.addClass(tm + '-corner-left');
							}
							prevButton = button;
						}
					}
				});
				if (prevButton) {
					prevButton.addClass(tm + '-corner-right');
				}
			});
		}
		return e;
	}


	function updateTitle(html) {
		element.find('h2')
			.html(html);
	}


	function activateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-active');
	}


	function deactivateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-active');
	}


	function disableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-disabled');
	}


	function enableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-disabled');
	}


}

;;

fc.sourceNormalizers = [];
fc.sourceFetchers = [];

var ajaxDefaults = {
	dataType: 'json',
	cache: false
};

var eventGUID = 1;


function EventManager(options, _sources) {
	var t = this;


	// exports
	t.isFetchNeeded = isFetchNeeded;
	t.fetchEvents = fetchEvents;
	t.addEventSource = addEventSource;
	t.removeEventSource = removeEventSource;
	t.renderEvent = renderEvent;
	t.normalizeEvent = normalizeEvent;


	// imports
	var trigger = t.trigger;
	var getView = t.getView;
	var reportEvents = t.reportEvents;


	// locals
	var stickySource = { events: [] };
	var sources = [ stickySource ];
	var rangeStart, rangeEnd;
	var currentFetchID = 0;
	var pendingSourceCnt = 0;
	var loadingLevel = 0;
	var cache = [];


	for (var i=0; i<_sources.length; i++) {
		_addEventSource(_sources[i]);
	}



	/* Fetching
	-----------------------------------------------------------------------------*/


	function isFetchNeeded(start, end) {
		return !rangeStart || start < rangeStart || end > rangeEnd;
	}


	function fetchEvents(start, end) {
		rangeStart = start;
		rangeEnd = end;
		cache = [];
		var fetchID = ++currentFetchID;
		var len = sources.length;
		pendingSourceCnt = len;
		for (var i=0; i<len; i++) {
			fetchEventSource(sources[i], fetchID);
		}
	}

//qwerty

	function fetchEventSource(source, fetchID) {
		_fetchEventSource(source, function(events) {
			if (fetchID == currentFetchID) {
				if (events) {

					if (options.eventDataTransform) {
						events = $.map(events, options.eventDataTransform);
					}
					if (source.eventDataTransform) {
						events = $.map(events, source.eventDataTransform);
					}
					// TODO: this technique is not ideal for static array event sources.
					//  For arrays, we'll want to process all events right in the beginning, then never again.

					for (var i=0; i<events.length; i++) {
						events[i].source = source;
						normalizeEvent(events[i]);
					}
					cache = cache.concat(events);
				}
				pendingSourceCnt--;
				if (!pendingSourceCnt) {
					reportEvents(cache);
				}
			}
		});
	}

//qwerty
	function _fetchEventSource(source, callback) {
		var i;
		var fetchers = fc.sourceFetchers;
		var res;
		for (i=0; i<fetchers.length; i++) {
			res = fetchers[i](source, rangeStart, rangeEnd, callback);
			if (res === true) {
				// the fetcher is in charge. made its own async request
				return;
			}
			else if (typeof res == 'object') {
				// the fetcher returned a new source. process it
				_fetchEventSource(res, callback);
				return;
			}
		}
		var events = source.events;
		if (events) {
			if ($.isFunction(events)) {
				pushLoading();
				events(cloneDate(rangeStart), cloneDate(rangeEnd), function(events) {
					callback(events);
					popLoading();
				});
			}
			else if ($.isArray(events)) {
				callback(events);
			}
			else {
				callback();
			}
		}else{
			var url = source.url;
			if (url) {
				var success = source.success;
				var error = source.error;
				var complete = source.complete;

				// retrieve any outbound GET/POST $.ajax data from the options
				var customData;
				if ($.isFunction(source.data)) {
					// supplied as a function that returns a key/value object
					customData = source.data();
				}
				else {
					// supplied as a straight key/value object
					customData = source.data;
				}

				// use a copy of the custom data so we can modify the parameters
				// and not affect the passed-in object.
				var data = $.extend({}, customData || {});

				var startParam = firstDefined(source.startParam, options.startParam);
				var endParam = firstDefined(source.endParam, options.endParam);
				if (startParam) {
					data[startParam] = Math.round(+rangeStart / 1000);
				}
				if (endParam) {
					data[endParam] = Math.round(+rangeEnd / 1000);
				}

				pushLoading();
				$.ajax($.extend({}, ajaxDefaults, source, {
					data: data,
					success: function(events) {
						events = events || [];
						var res = applyAll(success, this, arguments);
						if ($.isArray(res)) {
							events = res;
						}
						callback(events);
					},
					error: function() {
						applyAll(error, this, arguments);
						callback();
					},
					complete: function() {
						applyAll(complete, this, arguments);
						popLoading();
					}
				}));
			}else{
				callback();
			}
		}
	}



	/* Sources
	-----------------------------------------------------------------------------*/


	function addEventSource(source) {
		source = _addEventSource(source);
		if (source) {
			pendingSourceCnt++;
			fetchEventSource(source, currentFetchID); // will eventually call reportEvents
		}
	}

//qwerty
	function _addEventSource(source) {
		if ($.isFunction(source) || $.isArray(source)) {
			source = { events: source };
		}
		else if (typeof source == 'string') {
			source = { url: source };
		}
		if (typeof source == 'object') {
			normalizeSource(source);
			sources.push(source);
			return source;
		}
	}


	function removeEventSource(source) {
		sources = $.grep(sources, function(src) {
			return !isSourcesEqual(src, source);
		});
		// remove all client events from that source
		cache = $.grep(cache, function(e) {
			return !isSourcesEqual(e.source, source);
		});
		reportEvents(cache);
	}



	/* Manipulation
	-----------------------------------------------------------------------------*/



	function renderEvent(event, stick) {
		normalizeEvent(event);
		if (!event.source) {
			if (stick) {
				stickySource.events.push(event);
				event.source = stickySource;
			}
			cache.push(event);
		}
		reportEvents(cache);
	}




	/* Loading State
	-----------------------------------------------------------------------------*/


	function pushLoading() {
		if (!loadingLevel++) {
			trigger('loading', null, true, getView());
		}
	}


	function popLoading() {
		if (!--loadingLevel) {
			trigger('loading', null, false, getView());
		}
	}



	/* Event Normalization
	-----------------------------------------------------------------------------*/

//qwerty

	function normalizeEvent(event) {
		var source = event.source || {};
		var ignoreTimezone = firstDefined(source.ignoreTimezone, options.ignoreTimezone);
		event._id = event._id || (event.id === undefined ? '_fc' + eventGUID++ : event.id + '');
		if (event.date) {
			if (!event.start) {
				event.start = event.date;
			}
			delete event.date;
		}
		event._start = cloneDate(event.start = parseDate(event.start, ignoreTimezone));
		event.end = parseDate(event.end, ignoreTimezone);
		if (event.end && event.end <= event.start) {
			event.end = null;
		}
		event._end = event.end ? cloneDate(event.end) : null;
		if (event.allDay === undefined) {
			event.allDay = firstDefined(source.allDayDefault, options.allDayDefault);
		}
		if (event.className) {
			if (typeof event.className == 'string') {
				event.className = event.className.split(/\s+/);
			}
		}else{
			event.className = [];
		}
		// TODO: if there is no start date, return false to indicate an invalid event
	}



	/* Utils
	------------------------------------------------------------------------------*/


	function normalizeSource(source) {
		if (source.className) {
			// TODO: repeat code, same code for event classNames
			if (typeof source.className == 'string') {
				source.className = source.className.split(/\s+/);
			}
		}else{
			source.className = [];
		}
		var normalizers = fc.sourceNormalizers;
		for (var i=0; i<normalizers.length; i++) {
			normalizers[i](source);
		}
	}


	function isSourcesEqual(source1, source2) {
		return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
	}


	function getSourcePrimitive(source) {
		return ((typeof source == 'object') ? (source.events || source.url) : '') || source;
	}


}

;;


fc.addDays = addDays;
fc.cloneDate = cloneDate;
fc.parseDate = parseDate;
fc.parseISO8601 = parseISO8601;
fc.parseTime = parseTime;
fc.formatDate = formatDate;
fc.formatDates = formatDates;



/* Date Math
-----------------------------------------------------------------------------*/

var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;


function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}


function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}


function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}


function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}


function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}


function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}


function cloneDate(d, dontKeepTime) {
	if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}


function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours()); // != 0
	return d;
}


function dayDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
}


function setYMD(date, y, m, d) {
	if (y !== undefined && y != date.getFullYear()) {
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(y);
	}
	if (m !== undefined && m != date.getMonth()) {
		date.setDate(1);
		date.setMonth(m);
	}
	if (d !== undefined) {
		date.setDate(d);
	}
}



/* Date Parsing
-----------------------------------------------------------------------------*/


function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+(\.\d+)?$/)) { // a UNIX timestamp
			return new Date(parseFloat(s) * 1000);
		}
		if (ignoreTimezone === undefined) {
			ignoreTimezone = true;
		}
		return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}


function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1);
	if (ignoreTimezone || !m[13]) {
		var check = new Date(m[1], 0, 1, 9, 0);
		if (m[3]) {
			date.setMonth(m[3] - 1);
			check.setMonth(m[3] - 1);
		}
		if (m[5]) {
			date.setDate(m[5]);
			check.setDate(m[5]);
		}
		fixDate(date, check);
		if (m[7]) {
			date.setHours(m[7]);
		}
		if (m[8]) {
			date.setMinutes(m[8]);
		}
		if (m[10]) {
			date.setSeconds(m[10]);
		}
		if (m[12]) {
			date.setMilliseconds(Number("0." + m[12]) * 1000);
		}
		fixDate(date, check);
	}else{
		date.setUTCFullYear(
			m[1],
			m[3] ? m[3] - 1 : 0,
			m[5] || 1
		);
		date.setUTCHours(
			m[7] || 0,
			m[8] || 0,
			m[10] || 0,
			m[12] ? Number("0." + m[12]) * 1000 : 0
		);
		if (m[14]) {
			var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
			offset *= m[15] == '-' ? 1 : -1;
			date = new Date(+date + (offset * 60 * 1000));
		}
	}
	return date;
}


function parseTime(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1], 10);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
	}
}



/* Date Formatting
-----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])


function formatDate(date, format, options) {
	return formatDates(date, null, format, options);
}


function formatDates(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''), 10)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
};


var dateFormatters = {
	s	: function(d)	{ return d.getSeconds() },
	ss	: function(d)	{ return zeroPad(d.getSeconds()) },
	m	: function(d)	{ return d.getMinutes() },
	mm	: function(d)	{ return zeroPad(d.getMinutes()) },
	h	: function(d)	{ return d.getHours() % 12 || 12 },
	hh	: function(d)	{ return zeroPad(d.getHours() % 12 || 12) },
	H	: function(d)	{ return d.getHours() },
	HH	: function(d)	{ return zeroPad(d.getHours()) },
	d	: function(d)	{ return d.getDate() },
	dd	: function(d)	{ return zeroPad(d.getDate()) },
	ddd	: function(d,o)	{ return o.dayNamesShort[d.getDay()] },
	dddd: function(d,o)	{ return o.dayNames[d.getDay()] },
	M	: function(d)	{ return d.getMonth() + 1 },
	MM	: function(d)	{ return zeroPad(d.getMonth() + 1) },
	MMM	: function(d,o)	{ return o.monthNamesShort[d.getMonth()] },
	MMMM: function(d,o)	{ return o.monthNames[d.getMonth()] },
	yy	: function(d)	{ return (d.getFullYear()+'').substring(2) },
	yyyy: function(d)	{ return d.getFullYear() },
	t	: function(d)	{ return d.getHours() < 12 ? 'a' : 'p' },
	tt	: function(d)	{ return d.getHours() < 12 ? 'am' : 'pm' },
	T	: function(d)	{ return d.getHours() < 12 ? 'A' : 'P' },
	TT	: function(d)	{ return d.getHours() < 12 ? 'AM' : 'PM' },
	u	: function(d)	{ return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'") },
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) {
			return 'th';
		}
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	},
	w   : function(d, o) { // local
		return o.weekNumberCalculation(d);
	},
	W   : function(d) { // ISO
		return iso8601Week(d);
	}
};
fc.dateFormatters = dateFormatters;


/* thanks jQuery UI (https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js)
 *
 * Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
 * `date` - the date to get the week for
 * `number` - the number of the week within the year that contains this date
 */
function iso8601Week(date) {
	var time;
	var checkDate = new Date(date.getTime());

	// Find Thursday of this week starting on Monday
	checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));

	time = checkDate.getTime();
	checkDate.setMonth(0); // Compare with Jan 1
	checkDate.setDate(1);
	return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
}


;;

fc.applyAll = applyAll;


/* Event Date Math
-----------------------------------------------------------------------------*/


function exclEndDay(event) {
	if (event.end) {
		return _exclEndDay(event.end, event.allDay);
	}else{
		return addDays(cloneDate(event.start), 1);
	}
}


function _exclEndDay(end, allDay) {
	end = cloneDate(end);
	return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
	// why don't we check for seconds/ms too?
}



/* Event Element Binding
-----------------------------------------------------------------------------*/


function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg;
		while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}
		if ((i = e._fci) !== undefined) {
			e._fci = undefined;
			seg = segs[i];
			bindHandlers(seg.event, seg.element, seg);
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});
}



/* Element Dimensions
-----------------------------------------------------------------------------*/


function setOuterWidth(element, width, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.width(Math.max(0, width - hsides(e, includeMargins)));
	}
}


function setOuterHeight(element, height, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.height(Math.max(0, height - vsides(e, includeMargins)));
	}
}


function hsides(element, includeMargins) {
	return hpadding(element) + hborders(element) + (includeMargins ? hmargins(element) : 0);
}


function hpadding(element) {
	return (parseFloat($.css(element[0], 'paddingLeft', true)) || 0) +
	       (parseFloat($.css(element[0], 'paddingRight', true)) || 0);
}


function hmargins(element) {
	return (parseFloat($.css(element[0], 'marginLeft', true)) || 0) +
	       (parseFloat($.css(element[0], 'marginRight', true)) || 0);
}


function hborders(element) {
	return (parseFloat($.css(element[0], 'borderLeftWidth', true)) || 0) +
	       (parseFloat($.css(element[0], 'borderRightWidth', true)) || 0);
}


function vsides(element, includeMargins) {
	return vpadding(element) +  vborders(element) + (includeMargins ? vmargins(element) : 0);
}


function vpadding(element) {
	return (parseFloat($.css(element[0], 'paddingTop', true)) || 0) +
	       (parseFloat($.css(element[0], 'paddingBottom', true)) || 0);
}


function vmargins(element) {
	return (parseFloat($.css(element[0], 'marginTop', true)) || 0) +
	       (parseFloat($.css(element[0], 'marginBottom', true)) || 0);
}


function vborders(element) {
	return (parseFloat($.css(element[0], 'borderTopWidth', true)) || 0) +
	       (parseFloat($.css(element[0], 'borderBottomWidth', true)) || 0);
}



/* Misc Utils
-----------------------------------------------------------------------------*/


//TODO: arraySlice
//TODO: isFunction, grep ?


function noop() { }


function dateCompare(a, b) {
	return a - b;
}


function arrayMax(a) {
	return Math.max.apply(Math, a);
}


function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}


function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj[''];
}


function htmlEscape(s) {
	return s.replace(/&/g, '&')
		.replace(/</g, '<')
		.replace(/>/g, '>')
		.replace(/'/g, '\'')
		.replace(/"/g, '"')
		.replace(/\n/g, '<br />');
}


function disableTextSelection(element) {
	element
		.attr('unselectable', 'on')
		.css('MozUserSelect', 'none')
		.bind('selectstart.ui', function() { return false; });
}


/*
function enableTextSelection(element) {
	element
		.attr('unselectable', 'off')
		.css('MozUserSelect', '')
		.unbind('selectstart.ui');
}
*/


function markFirstLast(e) {
	e.children()
		.removeClass('fc-first fc-last')
		.filter(':first-child')
			.addClass('fc-first')
		.end()
		.filter(':last-child')
			.addClass('fc-last');
}


function setDayID(cell, date) {
	cell.each(function(i, _cell) {
		_cell.className = _cell.className.replace(/^fc-\w*/, 'fc-' + dayIDs[date.getDay()]);
		// TODO: make a way that doesn't rely on order of classes
	});
}


function getSkinCss(event, opt) {
	var source = event.source || {};
	var eventColor = event.color;
	var sourceColor = source.color;
	var optionColor = opt('eventColor');
	var backgroundColor =
		event.backgroundColor ||
		eventColor ||
		source.backgroundColor ||
		sourceColor ||
		opt('eventBackgroundColor') ||
		optionColor;
	var borderColor =
		event.borderColor ||
		eventColor ||
		source.borderColor ||
		sourceColor ||
		opt('eventBorderColor') ||
		optionColor;
	var textColor =
		event.textColor ||
		source.textColor ||
		opt('eventTextColor');
	var statements = [];
	if (backgroundColor) {
		statements.push('background-color:' + backgroundColor);
	}
	if (borderColor) {
		statements.push('border-color:' + borderColor);
	}
	if (textColor) {
		statements.push('color:' + textColor);
	}
	return statements.join(';');
}


function applyAll(functions, thisObj, args) {
	if ($.isFunction(functions)) {
		functions = [ functions ];
	}
	if (functions) {
		var i;
		var ret;
		for (i=0; i<functions.length; i++) {
			ret = functions[i].apply(thisObj, args) || ret;
		}
		return ret;
	}
}


function firstDefined() {
	for (var i=0; i<arguments.length; i++) {
		if (arguments[i] !== undefined) {
			return arguments[i];
		}
	}
}


;;

fcViews.month = MonthView;

function MonthView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'month');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDate = calendar.formatDate;


	function render(date, delta) {

		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}

		var firstDay = opt('firstDay');

		var start = cloneDate(date, true);
		start.setDate(1);

		var end = addMonths(cloneDate(start), 1);

		var visStart = cloneDate(start);
		addDays(visStart, -((visStart.getDay() - firstDay + 7) % 7));
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		addDays(visEnd, (7 - visEnd.getDay() + firstDay) % 7);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();
		var rowCnt = Math.round(dayDiff(visEnd, visStart) / 7); // should be no need for Math.round

		if (opt('weekMode') == 'fixed') {
			addDays(visEnd, (6 - rowCnt) * 7); // add weeks to make up for it
			rowCnt = 6;
		}

		t.title = formatDate(start, opt('titleFormat'));

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		renderBasic(rowCnt, colCnt, true);
	}


}

;;

fcViews.basicWeek = BasicWeekView;

function BasicWeekView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'basicWeek');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDates = calendar.formatDates;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta * 7);
		}

		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);

		var visStart = cloneDate(start);
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);

		renderBasic(1, colCnt, false);
	}


}

;;

fcViews.basicDay = BasicDayView;


function BasicDayView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'basicDay');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var formatDate = calendar.formatDate;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta);
		}
		skipHiddenDays(date, delta < 0 ? -1 : 1);

		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);

		t.title = formatDate(date, opt('titleFormat'));

		t.start = t.visStart = start;
		t.end = t.visEnd = end;

		renderBasic(1, 1, false);
	}


}

;;

setDefaults({
	weekMode: 'fixed'
});


function BasicView(element, calendar, viewName) {
	var t = this;


	// exports
	t.renderBasic = renderBasic;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // for selection (kinda hacky)
	t.defaultEventEnd = defaultEventEnd;
	t.getHoverListener = function() { return hoverListener };
	t.colLeft = colLeft;
	t.colRight = colRight;
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.getIsCellAllDay = function() { return true };
	t.allDayRow = allDayRow;
	t.getRowCnt = function() { return rowCnt };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getDaySegmentContainer = function() { return daySegmentContainer };


	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	BasicEventRenderer.call(t);
	var opt = t.opt,
			 trigger = t.trigger,
			 renderOverlay = t.renderOverlay,
			 clearOverlays = t.clearOverlays,
			 daySelectionMousedown = t.daySelectionMousedown,
			 cellToDate = t.cellToDate,
			 dateToCell = t.dateToCell,
			 rangeToSegments = t.rangeToSegments,
			 formatDate = calendar.formatDate,


			// locals

			 table,
			 head,
			 headCells,
			 body,
			 bodyRows,
			 bodyCells,
			 bodyFirstCells,
			 firstRowCellInners,
			 firstRowCellContentInners,
			 daySegmentContainer,

			 viewWidth,
			 viewHeight,
			 colWidth,
			 weekNumberWidth,

			 rowCnt, colCnt,
			 showNumbers,
			 coordinateGrid,
			 hoverListener,
			 colPositions,
			 colContentPositions,

			 tm,
			 colFormat,
			 showWeekNumbers,
			 weekNumberTitle,
			 weekNumberFormat;



	/* Rendering
	------------------------------------------------------------*/


	disableTextSelection(element.addClass('fc-grid'));


	function renderBasic(_rowCnt, _colCnt, _showNumbers) {
		rowCnt = _rowCnt;
		colCnt = _colCnt;
		showNumbers = _showNumbers;
		updateOptions();

		if (!body) {
			buildEventContainer();
		}

		buildTable();
	}


	function updateOptions() {
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');

		// week # options. (TODO: bad, logic also in other views)
		showWeekNumbers = opt('weekNumbers');
		weekNumberTitle = opt('weekNumberTitle');
		if (opt('weekNumberCalculation') != 'iso') {
			weekNumberFormat = "w";
		}
		else {
			weekNumberFormat = "W";
		}
	}


	function buildEventContainer() {
		daySegmentContainer =
			$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
				.appendTo(element);
	}


	function buildTable() {
		var html = buildTableHTML();

		if (table) {
			table.remove();
		}
		table = $(html).appendTo(element);

		head = table.find('thead');
		headCells = head.find('.fc-day-header');
		body = table.find('tbody');
		bodyRows = body.find('tr');
		bodyCells = body.find('.fc-day');
		bodyFirstCells = bodyRows.find('td:first-child');

		firstRowCellInners = bodyRows.eq(0).find('.fc-day > div');
		firstRowCellContentInners = bodyRows.eq(0).find('.fc-day-content > div');

		markFirstLast(head.add(head.find('tr'))); // marks first+last tr/th's
		markFirstLast(bodyRows); // marks first+last td's
		bodyRows.eq(0).addClass('fc-first');
		bodyRows.filter(':last').addClass('fc-last');

		bodyCells.each(function(i, _cell) {
			var date = cellToDate(
				Math.floor(i / colCnt),
				i % colCnt
			);
			trigger('dayRender', t, date, $(_cell));
		});


	}



	/* HTML Building
	-----------------------------------------------------------*/


	function buildTableHTML() {
		var html =
			"<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
			buildHeadHTML() +
			buildBodyHTML() +
			"</table>";

		return html;
	}


	function buildHeadHTML() {
		var headerClass = tm + "-widget-header";
		var html = '';
		var col;
		var date;

		html += "<thead><tr>";

		if (showWeekNumbers) {
			html +=
				"<th class='fc-week-number " + headerClass + "'>" +
				htmlEscape(weekNumberTitle) +
				"</th>";
		}

		for (col=0; col<colCnt; col++) {
			date = cellToDate(0, col);
			html +=
				"<th class='fc-day-header fc-" + dayIDs[date.getDay()] + " " + headerClass + "'>" +
				htmlEscape(formatDate(date, colFormat)) +
				"</th>";
		}

		html += "</tr></thead>";

		return html;
	}


	function buildBodyHTML() {
		var contentClass = tm + "-widget-content";
		var html = '';
		var row;
		var col;
		var date;

		html += "<tbody>";

		for (row=0; row<rowCnt; row++) {

			html += "<tr class='fc-week'>";

			if (showWeekNumbers) {
				date = cellToDate(row, 0);
				html +=
					"<td class='fc-week-number " + contentClass + "'>" +
					"<div>" +
					htmlEscape(formatDate(date, weekNumberFormat)) +
					"</div>" +
					"</td>";
			}

			for (col=0; col<colCnt; col++) {
				date = cellToDate(row, col);
				html += buildCellHTML(date);
			}

			html += "</tr>";
		}

		html += "</tbody>";

		return html;
	}


	function buildCellHTML(date) {
		var contentClass = tm + "-widget-content";
		var month = t.start.getMonth();
		var today = clearTime(new Date());
		var html = '';
		var classNames = [
			'fc-day',
			'fc-' + dayIDs[date.getDay()],
			contentClass
		];

		if (date.getMonth() != month) {
			classNames.push('fc-other-month');
		}
		if (+date == +today) {
			classNames.push(
				'fc-today',
				tm + '-state-highlight'
			);
		}
		else if (date < today) {
			classNames.push('fc-past');
		}
		else {
			classNames.push('fc-future');
		}

		html +=
			"<td" +
			" class='" + classNames.join(' ') + "'" +
			" data-date='" + formatDate(date, 'yyyy-MM-dd') + "'" +
			">" +
			"<div>";

		if (showNumbers) {
			html += "<div class='fc-day-number'>" + date.getDate() + "</div>";
		}

		html +=
			"<div class='fc-day-content'>" +
			"<div style='position:relative'> </div>" +
			"</div>" +
			"</div>" +
			"</td>";

		return html;
	}



	/* Dimensions
	-----------------------------------------------------------*/


	function setHeight(height) {
		viewHeight = height;

		var bodyHeight = viewHeight - head.height();
		var rowHeight;
		var rowHeightLast;
		var cell;

		if (opt('weekMode') == 'variable') {
			rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight = Math.floor(bodyHeight / rowCnt);
			rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
		}

		bodyFirstCells.each(function(i, _cell) {
			if (i < rowCnt) {
				cell = $(_cell);
				cell.find('> div').css(
					'min-height',
					(i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
				);
			}
		});

	}


	function setWidth(width) {
		viewWidth = width;
		colPositions.clear();
		colContentPositions.clear();

		weekNumberWidth = 0;
		if (showWeekNumbers) {
			weekNumberWidth = head.find('th.fc-week-number').outerWidth();
		}

		colWidth = Math.floor((viewWidth - weekNumberWidth) / colCnt);
		setOuterWidth(headCells.slice(0, -1), colWidth);
	}



	/* Day clicking and binding
	-----------------------------------------------------------*/





	function dayClick(ev) {
		if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var date = parseISO8601($(this).data('date'));
			trigger('dayClick', this, date, true, ev);
		}
	}



	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/
	// TODO: should be consolidated with AgendaView's methods


	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive

		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}

		var segments = rangeToSegments(overlayStart, overlayEnd);

		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

		}
	}


	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}



	/* Selection
	-----------------------------------------------------------------------*/


	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}


	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}


	function clearSelection() {
		clearOverlays();
	}


	function reportDayClick(date, allDay, ev) {
		var cell = dateToCell(date);
		var _element = bodyCells[cell.row*colCnt + cell.col];
		trigger('dayClick', _element, date, allDay, ev);
	}



	/* Utilities
	--------------------------------------------------------*/


	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}




	hoverListener = new HoverListener(coordinateGrid);

	colPositions = new HorizontalPositionCache(function(col) {
		return firstRowCellInners.eq(col);
	});

	colContentPositions = new HorizontalPositionCache(function(col) {
		return firstRowCellContentInners.eq(col);
	});


	function colLeft(col) {
		return colPositions.left(col);
	}


	function colRight(col) {
		return colPositions.right(col);
	}


	function colContentLeft(col) {
		return colContentPositions.left(col);
	}


	function colContentRight(col) {
		return colContentPositions.right(col);
	}


	function allDayRow(i) {
		return bodyRows.eq(i);
	}

}

;;

//qwerty

function BasicEventRenderer() {
	var t = this;


	// exports
	t.renderEvents = renderEvents;
	t.clearEvents = clearEvents;


	// imports
	DayEventRenderer.call(t);


	function renderEvents(events, modifiedEventId) {
		t.renderDayEvents(events, modifiedEventId);
	}


	function clearEvents() {
		t.getDaySegmentContainer().empty();
	}


	// TODO: have this class (and AgendaEventRenderer) be responsible for creating the event container div

}

;;

fcViews.agendaWeek = AgendaWeekView;

function AgendaWeekView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	AgendaView.call(t, element, calendar, 'agendaWeek');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDates = calendar.formatDates;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta * 7);
		}

		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);

		var visStart = cloneDate(start);
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();

		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		renderAgenda(colCnt);
	}

}

;;

;;

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	firstHour: 6,
	slotMinutes: 30,
	defaultEventMinutes: 120,
	axisFormat: 'h(:mm)tt',
	timeFormat: {
		agenda: 'h:mm{ - h:mm}'
	},
	dragOpacity: {
		agenda: .5
	},
	minTime: 0,
	maxTime: 24,
	slotEventOverlap: true
});


// TODO: make it work in quirks mode (event corners, all-day height)
// TODO: test liquid width, especially in IE6


function AgendaView(element, calendar, viewName) {
	var t = this;


	// exports
	t.renderAgenda = renderAgenda;
	t.setWidth = setWidth;
	t.setHeight = setHeight;
	t.afterRender = afterRender;
	t.defaultEventEnd = defaultEventEnd;
	t.timePosition = timePosition;
	t.getIsCellAllDay = getIsCellAllDay;
	t.allDayRow = getAllDayRow;
	t.getCoordinateGrid = function() { return coordinateGrid }; // specifically for AgendaEventRenderer
	t.getHoverListener = function() { return hoverListener };
	t.colLeft = colLeft;
	t.colRight = colRight;
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.getDaySegmentContainer = function() { return daySegmentContainer };
	t.getSlotSegmentContainer = function() { return slotSegmentContainer };
	t.getMinMinute = function() { return minMinute };
	t.getMaxMinute = function() { return maxMinute };
	t.getSlotContainer = function() { return slotContainer };
	t.getRowCnt = function() { return 1 };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getSnapHeight = function() { return snapHeight };
	t.getSnapMinutes = function() { return snapMinutes };
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderDayOverlay = renderDayOverlay;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // selection mousedown hack


	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	AgendaEventRenderer.call(t);
	var opt = t.opt,
			trigger = t.trigger,
			renderOverlay = t.renderOverlay,
			clearOverlays = t.clearOverlays,
			reportSelection = t.reportSelection,
			unselect = t.unselect,
			daySelectionMousedown = t.daySelectionMousedown,
			slotSegHtml = t.slotSegHtml,
			cellToDate = t.cellToDate,
			dateToCell = t.dateToCell,
			rangeToSegments = t.rangeToSegments,
			formatDate = calendar.formatDate,


			// locals

			dayTable,
			dayHead,
			dayHeadCells,
			dayBody,
			dayBodyCells,
			dayBodyCellInners,
			dayBodyCellContentInners,
			dayBodyFirstCell,
			dayBodyFirstCellStretcher,
			slotLayer,
			daySegmentContainer,
			allDayTable,
			allDayRow,
			slotScroller,
			slotContainer,
			slotSegmentContainer,
			slotTable,
			selectionHelper,

			viewWidth,
			viewHeight,
			axisWidth,
			colWidth,
			gutterWidth,
			slotHeight, // TODO: what if slotHeight changes? (see issue 650)

			snapMinutes,
			snapRatio, // ratio of number of "selection" slots to normal slots. (ex: 1, 2, 4)
			snapHeight, // holds the pixel hight of a "selection" slot

		  colCnt,
			slotCnt,
			coordinateGrid,
			hoverListener,
			colPositions,
			colContentPositions,
			slotTopCache = {},

			tm,
			rtl,
			minMinute, maxMinute,
			colFormat,
			showWeekNumbers,
			weekNumberTitle,
			weekNumberFormat;



	/* Rendering
	-----------------------------------------------------------------------------*/


	disableTextSelection(element.addClass('fc-agenda'));


	function renderAgenda(c) {
		colCnt = c;
		updateOptions();

		if (!dayTable) { // first time rendering?
			buildSkeleton(); // builds day table, slot area, events containers
		}
		else {
			buildDayTable(); // rebuilds day table
		}
	}


	function updateOptions() {

		tm = opt('theme') ? 'ui' : 'fc';
		rtl = opt('isRTL')
		minMinute = parseTime(opt('minTime'));
		maxMinute = parseTime(opt('maxTime'));
		colFormat = opt('columnFormat');

		// week # options. (TODO: bad, logic also in other views)
		showWeekNumbers = opt('weekNumbers');
		weekNumberTitle = opt('weekNumberTitle');
		if (opt('weekNumberCalculation') != 'iso') {
			weekNumberFormat = "w";
		}
		else {
			weekNumberFormat = "W";
		}

		snapMinutes = opt('snapMinutes') || opt('slotMinutes');
	}



	/* Build DOM
	-----------------------------------------------------------------------*/


	function buildSkeleton() {
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var s;
		var d;
		var i;
		var maxd;
		var minutes;
		var slotNormal = opt('slotMinutes') % 15 == 0;

		buildDayTable();

		slotLayer =
			$("<div style='position:absolute;z-index:2;left:0;width:100%'/>")
				.appendTo(element);

		if (opt('allDaySlot')) {

			daySegmentContainer =
				$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
					.appendTo(slotLayer);

			s =
				"<table style='width:100%' class='fc-agenda-allday' cellspacing='0'>" +
				"<tr>" +
				"<th class='" + headerClass + " fc-agenda-axis'>" + opt('allDayText') + "</th>" +
				"<td>" +
				"<div class='fc-day-content'><div style='position:relative'/></div>" +
				"</td>" +
				"<th class='" + headerClass + " fc-agenda-gutter'> </th>" +
				"</tr>" +
				"</table>";
			allDayTable = $(s).appendTo(slotLayer);
			allDayRow = allDayTable.find('tr');




			slotLayer.append(
				"<div class='fc-agenda-divider " + headerClass + "'>" +
				"<div class='fc-agenda-divider-inner'/>" +
				"</div>"
			);

		}else{

			daySegmentContainer = $([]); // in jQuery 1.4, we can just do $()

		}

		slotScroller =
			$("<div style='position:absolute;width:100%;overflow-x:hidden;overflow-y:auto'/>")
				.appendTo(slotLayer);

		slotContainer =
			$("<div style='position:relative;width:100%;overflow:hidden'/>")
				.appendTo(slotScroller);

		slotSegmentContainer =
			$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
				.appendTo(slotContainer);

		s =
			"<table class='fc-agenda-slots' style='width:100%' cellspacing='0'>" +
			"<tbody>";
		d = zeroDate();
		maxd = addMinutes(cloneDate(d), maxMinute);
		addMinutes(d, minMinute);
		slotCnt = 0;
		for (i=0; d < maxd; i++) {
			minutes = d.getMinutes();
			s +=
				"<tr class='fc-slot" + i + ' ' + (!minutes ? '' : 'fc-minor') + "'>" +
				"<th class='fc-agenda-axis " + headerClass + "'>" +
				((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : ' ') +
				"</th>" +
				"<td class='" + contentClass + "'>" +
				"<div style='position:relative'> </div>" +
				"</td>" +
				"</tr>";
			addMinutes(d, opt('slotMinutes'));
			slotCnt++;
		}
		s +=
			"</tbody>" +
			"</table>";
		slotTable = $(s).appendTo(slotContainer);

		slotBind(slotTable.find('td'));
	}



	/* Build Day Table
	-----------------------------------------------------------------------*/


	function buildDayTable() {
		var html = buildDayTableHTML();

		if (dayTable) {
			dayTable.remove();
		}
		dayTable = $(html).appendTo(element);
		dayHead = dayTable.find('thead');
		dayHeadCells = dayHead.find('th').slice(1, -1); // exclude gutter
		dayBody = dayTable.find('tbody');
		dayBodyCells = dayBody.find('td').slice(0, -1); // exclude gutter
		dayBodyCellInners = dayBodyCells.find('> div');
		dayBodyCellContentInners = dayBodyCells.find('.fc-day-content > div');

		dayBodyFirstCell = dayBodyCells.eq(0);
		dayBodyFirstCellStretcher = dayBodyCellInners.eq(0);

		markFirstLast(dayHead.add(dayHead.find('tr')));
		markFirstLast(dayBody.add(dayBody.find('tr')));

		// TODO: now that we rebuild the cells every time, we should call dayRender
	}


	function buildDayTableHTML() {
		var html =
			"<table style='width:100%' class='fc-agenda-days fc-border-separate' cellspacing='0'>" +
			buildDayTableHeadHTML() +
			buildDayTableBodyHTML() +
			"</table>";

		return html;
	}


	function buildDayTableHeadHTML() {
		var headerClass = tm + "-widget-header";
		var date;
		var html = '';
		var weekText;
		var col;

		html +=
			"<thead>" +
			"<tr>";

		if (showWeekNumbers) {
			date = cellToDate(0, 0);
			weekText = formatDate(date, weekNumberFormat);
			if (rtl) {
				weekText += weekNumberTitle;
			}
			else {
				weekText = weekNumberTitle + weekText;
			}
			html +=
				"<th class='fc-agenda-axis fc-week-number " + headerClass + "'>" +
				htmlEscape(weekText) +
				"</th>";
		}
		else {
			html += "<th class='fc-agenda-axis " + headerClass + "'> </th>";
		}

		for (col=0; col<colCnt; col++) {
			date = cellToDate(0, col);
			html +=
				"<th class='fc-" + dayIDs[date.getDay()] + " fc-col" + col + ' ' + headerClass + "'>" +
				htmlEscape(formatDate(date, colFormat)) +
				"</th>";
		}

		html +=
			"<th class='fc-agenda-gutter " + headerClass + "'> </th>" +
			"</tr>" +
			"</thead>";

		return html;
	}


	function buildDayTableBodyHTML() {
		var headerClass = tm + "-widget-header"; // TODO: make these when updateOptions() called
		var contentClass = tm + "-widget-content";
		var date;
		var today = clearTime(new Date());
		var col;
		var cellsHTML;
		var cellHTML;
		var classNames;
		var html = '';

		html +=
			"<tbody>" +
			"<tr>" +
			"<th class='fc-agenda-axis " + headerClass + "'> </th>";

		cellsHTML = '';

		for (col=0; col<colCnt; col++) {

			date = cellToDate(0, col);

			classNames = [
				'fc-col' + col,
				'fc-' + dayIDs[date.getDay()],
				contentClass
			];
			if (+date == +today) {
				classNames.push(
					tm + '-state-highlight',
					'fc-today'
				);
			}
			else if (date < today) {
				classNames.push('fc-past');
			}
			else {
				classNames.push('fc-future');
			}

			cellHTML =
				"<td class='" + classNames.join(' ') + "'>" +
				"<div>" +
				"<div class='fc-day-content'>" +
				"<div style='position:relative'> </div>" +
				"</div>" +
				"</div>" +
				"</td>";

			cellsHTML += cellHTML;
		}

		html += cellsHTML;
		html +=
			"<td class='fc-agenda-gutter " + contentClass + "'> </td>" +
			"</tr>" +
			"</tbody>";

		return html;
	}



	/* Dimensions
	-----------------------------------------------------------------------*/


	function setHeight(height) {
		if (height === undefined) {
			height = viewHeight;
		}
		viewHeight = height;
		slotTopCache = {};

		var headHeight = dayBody.position().top;
		var allDayHeight = slotScroller.position().top; // including divider
		var bodyHeight = Math.min( // total body height, including borders
			height - headHeight,   // when scrollbars
			slotTable.height() + allDayHeight + 1 // when no scrollbars. +1 for bottom border
		);

		dayBodyFirstCellStretcher
			.height(bodyHeight - vsides(dayBodyFirstCell));

		slotLayer.css('top', headHeight);

		slotScroller.height(bodyHeight - allDayHeight - 1);

		// the stylesheet guarantees that the first row has no border.
		// this allows .height() to work well cross-browser.
		slotHeight = slotTable.find('tr:first').height() + 1; // +1 for bottom border

		snapRatio = opt('slotMinutes') / snapMinutes;
		snapHeight = slotHeight / snapRatio;
	}


	function setWidth(width) {
		viewWidth = width;
		colPositions.clear();
		colContentPositions.clear();

		var axisFirstCells = dayHead.find('th:first');
		if (allDayTable) {
			axisFirstCells = axisFirstCells.add(allDayTable.find('th:first'));
		}
		axisFirstCells = axisFirstCells.add(slotTable.find('th:first'));

		axisWidth = 0;
		setOuterWidth(
			axisFirstCells
				.width('')
				.each(function(i, _cell) {
					axisWidth = Math.max(axisWidth, $(_cell).outerWidth());
				}),
			axisWidth
		);

		var gutterCells = dayTable.find('.fc-agenda-gutter');
		if (allDayTable) {
			gutterCells = gutterCells.add(allDayTable.find('th.fc-agenda-gutter'));
		}

		var slotTableWidth = slotScroller[0].clientWidth; // needs to be done after axisWidth (for IE7)

		gutterWidth = slotScroller.width() - slotTableWidth;
		if (gutterWidth) {
			setOuterWidth(gutterCells, gutterWidth);
			gutterCells
				.show()
				.prev()
				.removeClass('fc-last');
		}else{
			gutterCells
				.hide()
				.prev()
				.addClass('fc-last');
		}

		colWidth = Math.floor((slotTableWidth - axisWidth) / colCnt);
		setOuterWidth(dayHeadCells.slice(0, -1), colWidth);
	}



	/* Scrolling
	-----------------------------------------------------------------------*/


	function resetScroll() {
		var d0 = zeroDate();
		var scrollDate = cloneDate(d0);
		scrollDate.setHours(opt('firstHour'));
		var top = timePosition(d0, scrollDate) + 1; // +1 for the border
		function scroll() {
			slotScroller.scrollTop(top);
		}
		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	}


	function afterRender() { // after the view has been freshly rendered and sized
		resetScroll();
	}



	/* Slot/Day clicking and binding
	-----------------------------------------------------------------------*/



	function slotBind(cells) {
		cells.click(slotClick)
			.mousedown(slotSelectionMousedown);
	}





	/* Semi-transparent Overlay Helpers
	-----------------------------------------------------*/
	// TODO: should be consolidated with BasicView's methods


	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive

		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}

		var segments = rangeToSegments(overlayStart, overlayEnd);

		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

		}
	}


	function renderCellOverlay(row0, col0, row1, col1) { // only for all-day?
		var rect = coordinateGrid.rect(row0, col0, row1, col1, slotLayer);
		return renderOverlay(rect, slotLayer);
	}


	function renderSlotOverlay(overlayStart, overlayEnd) {
		for (var i=0; i<colCnt; i++) {
			var dayStart = cellToDate(0, i);
			var dayEnd = addDays(cloneDate(dayStart), 1);
			var stretchStart = new Date(Math.max(dayStart, overlayStart));
			var stretchEnd = new Date(Math.min(dayEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var rect = coordinateGrid.rect(0, i, 0, i, slotContainer); // only use it for horizontal coords
				var top = timePosition(dayStart, stretchStart);
				var bottom = timePosition(dayStart, stretchEnd);
				rect.top = top;
				rect.height = bottom - top;
				slotBind(
					renderOverlay(rect, slotContainer)
				);
			}
		}
	}



	/* Coordinate Utilities
	-----------------------------------------------------------------------------*/


	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		dayHeadCells.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		if (opt('allDaySlot')) {
			e = allDayRow;
			n = e.offset().top;
			rows[0] = [n, n+e.outerHeight()];
		}
		var slotTableTop = slotContainer.offset().top;
		var slotScrollerTop = slotScroller.offset().top;
		var slotScrollerBottom = slotScrollerTop + slotScroller.outerHeight();
		function constrain(n) {
			return Math.max(slotScrollerTop, Math.min(slotScrollerBottom, n));
		}
		for (var i=0; i<slotCnt*snapRatio; i++) { // adapt slot count to increased/decreased selection slot count
			rows.push([
				constrain(slotTableTop + snapHeight*i),
				constrain(slotTableTop + snapHeight*(i+1))
			]);
		}
	});


	hoverListener = new HoverListener(coordinateGrid);

	colPositions = new HorizontalPositionCache(function(col) {
		return dayBodyCellInners.eq(col);
	});

	colContentPositions = new HorizontalPositionCache(function(col) {
		return dayBodyCellContentInners.eq(col);
	});


	function colLeft(col) {
		return colPositions.left(col);
	}


	function colContentLeft(col) {
		return colContentPositions.left(col);
	}


	function colRight(col) {
		return colPositions.right(col);
	}


	function colContentRight(col) {
		return colContentPositions.right(col);
	}


	function getIsCellAllDay(cell) {
		return opt('allDaySlot') && !cell.row;
	}


	function realCellToDate(cell) { // ugh "real" ... but blame it on our abuse of the "cell" system
		var d = cellToDate(0, cell.col);
		var slotIndex = cell.row;
		if (opt('allDaySlot')) {
			slotIndex--;
		}
		if (slotIndex >= 0) {
			addMinutes(d, minMinute + slotIndex * snapMinutes);
		}
		return d;
	}


	// get the Y coordinate of the given time on the given day (both Date objects)
	function timePosition(day, time) { // both date objects. day holds 00:00 of current day
		day = cloneDate(day, true);
		if (time < addMinutes(cloneDate(day), minMinute)) {
			return 0;
		}
		if (time >= addMinutes(cloneDate(day), maxMinute)) {
			return slotTable.height();
		}
		var slotMinutes = opt('slotMinutes'),
			minutes = time.getHours()*60 + time.getMinutes() - minMinute,
			slotI = Math.floor(minutes / slotMinutes),
			slotTop = slotTopCache[slotI];
		if (slotTop === undefined) {
			slotTop = slotTopCache[slotI] =
				slotTable.find('tr').eq(slotI).find('td div')[0].offsetTop;
				// .eq() is faster than ":eq()" selector
				// [0].offsetTop is faster than .position().top (do we really need this optimization?)
				// a better optimization would be to cache all these divs
		}
		return Math.max(0, Math.round(
			slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
		));
	}


	function getAllDayRow(index) {
		return allDayRow;
	}


	function defaultEventEnd(event) {
		var start = cloneDate(event.start);
		if (event.allDay) {
			return start;
		}
		return addMinutes(start, opt('defaultEventMinutes'));
	}



	/* Selection
	---------------------------------------------------------------------------------*/


	function defaultSelectionEnd(startDate, allDay) {
		if (allDay) {
			return cloneDate(startDate);
		}
		return addMinutes(cloneDate(startDate), opt('slotMinutes'));
	}


	function renderSelection(startDate, endDate, allDay) { // only for all-day
		if (allDay) {
			if (opt('allDaySlot')) {
				renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true);
			}
		}else{
			renderSlotSelection(startDate, endDate);
		}
	}


	function renderSlotSelection(startDate, endDate) {
		var helperOption = opt('selectHelper');
		coordinateGrid.build();
		if (helperOption) {
			var col = dateToCell(startDate).col;
			if (col >= 0 && col < colCnt) { // only works when times are on same day
				var rect = coordinateGrid.rect(0, col, 0, col, slotContainer); // only for horizontal coords
				var top = timePosition(startDate, startDate);
				var bottom = timePosition(startDate, endDate);
				if (bottom > top) { // protect against selections that are entirely before or after visible range
					rect.top = top;
					rect.height = bottom - top;
					rect.left += 2;
					rect.width -= 5;
					if ($.isFunction(helperOption)) {
						var helperRes = helperOption(startDate, endDate);
						if (helperRes) {
							rect.position = 'absolute';
							selectionHelper = $(helperRes)
								.css(rect)
								.appendTo(slotContainer);
						}
					}else{
						rect.isStart = true; // conside rect a "seg" now
						rect.isEnd = true;   //
						selectionHelper = $(slotSegHtml(
							{
								title: '',
								start: startDate,
								end: endDate,
								className: ['fc-select-helper'],
								editable: false
							},
							rect
						));
						selectionHelper.css('opacity', opt('dragOpacity'));
					}
					if (selectionHelper) {
						slotBind(selectionHelper);
						slotContainer.append(selectionHelper);
						setOuterWidth(selectionHelper, rect.width, true); // needs to be after appended
						setOuterHeight(selectionHelper, rect.height, true);
					}
				}
			}
		}else{
			renderSlotOverlay(startDate, endDate);
		}
	}


	function clearSelection() {
		clearOverlays();
		if (selectionHelper) {
			selectionHelper.remove();
			selectionHelper = null;
		}
	}


	function slotSelectionMousedown(ev) {
		if (ev.which == 1 && opt('selectable')) { // ev.which==1 means left mouse button
			unselect(ev);
			var dates;
			hoverListener.start(function(cell, origCell) {
				clearSelection();
				if (cell && cell.col == origCell.col && !getIsCellAllDay(cell)) {
					var d1 = realCellToDate(origCell);
					var d2 = realCellToDate(cell);
					dates = [
						d1,
						addMinutes(cloneDate(d1), snapMinutes), // calculate minutes depending on selection slot minutes
						d2,
						addMinutes(cloneDate(d2), snapMinutes)
					].sort(dateCompare);
					renderSlotSelection(dates[0], dates[3]);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						reportDayClick(dates[0], false, ev);
					}
					reportSelection(dates[0], dates[3], false, ev);
				}
			});
		}
	}


	function reportDayClick(date, allDay, ev) {
		trigger('dayClick', dayBodyCells[dateToCell(date).col], date, allDay, ev);
	}





}

;;

//qwerty

function AgendaEventRenderer() {
	var t = this;


	// exports
	t.renderEvents = renderEvents;
	t.clearEvents = clearEvents;
	t.slotSegHtml = slotSegHtml;


	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var eventEnd = t.eventEnd;
	var setHeight = t.setHeight;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getSlotSegmentContainer = t.getSlotSegmentContainer;
	var getHoverListener = t.getHoverListener;
	var getMaxMinute = t.getMaxMinute;
	var getMinMinute = t.getMinMinute;
	var timePosition = t.timePosition;
	var getIsCellAllDay = t.getIsCellAllDay;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var cellToDate = t.cellToDate;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var getSnapHeight = t.getSnapHeight;
	var getSnapMinutes = t.getSnapMinutes;
	var getSlotContainer = t.getSlotContainer;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var renderDayEvents = t.renderDayEvents;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;






	/* Rendering
	----------------------------------------------------------------------------*/


	function renderEvents(events, modifiedEventId) {
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}

		if (opt('allDaySlot')) {
			renderDayEvents(dayEvents, modifiedEventId);
			setHeight(); // no params means set to viewHeight
		}

		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
	}


	function clearEvents() {
		getDaySegmentContainer().empty();
		getSlotSegmentContainer().empty();
	}


	function compileSlotSegs(events) {
		var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d,
			visEventEnds = $.map(events, slotEventEnd),
			i,
			j, seg,
			colSegs,
			segs = [];

		for (i=0; i<colCnt; i++) {

			d = cellToDate(0, i);
			addMinutes(d, minMinute);

			colSegs = sliceSegs(
				events,
				visEventEnds,
				d,
				addMinutes(cloneDate(d), maxMinute-minMinute)
			);

		}

		return segs;
	}


	function sliceSegs(events, visEventEnds, start, end) {
		var segs = [],
			i, len=events.length, event,
			eventStart, eventEnd,
			segStart, segEnd,
			isStart, isEnd;
		for (i=0; i<len; i++) {
			event = events[i];
			eventStart = event.start;
			eventEnd = visEventEnds[i];
			if (eventEnd > start && eventStart < end) {
				if (eventStart < start) {
					segStart = cloneDate(start);
					isStart = false;
				}else{
					segStart = eventStart;
					isStart = true;
				}
				if (eventEnd > end) {
					segEnd = cloneDate(end);
					isEnd = false;
				}else{
					segEnd = eventEnd;
					isEnd = true;
				}
				segs.push({
					event: event,
					start: segStart,
					end: segEnd,
					isStart: isStart,
					isEnd: isEnd
				});
			}
		}
	}


	function slotEventEnd(event) {
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
		}
	}


	// renders events in the 'time slots' at the bottom
	// TODO: when we refactor this, when user returns `false` eventRender, don't have empty space
	// TODO: refactor will include using pixels to detect collisions instead of dates (handy for seg cmp)

	function renderSlotSegs(segs, modifiedEventId) {

		var i, segCnt=segs.length, seg,
			event,
			top,
			bottom,
			columnLeft,
			columnRight,
			columnWidth,
			width,
			left,
			right,
			html = '',
			eventElements,
			eventElement,
			triggerRes,
			titleElement,
			height,
			slotSegmentContainer = getSlotSegmentContainer(),
			isRTL = opt('isRTL');

		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			columnLeft = colContentLeft(seg.col);
			columnRight = colContentRight(seg.col);
			columnWidth = columnRight - columnLeft;

			// shave off space on right near scrollbars (2.5%)
			// TODO: move this to CSS somehow
			columnRight -= columnWidth * .025;
			columnWidth = columnRight - columnLeft;

			width = columnWidth * (seg.forwardCoord - seg.backwardCoord);

			if (opt('slotEventOverlap')) {
				// double the width while making sure resize handle is visible
				// (assumed to be 20px wide)
				width = Math.max(
					(width - (20/2)) * 2,
					width // narrow columns will want to make the segment smaller than
						// the natural width. don't allow it
				);
			}

			if (isRTL) {
				right = columnRight - seg.backwardCoord * columnWidth;
				left = right - width;
			}
			else {
				left = columnLeft + seg.backwardCoord * columnWidth;
				right = left + width;
			}

			// make sure horizontal coordinates are in bounds
			left = Math.max(left, columnLeft);
			right = Math.min(right, columnRight);
			width = right - left;

			seg.top = top;
			seg.left = left;
			seg.outerWidth = width;
			seg.outerHeight = bottom - top;
			html += slotSegHtml(event, seg);
		}

		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();

		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSeg(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
		}

		lazySegBind(slotSegmentContainer, segs, bindSlotSeg);

		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				seg.vsides = vsides(eventElement, true);
				seg.hsides = hsides(eventElement, true);
				titleElement = eventElement.find('.fc-event-title');
				if (titleElement.length) {
					seg.contentTop = titleElement[0].offsetTop;
				}
			}
		}

		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
				height = Math.max(0, seg.outerHeight - seg.vsides);
				eventElement[0].style.height = height + 'px';
				event = seg.event;
				if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
					// not enough room for title, put it in the time (TODO: maybe make both display:inline instead)
					eventElement.find('div.fc-event-time')
						.text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
					eventElement.find('div.fc-event-title')
						.remove();
				}
				trigger('eventAfterRender', event, event, eventElement);
			}
		}

	}


	function slotSegHtml(event, seg) {
		var html = "<";
		var url = event.url;
		var skinCss = getSkinCss(event, opt);
		var classes = ['fc-event', 'fc-event-vert'];
		if (seg.isStart) {
			classes.push('fc-event-start');
		}
		if (seg.isEnd) {
			classes.push('fc-event-end');
		}
		classes = classes.concat(event.className);
		if (event.source) {
			classes = classes.concat(event.source.className || []);
		}
		if (url) {
			html += "a href='" + htmlEscape(event.url) + "'";
		}else{
			html += "div";
		}
		html +=
			" class='" + classes.join(' ') + "'" +
			" style=" +
				"'" +
				"position:absolute;" +
				"top:" + seg.top + "px;" +
				"left:" + seg.left + "px;" +
				skinCss +
				"'" +
			">" +
			"<div class='fc-event-inner'>" +
			htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
			"</div>" +
			"<div class='fc-event-title'>" +
			htmlEscape(event.title || '') +
			"</div>" +
			"</div>" +
			"<div class='fc-event-bg'></div>";

		html +=
			"</" + (url ? "a" : "div") + ">";
		return html;
	}


	function bindSlotSeg(event, eventElement, seg) {
		var timeElement = eventElement.find('div.fc-event-time');
	}


}


;;


function View(element, calendar, viewName) {
	var t = this;


	// exports
	t.element = element;
	t.calendar = calendar;
	t.name = viewName;
	t.opt = opt;
	t.trigger = trigger;
	t.setEventData = setEventData;
	t.clearEventData = clearEventData;
	t.eventEnd = eventEnd;
	t.reportEventElement = reportEventElement;
	t.triggerEventDestroy = triggerEventDestroy;
	t.showEvents = showEvents;
	t.hideEvents = hideEvents;
	// t.title
	// t.start, t.end
	// t.visStart, t.visEnd


	// imports
	var defaultEventEnd = t.defaultEventEnd;
	var normalizeEvent = calendar.normalizeEvent; // in EventManager
	var reportEventChange = calendar.reportEventChange;


	// locals
	var eventsByID = {}; // eventID mapped to array of events (there can be multiple b/c of repeating events)
	var eventElementsByID = {}; // eventID mapped to array of jQuery elements
	var eventElementCouples = []; // array of objects, { event, element } // TODO: unify with segment system
	var options = calendar.options;



	function opt(name, viewNameOverride) {
		var v = options[name];
		if ($.isPlainObject(v)) {
			return smartProperty(v, viewNameOverride || viewName);
		}
		return v;
	}


	function trigger(name, thisObj) {
		return calendar.trigger.apply(
			calendar,
			[name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
		);
	}



	/* Event Data
	------------------------------------------------------------------------------*/

//qwerty
	function setEventData(events) { // events are already normalized at this point
		eventsByID = {};
		var i, len=events.length, event;
		for (i=0; i<len; i++) {
			event = events[i];
			if (eventsByID[event._id]) {
				eventsByID[event._id].push(event);
			}else{
				eventsByID[event._id] = [event];
			}
		}
	}


	function clearEventData() {
		eventsByID = {};
		eventElementsByID = {};
		eventElementCouples = [];
	}


	// returns a Date object for an event's end
	function eventEnd(event) {
		return event.end ? cloneDate(event.end) : defaultEventEnd(event);
	}



	/* Event Elements
	------------------------------------------------------------------------------*/


	// report when view creates an element for an event
	function reportEventElement(event, element) {
		eventElementCouples.push({ event: event, element: element });
		if (eventElementsByID[event._id]) {
			eventElementsByID[event._id].push(element);
		}else{
			eventElementsByID[event._id] = [element];
		}
	}


	function triggerEventDestroy() {
		$.each(eventElementCouples, function(i, couple) {
			t.trigger('eventDestroy', couple.event, couple.event, couple.element);
		});
	}

	function showEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'show');
	}


	function hideEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'hide');
	}


	function eachEventElement(event, exceptElement, funcName) {
		// NOTE: there may be multiple events per ID (repeating events)
		// and multiple segments per event
		var elements = eventElementsByID[event._id],
			i, len = elements.length;
		for (i=0; i<len; i++) {
			if (!exceptElement || elements[i][0] != exceptElement[0]) {
				elements[i][funcName]();
			}
		}
	}




	// ====================================================================================================
	// Utilities for day "cells"
	// ====================================================================================================
	// The "basic" views are completely made up of day cells.
	// The "agenda" views have day cells at the top "all day" slot.
	// This was the obvious common place to put these utilities, but they should be abstracted out into
	// a more meaningful class (like DayEventRenderer).
	// ====================================================================================================


	// For determining how a given "cell" translates into a "date":
	//
	// 1. Convert the "cell" (row and column) into a "cell offset" (the # of the cell, cronologically from the first).
	//    Keep in mind that column indices are inverted with isRTL. This is taken into account.
	//
	// 2. Convert the "cell offset" to a "day offset" (the # of days since the first visible day in the view).
	//
	// 3. Convert the "day offset" into a "date" (a JavaScript Date object).
	//
	// The reverse transformation happens when transforming a date into a cell.


	// exports
	t.isHiddenDay = isHiddenDay;
	t.skipHiddenDays = skipHiddenDays;
	t.getCellsPerWeek = getCellsPerWeek;
	t.dateToCell = dateToCell;
	t.dateToDayOffset = dateToDayOffset;
	t.dayOffsetToCellOffset = dayOffsetToCellOffset;
	t.cellOffsetToCell = cellOffsetToCell;
	t.cellToDate = cellToDate;
	t.cellToCellOffset = cellToCellOffset;
	t.cellOffsetToDayOffset = cellOffsetToDayOffset;
	t.dayOffsetToDate = dayOffsetToDate;
	t.rangeToSegments = rangeToSegments;


	// internals
	var hiddenDays = opt('hiddenDays') || []; // array of day-of-week indices that are hidden
	var isHiddenDayHash = []; // is the day-of-week hidden? (hash with day-of-week-index -> bool)
	var cellsPerWeek;
	var dayToCellMap = []; // hash from dayIndex -> cellIndex, for one week
	var cellToDayMap = []; // hash from cellIndex -> dayIndex, for one week
	var isRTL = opt('isRTL');


	// initialize important internal variables
	(function() {

		if (opt('weekends') === false) {
			hiddenDays.push(0, 6); // 0=sunday, 6=saturday
		}

		// Loop through a hypothetical week and determine which
		// days-of-week are hidden. Record in both hashes (one is the reverse of the other).
		for (var dayIndex=0, cellIndex=0; dayIndex<7; dayIndex++) {
			dayToCellMap[dayIndex] = cellIndex;
			isHiddenDayHash[dayIndex] = $.inArray(dayIndex, hiddenDays) != -1;
			if (!isHiddenDayHash[dayIndex]) {
				cellToDayMap[cellIndex] = dayIndex;
				cellIndex++;
			}
		}

		cellsPerWeek = cellIndex;
		if (!cellsPerWeek) {
			throw 'invalid hiddenDays'; // all days were hidden? bad.
		}

	})();


	// Is the current day hidden?
	// `day` is a day-of-week index (0-6), or a Date object
	function isHiddenDay(day) {
		if (typeof day == 'object') {
			day = day.getDay();
		}
		return isHiddenDayHash[day];
	}


	function getCellsPerWeek() {
		return cellsPerWeek;
	}


	// Keep incrementing the current day until it is no longer a hidden day.
	// If the initial value of `date` is not a hidden day, don't do anything.
	// Pass `isExclusive` as `true` if you are dealing with an end date.
	// `inc` defaults to `1` (increment one day forward each time)
	function skipHiddenDays(date, inc, isExclusive) {
		inc = inc || 1;
		while (
			isHiddenDayHash[ ( date.getDay() + (isExclusive ? inc : 0) + 7 ) % 7 ]
		) {
			addDays(date, inc);
		}
	}


	//
	// TRANSFORMATIONS: cell -> cell offset -> day offset -> date
	//

	// cell -> date (combines all transformations)
	// Possible arguments:
	// - row, col
	// - { row:#, col: # }
	function cellToDate() {
		var cellOffset = cellToCellOffset.apply(null, arguments);
		var dayOffset = cellOffsetToDayOffset(cellOffset);
		var date = dayOffsetToDate(dayOffset);
		return date;
	}

	// cell -> cell offset
	// Possible arguments:
	// - row, col
	// - { row:#, col:# }
	function cellToCellOffset(row, col) {
		var colCnt = t.getColCnt();

		// rtl variables. wish we could pre-populate these. but where?
		var dis = isRTL ? -1 : 1;
		var dit = isRTL ? colCnt - 1 : 0;

		if (typeof row == 'object') {
			col = row.col;
			row = row.row;
		}
		var cellOffset = row * colCnt + (col * dis + dit); // column, adjusted for RTL (dis & dit)

		return cellOffset;
	}

	// cell offset -> day offset
	function cellOffsetToDayOffset(cellOffset) {
		var day0 = t.visStart.getDay(); // first date's day of week
		cellOffset += dayToCellMap[day0]; // normlize cellOffset to beginning-of-week
		return Math.floor(cellOffset / cellsPerWeek) * 7 // # of days from full weeks
			+ cellToDayMap[ // # of days from partial last week
				(cellOffset % cellsPerWeek + cellsPerWeek) % cellsPerWeek // crazy math to handle negative cellOffsets
			]
			- day0; // adjustment for beginning-of-week normalization
	}

	// day offset -> date (JavaScript Date object)
	function dayOffsetToDate(dayOffset) {
		var date = cloneDate(t.visStart);
		addDays(date, dayOffset);
		return date;
	}


	//
	// TRANSFORMATIONS: date -> day offset -> cell offset -> cell
	//

	// date -> cell (combines all transformations)
	function dateToCell(date) {
		var dayOffset = dateToDayOffset(date);
		var cellOffset = dayOffsetToCellOffset(dayOffset);
		var cell = cellOffsetToCell(cellOffset);
		return cell;
	}

	// date -> day offset
	function dateToDayOffset(date) {
		return dayDiff(date, t.visStart);
	}

	// day offset -> cell offset
	function dayOffsetToCellOffset(dayOffset) {
		var day0 = t.visStart.getDay(); // first date's day of week
		dayOffset += day0; // normalize dayOffset to beginning-of-week
		return Math.floor(dayOffset / 7) * cellsPerWeek // # of cells from full weeks
			+ dayToCellMap[ // # of cells from partial last week
				(dayOffset % 7 + 7) % 7 // crazy math to handle negative dayOffsets
			]
			- dayToCellMap[day0]; // adjustment for beginning-of-week normalization
	}

	// cell offset -> cell (object with row & col keys)
	function cellOffsetToCell(cellOffset) {
		var colCnt = t.getColCnt();

		// rtl variables. wish we could pre-populate these. but where?
		var dis = isRTL ? -1 : 1;
		var dit = isRTL ? colCnt - 1 : 0;

		var row = Math.floor(cellOffset / colCnt);
		var col = ((cellOffset % colCnt + colCnt) % colCnt) * dis + dit; // column, adjusted for RTL (dis & dit)
		return {
			row: row,
			col: col
		};
	}


	//
	// Converts a date range into an array of segment objects.
	// "Segments" are horizontal stretches of time, sliced up by row.
	// A segment object has the following properties:
	// - row
	// - cols
	// - isStart
	// - isEnd
	//
	function rangeToSegments(startDate, endDate) {
		var rowCnt = t.getRowCnt();
		var colCnt = t.getColCnt();
		var segments = []; // array of segments to return

		// day offset for given date range
		var rangeDayOffsetStart = dateToDayOffset(startDate);
		var rangeDayOffsetEnd = dateToDayOffset(endDate); // exclusive

		// first and last cell offset for the given date range
		// "last" implies inclusivity
		var rangeCellOffsetFirst = dayOffsetToCellOffset(rangeDayOffsetStart);
		var rangeCellOffsetLast = dayOffsetToCellOffset(rangeDayOffsetEnd) - 1;

		// loop through all the rows in the view
		for (var row=0; row<rowCnt; row++) {

			// first and last cell offset for the row
			var rowCellOffsetFirst = row * colCnt;
			var rowCellOffsetLast = rowCellOffsetFirst + colCnt - 1;

			// get the segment's cell offsets by constraining the range's cell offsets to the bounds of the row
			var segmentCellOffsetFirst = Math.max(rangeCellOffsetFirst, rowCellOffsetFirst);
			var segmentCellOffsetLast = Math.min(rangeCellOffsetLast, rowCellOffsetLast);

			// make sure segment's offsets are valid and in view
			if (segmentCellOffsetFirst <= segmentCellOffsetLast) {

				// translate to cells
				var segmentCellFirst = cellOffsetToCell(segmentCellOffsetFirst);
				var segmentCellLast = cellOffsetToCell(segmentCellOffsetLast);

				// view might be RTL, so order by leftmost column
				var cols = [ segmentCellFirst.col, segmentCellLast.col ].sort();

				// Determine if segment's first/last cell is the beginning/end of the date range.
				// We need to compare "day offset" because "cell offsets" are often ambiguous and
				// can translate to multiple days, and an edge case reveals itself when we the
				// range's first cell is hidden (we don't want isStart to be true).
				var isStart = cellOffsetToDayOffset(segmentCellOffsetFirst) == rangeDayOffsetStart;
				var isEnd = cellOffsetToDayOffset(segmentCellOffsetLast) + 1 == rangeDayOffsetEnd; // +1 for comparing exclusively

				segments.push({
					row: row,
					leftCol: cols[0],
					rightCol: cols[1],
					isStart: isStart,
					isEnd: isEnd
				});
			}
		}

		return segments;
	}


}

;;
//qwerty
function DayEventRenderer() {
	var t = this;


	// exports
	t.renderDayEvents = renderDayEvents;


	// imports
	var opt = t.opt,
	trigger = t.trigger,
	eventEnd = t.eventEnd,
	reportEventElement = t.reportEventElement,
	showEvents = t.showEvents,
	getRowCnt = t.getRowCnt,
	getColCnt = t.getColCnt,
	getColWidth = t.getColWidth,
	allDayRow = t.allDayRow, // TODO: rename
	colLeft = t.colLeft,
	colRight = t.colRight,
	colContentLeft = t.colContentLeft,
	colContentRight = t.colContentRight,
	dateToCell = t.dateToCell,
	getDaySegmentContainer = t.getDaySegmentContainer,
	formatDates = t.calendar.formatDates,
	renderDayOverlay = t.renderDayOverlay,
	clearOverlays = t.clearOverlays,
	clearSelection = t.clearSelection,
  getHoverListener = t.getHoverListener,
	rangeToSegments = t.rangeToSegments,
	cellToDate = t.cellToDate,
	cellToCellOffset = t.cellToCellOffset,
	cellOffsetToDayOffset = t.cellOffsetToDayOffset,
	dateToDayOffset = t.dateToDayOffset,
	dayOffsetToCellOffset = t.dayOffsetToCellOffset;


	// Render `events` onto the calendar, attach mouse event handlers, and call the `eventAfterRender` callback for each.
	// Mouse event will be lazily applied, except if the event has an ID of `modifiedEventId`.
	// Can only be called when the event container is empty (because it wipes out all innerHTML).

	//qwerty
	function renderDayEvents(events, modifiedEventId) {

		// do the actual rendering. Receive the intermediate "segment" data structures.
		var segments = _renderDayEvents(
			events,
			false, // don't append event elements
			true // set the heights of the rows
		);

		// report the elements to the View, for general drag/resize utilities
		segmentElementEach(segments, function(segment, element) {
			reportEventElement(segment.event, element);
		});

		// attach mouse handlers
		attachHandlers(segments, modifiedEventId);

		// call `eventAfterRender` callback for each event
		segmentElementEach(segments, function(segment, element) {
			trigger('eventAfterRender', segment.event, segment.event, element);
		});
	}


	// Render an event on the calendar, but don't report them anywhere, and don't attach mouse handlers.
	// Append this event element to the event container, which might already be populated with events.
	// If an event's segment will have row equal to `adjustRow`, then explicitly set its top coordinate to `adjustTop`.
	// This hack is used to maintain continuity when user is manually resizing an event.
	// Returns an array of DOM elements for the event.
	function renderTempDayEvent(event, adjustRow, adjustTop) {

		// actually render the event. `true` for appending element to container.
		// Recieve the intermediate "segment" data structures.
		var segments = _renderDayEvents(
			[ event ],
			true, // append event elements
			false // don't set the heights of the rows
		);

		var elements = [];

		// Adjust certain elements' top coordinates
		segmentElementEach(segments, function(segment, element) {
			if (segment.row === adjustRow) {
				element.css('top', adjustTop);
			}
			elements.push(element[0]); // accumulate DOM nodes
		});

		return elements;
	}


	// Render events onto the calendar. Only responsible for the VISUAL aspect.
	// Not responsible for attaching handlers or calling callbacks.
	// Set `doAppend` to `true` for rendering elements without clearing the existing container.
	// Set `doRowHeights` to allow setting the height of each row, to compensate for vertical event overflow.

	// qwerty
	function _renderDayEvents(events, doAppend, doRowHeights) {


		// where the DOM nodes will eventually end up
		var finalContainer = getDaySegmentContainer();

		// the container where the initial HTML will be rendered.
		// If `doAppend`==true, uses a temporary container.
		var renderContainer = doAppend ? $("<div/>") : finalContainer;

		var segments = buildSegments(events);
		var html;
		var elements;

		// calculate the desired `left` and `width` properties on each segment object
		calculateHorizontals(segments);

		// build the HTML string. relies on `left` property
		html = buildHTML(segments);

		// render the HTML. innerHTML is considerably faster than jQuery's .html()
		renderContainer[0].innerHTML = html;

		// retrieve the individual elements
		elements = renderContainer.children();

		// if we were appending, and thus using a temporary container,
		// re-attach elements to the real container.
		if (doAppend) {
			finalContainer.append(elements);
		}

		// assigns each element to `segment.event`, after filtering them through user callbacks
		resolveElements(segments, elements);

		// Calculate the left and right padding+margin for each element.
		// We need this for setting each element's desired outer width, because of the W3C box model.
		// It's important we do this in a separate pass from acually setting the width on the DOM elements
		// because alternating reading/writing dimensions causes reflow for every iteration.
		segmentElementEach(segments, function(segment, element) {
			segment.hsides = hsides(element, true); // include margins = `true`
		});

		// Set the width of each element
		segmentElementEach(segments, function(segment, element) {
			element.width(
				Math.max(0, segment.outerWidth - segment.hsides)
			);
		});

		// Grab each element's outerHeight (setVerticals uses this).
		// To get an accurate reading, it's important to have each element's width explicitly set already.
		segmentElementEach(segments, function(segment, element) {
			segment.outerHeight = element.outerHeight(true); // include margins = `true`
		});

		// Set the top coordinate on each element (requires segment.outerHeight)
		setVerticals(segments, doRowHeights);

		return segments;
	}


	// Generate an array of "segments" for all events.
	function buildSegments(events) {
		var segments = [];
		for (var i=0; i<events.length; i++) {
			var eventSegments = buildSegmentsForEvent(events[i]);
			segments.push.apply(segments, eventSegments); // append an array to an array
		}
		return segments;
	}


	// Generate an array of segments for a single event.
	// A "segment" is the same data structure that View.rangeToSegments produces,
	// with the addition of the `event` property being set to reference the original event.
	function buildSegmentsForEvent(event) {
		var startDate = event.start;
		var endDate = exclEndDay(event);
		var segments = rangeToSegments(startDate, endDate);
		for (var i=0; i<segments.length; i++) {
			segments[i].event = event;
		}
		return segments;
	}


	// Sets the `left` and `outerWidth` property of each segment.
	// These values are the desired dimensions for the eventual DOM elements.
	function calculateHorizontals(segments) {
		var isRTL = opt('isRTL');
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

			// Determine functions used for calulating the elements left/right coordinates,
			// depending on whether the view is RTL or not.
			// NOTE:
			// colLeft/colRight returns the coordinate butting up the edge of the cell.
			// colContentLeft/colContentRight is indented a little bit from the edge.
			var leftFunc = (isRTL ? segment.isEnd : segment.isStart) ? colContentLeft : colLeft;
			var rightFunc = (isRTL ? segment.isStart : segment.isEnd) ? colContentRight : colRight;

			var left = leftFunc(segment.leftCol);
			var right = rightFunc(segment.rightCol);
			segment.left = left;
			segment.outerWidth = right - left;
		}
	}


	// Build a concatenated HTML string for an array of segments
	function buildHTML(segments) {
		var html = '';
		for (var i=0; i<segments.length; i++) {
			html += buildHTMLForSegment(segments[i]);
		}
		return html;
	}


	// Build an HTML string for a single segment.
	// Relies on the following properties:
	// - `segment.event` (from `buildSegmentsForEvent`)
	// - `segment.left` (from `calculateHorizontals`)
	function buildHTMLForSegment(segment) {
		var html = '';
		var isRTL = opt('isRTL');
		var event = segment.event;
		var url = event.url;

		// generate the list of CSS classNames
		var classNames = [ 'fc-event', 'fc-event-hori' ];
		if (segment.isStart) {
			classNames.push('fc-event-start');
		}
		if (segment.isEnd) {
			classNames.push('fc-event-end');
		}
		// use the event's configured classNames
		// guaranteed to be an array via `normalizeEvent`
		classNames = classNames.concat(event.className);
		if (event.source) {
			// use the event's source's classNames, if specified
			classNames = classNames.concat(event.source.className || []);
		}

		// generate a semicolon delimited CSS string for any of the "skin" properties
		// of the event object (`backgroundColor`, `borderColor` and such)
		var skinCss = getSkinCss(event, opt);

		if (url) {
			html += "<a href='" + htmlEscape(url) + "'";
		}else{
			html += "<div";
		}
		html +=
			" class='" + classNames.join(' ') + "'" +
			" style=" +
				"'" +
				"position:absolute;" +
				"left:" + segment.left + "px;" +
				skinCss +
				"'" +
			">" +
			"<div class='fc-event-inner'>";
		html +=
			"<span class='fc-event-title'>" +
			htmlEscape(event.title || '') +
			"</span>" +
			"</div>";
		html += "</" + (url ? "a" : "div") + ">";

		// TODO:
		// When these elements are initially rendered, they will be briefly visibile on the screen,
		// even though their widths/heights are not set.
		// SOLUTION: initially set them as visibility:hidden ?

		return html;
	}


	// Associate each segment (an object) with an element (a jQuery object),
	// by setting each `segment.element`.
	// Run each element through the `eventRender` filter, which allows developers to
	// modify an existing element, supply a new one, or cancel rendering.
	function resolveElements(segments, elements) {
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			var event = segment.event;
			var element = elements.eq(i);

			// call the trigger with the original element
			var triggerRes = trigger('eventRender', event, event, element);

			if (triggerRes === false) {
				// if `false`, remove the event from the DOM and don't assign it to `segment.event`
				element.remove();
			}
			else {
				if (triggerRes && triggerRes !== true) {
					// the trigger returned a new element, but not `true` (which means keep the existing element)

					// re-assign the important CSS dimension properties that were already assigned in `buildHTMLForSegment`
					triggerRes = $(triggerRes)
						.css({
							position: 'absolute',
							left: segment.left
						});

					element.replaceWith(triggerRes);
					element = triggerRes;
				}

				segment.element = element;
			}
		}
	}



	/* Top-coordinate Methods
	-------------------------------------------------------------------------------------------------*/


	// Sets the "top" CSS property for each element.
	// If `doRowHeights` is `true`, also sets each row's first cell to an explicit height,
	// so that if elements vertically overflow, the cell expands vertically to compensate.
	function setVerticals(segments, doRowHeights) {
		var rowContentHeights = calculateVerticals(segments); // also sets segment.top
		var rowContentElements = getRowContentElements(); // returns 1 inner div per row
		var rowContentTops = [];

		// Set each row's height by setting height of first inner div
		if (doRowHeights) {
			for (var i=0; i<rowContentElements.length; i++) {
				rowContentElements[i].height(rowContentHeights[i]);
			}
		}

		// Get each row's top, relative to the views's origin.
		// Important to do this after setting each row's height.
		for (var i=0; i<rowContentElements.length; i++) {
			rowContentTops.push(
				rowContentElements[i].position().top
			);
		}

		// Set each segment element's CSS "top" property.
		// Each segment object has a "top" property, which is relative to the row's top, but...
		segmentElementEach(segments, function(segment, element) {
			element.css(
				'top',
				rowContentTops[segment.row] + segment.top // ...now, relative to views's origin
			);
		});
	}


	// Calculate the "top" coordinate for each segment, relative to the "top" of the row.
	// Also, return an array that contains the "content" height for each row
	// (the height displaced by the vertically stacked events in the row).
	// Requires segments to have their `outerHeight` property already set.
	function calculateVerticals(segments) {
		var rowCnt = getRowCnt();
		var colCnt = getColCnt();
		var rowContentHeights = []; // content height for each row
		var segmentRows = buildSegmentRows(segments); // an array of segment arrays, one for each row

		for (var rowI=0; rowI<rowCnt; rowI++) {
			var segmentRow = segmentRows[rowI];

			// an array of running total heights for each column.
			// initialize with all zeros.
			var colHeights = [];
			for (var colI=0; colI<colCnt; colI++) {
				colHeights.push(0);
			}

			// loop through every segment
			for (var segmentI=0; segmentI<segmentRow.length; segmentI++) {
				var segment = segmentRow[segmentI];

				// find the segment's top coordinate by looking at the max height
				// of all the columns the segment will be in.
				segment.top = arrayMax(
					colHeights.slice(
						segment.leftCol,
						segment.rightCol + 1 // make exclusive for slice
					)
				);

				// adjust the columns to account for the segment's height
				for (var colI=segment.leftCol; colI<=segment.rightCol; colI++) {
					colHeights[colI] = segment.top + segment.outerHeight;
				}
			}

			// the tallest column in the row should be the "content height"
			rowContentHeights.push(arrayMax(colHeights));
		}

		return rowContentHeights;
	}


	// Build an array of segment arrays, each representing the segments that will
	// be in a row of the grid, sorted by which event should be closest to the top.
	function buildSegmentRows(segments) {
		var rowCnt = getRowCnt();
		var segmentRows = [];
		var segmentI;
		var segment;
		var rowI;

		// group segments by row
		for (segmentI=0; segmentI<segments.length; segmentI++) {
			segment = segments[segmentI];
			rowI = segment.row;
			if (segment.element) { // was rendered?
				if (segmentRows[rowI]) {
					// already other segments. append to array
					segmentRows[rowI].push(segment);
				}
				else {
					// first segment in row. create new array
					segmentRows[rowI] = [ segment ];
				}
			}
		}

		// sort each row
		for (rowI=0; rowI<rowCnt; rowI++) {
			segmentRows[rowI] = sortSegmentRow(
				segmentRows[rowI] || [] // guarantee an array, even if no segments
			);
		}

		return segmentRows;
	}


	// Sort an array of segments according to which segment should appear closest to the top
	function sortSegmentRow(segments) {
		var sortedSegments = [];

		// build the subrow array
		var subrows = buildSegmentSubrows(segments);

		// flatten it
		for (var i=0; i<subrows.length; i++) {
			sortedSegments.push.apply(sortedSegments, subrows[i]); // append an array to an array
		}

		return sortedSegments;
	}


	// Take an array of segments, which are all assumed to be in the same row,
	// and sort into subrows.
	function buildSegmentSubrows(segments) {

		// Give preference to elements with certain criteria, so they have
		// a chance to be closer to the top.
		segments.sort(compareDaySegments);

		var subrows = [];
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

			// loop through subrows, starting with the topmost, until the segment
			// doesn't collide with other segments.
			for (var j=0; j<subrows.length; j++) {
				if (!isDaySegmentCollision(segment, subrows[j])) {
					break;
				}
			}
			// `j` now holds the desired subrow index
			if (subrows[j]) {
				subrows[j].push(segment);
			}
			else {
				subrows[j] = [ segment ];
			}
		}

		return subrows;
	}


	// Return an array of jQuery objects for the placeholder content containers of each row.
	// The content containers don't actually contain anything, but their dimensions should match
	// the events that are overlaid on top.
	function getRowContentElements() {
		var i;
		var rowCnt = getRowCnt();
		var rowDivs = [];
		for (i=0; i<rowCnt; i++) {
			rowDivs[i] = allDayRow(i)
				.find('div.fc-day-content > div');
		}
		return rowDivs;
	}



	/* Mouse Handlers
	---------------------------------------------------------------------------------------------------*/
	// TODO: better documentation!


	function attachHandlers(segments, modifiedEventId) {
		var segmentContainer = getDaySegmentContainer();

		segmentElementEach(segments, function(segment, element, i) {
			var event = segment.event;
			if (event._id === modifiedEventId) {
				bindDaySeg(event, element, segment);
			}else{
				element[0]._fci = i; // for lazySegBind
			}
		});

		lazySegBind(segmentContainer, segments, bindDaySeg);
	}


	function bindDaySeg(event, eventElement, segment) {

		// attach all other handlers.
		// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
	}



}



/* Generalized Segment Utilities
-------------------------------------------------------------------------------------------------*/


function isDaySegmentCollision(segment, otherSegments) {
	for (var i=0; i<otherSegments.length; i++) {
		var otherSegment = otherSegments[i];
		if (
			otherSegment.leftCol <= segment.rightCol &&
			otherSegment.rightCol >= segment.leftCol
		) {
			return true;
		}
	}
	return false;
}


function segmentElementEach(segments, callback) { // TODO: use in AgendaView?
	for (var i=0; i<segments.length; i++) {
		var segment = segments[i];
		var element = segment.element;
		if (element) {
			callback(segment, element, i);
		}
	}
}


// A cmp function for determining which segments should appear higher up
function compareDaySegments(a, b) {
	return (b.rightCol - b.leftCol) - (a.rightCol - a.leftCol) || // put wider events first
		b.event.allDay - a.event.allDay || // if tie, put all-day events first (booleans cast to 0/1)
		a.event.start - b.event.start || // if a tie, sort by event start date
		(a.event.title || '').localeCompare(b.event.title) // if a tie, sort by event title
}


;;

//BUG: unselect needs to be triggered when events are dragged+dropped

function SelectionManager() {
	var t = this;


	// exports
	t.select = select;
	t.unselect = unselect;
	t.reportSelection = reportSelection;
	t.daySelectionMousedown = daySelectionMousedown;


	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var defaultSelectionEnd = t.defaultSelectionEnd;
	var renderSelection = t.renderSelection;
	var clearSelection = t.clearSelection;


	// locals
	var selected = false;



	// unselectAuto
	if (opt('selectable') && opt('unselectAuto')) {
		$(document).mousedown(function(ev) {
			var ignore = opt('unselectCancel');
			if (ignore) {
				if ($(ev.target).parents(ignore).length) { // could be optimized to stop after first match
					return;
				}
			}
			unselect(ev);
		});
	}


	function select(startDate, endDate, allDay) {
		unselect();
		if (!endDate) {
			endDate = defaultSelectionEnd(startDate, allDay);
		}
		renderSelection(startDate, endDate, allDay);
		reportSelection(startDate, endDate, allDay);
	}


	function unselect(ev) {
		if (selected) {
			selected = false;
			clearSelection();
			trigger('unselect', null, ev);
		}
	}


	function reportSelection(startDate, endDate, allDay, ev) {
		selected = true;
		trigger('select', null, startDate, endDate, allDay, ev);
	}


	function daySelectionMousedown(ev) { // not really a generic manager method, oh well
		var cellToDate = t.cellToDate;
		var getIsCellAllDay = t.getIsCellAllDay;
		var hoverListener = t.getHoverListener();
		var reportDayClick = t.reportDayClick; // this is hacky and sort of weird
		if (ev.which == 1 && opt('selectable')) { // which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) { // TODO: maybe put cellToDate/getIsCellAllDay info in cell
				clearSelection();
				if (cell && getIsCellAllDay(cell)) {
					dates = [ cellToDate(origCell), cellToDate(cell) ].sort(dateCompare);
					renderSelection(dates[0], dates[1], true);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						reportDayClick(dates[0], true, ev);
					}
					reportSelection(dates[0], dates[1], true, ev);
				}
			});
		}
	}


}

;;

function OverlayManager() {
	var t = this;


	// exports
	t.renderOverlay = renderOverlay;
	t.clearOverlays = clearOverlays;


	// locals
	var usedOverlays = [];
	var unusedOverlays = [];


	function renderOverlay(rect, parent) {
		var e = unusedOverlays.shift();
		if (!e) {
			e = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3'/>");
		}
		if (e[0].parentNode != parent[0]) {
			e.appendTo(parent);
		}
		usedOverlays.push(e.css(rect).show());
		return e;
	}


	function clearOverlays() {
		var e;
		while (e = usedOverlays.shift()) {
			unusedOverlays.push(e.hide().unbind());
		}
	}


}

;;

function CoordinateGrid(buildFunc) {

	var t = this;
	var rows;
	var cols;


	t.build = function() {
		rows = [];
		cols = [];
		buildFunc(rows, cols);
	};


	t.cell = function(x, y) {
		var rowCnt = rows.length;
		var colCnt = cols.length;
		var i, r=-1, c=-1;
		for (i=0; i<rowCnt; i++) {
			if (y >= rows[i][0] && y < rows[i][1]) {
				r = i;
				break;
			}
		}
		for (i=0; i<colCnt; i++) {
			if (x >= cols[i][0] && x < cols[i][1]) {
				c = i;
				break;
			}
		}
		return (r>=0 && c>=0) ? { row:r, col:c } : null;
	};


	t.rect = function(row0, col0, row1, col1, originElement) { // row1,col1 is inclusive
		var origin = originElement.offset();
		return {
			top: rows[row0][0] - origin.top,
			left: cols[col0][0] - origin.left,
			width: cols[col1][1] - cols[col0][0],
			height: rows[row1][1] - rows[row0][0]
		};
	};

}

;;

function HoverListener(coordinateGrid) {


	var t = this;
	var bindType;
	var change;
	var firstCell;
	var cell;


	t.start = function(_change, ev, _bindType) {
		change = _change;
		firstCell = cell = null;
		coordinateGrid.build();
		mouse(ev);
		bindType = _bindType || 'mousemove';
		$(document).bind(bindType, mouse);
	};


	function mouse(ev) {
		_fixUIEvent(ev); // see below
		var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
		if (!newCell != !cell || newCell && (newCell.row != cell.row || newCell.col != cell.col)) {
			if (newCell) {
				if (!firstCell) {
					firstCell = newCell;
				}
				change(newCell, firstCell, newCell.row-firstCell.row, newCell.col-firstCell.col);
			}else{
				change(newCell, firstCell);
			}
			cell = newCell;
		}
	}


	t.stop = function() {
		$(document).unbind(bindType, mouse);
		return cell;
	};


}



// this fix was only necessary for jQuery UI 1.8.16 (and jQuery 1.7 or 1.7.1)
// upgrading to jQuery UI 1.8.17 (and using either jQuery 1.7 or 1.7.1) fixed the problem
// but keep this in here for 1.8.16 users
// and maybe remove it down the line

function _fixUIEvent(event) { // for issue 1168
	if (event.pageX === undefined) {
		event.pageX = event.originalEvent.pageX;
		event.pageY = event.originalEvent.pageY;
	}
}
;;

function HorizontalPositionCache(getElement) {

	var t = this,
		elements = {},
		lefts = {},
		rights = {};

	function e(i) {
		return elements[i] = elements[i] || getElement(i);
	}

	t.left = function(i) {
		return lefts[i] = lefts[i] === undefined ? e(i).position().left : lefts[i];
	};

	t.right = function(i) {
		return rights[i] = rights[i] === undefined ? t.left(i) + e(i).width() : rights[i];
	};

	t.clear = function() {
		elements = {};
		lefts = {};
		rights = {};
	};

}

;;

})(jQuery);