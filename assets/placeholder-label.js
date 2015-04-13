/* Sets a form's labels as placeholders for fields.
form = required
fields = optional. Pass in an array, string or an empty array/string
placeholderClass = optional. Pass in a string. */

(function(){
	
	// check for native placeholder support
	var nativePlaceholderSupport = 'placeholder' in (document.createElement('input'));
	
	var defaults = {
		$form: undefined,
		$wrapperElement: $('div'),

		// internal classNames
		labelClassHook: 'pl_label',
		wrapperClassHook: 'pl_wrap',

		// optional user-defined classNames
		labelClassName: '',
		wrapperClassName: '',
		
		// behavior
		handleSelect: true,
		overrideNative: false,
		wrapInputs: false,
		addClass: true,
		
		fields: $('input, textarea').not('[type="checkbox"]').not('[type="radio"]'),

		// callbacks
		onFocus: false,
		onBlur: false,
		onChange: false
	};

	//----------- CONSTRUCTOR -----------//
	
	this.PlaceholderLabel = function(userOptions) {
	
		var self = this;
		
		self.options = $.extend({}, defaults, userOptions);

		//----------- PRIVATE / UTILITY METHODS -----------//
		
		function _findField(field) {
			var found = self.options.$form.find(field);
			return found.length ? found : false;
		}
		
		// Show or hide the label
		function _toggleLabelVisibility(field, hide) {
			if ( _getLabel(field) === false ) {return false;}
			
			if (hide) {
				_getLabel(field).hide();
			} else {
				_getLabel(field).show();
			}
		}
		
		// Add placeholder class to labels. Provides style hook.
		function _initializeLabels(field) {
			self.options.fields.each(function(){
				_togglePlaceholderClass(_getLabel(this), true);
			});
		}
		
		// Add/remove the "placeholder" label
		function _togglePlaceholderClass(field, addClass) {
			if (addClass) {
				$(field).addClass(self.options.labelClassHook);
			}
			else {
				$(field).removeClass(self.options.labelClassHook);
			}
		}
		
		function _initializeSelectField(field) {
			if ( _getTag(field) !== 'select' || !_getLabel(field) ) {return false;}		// If field is not a select tag or no label text, bomb out
			
			var label = _getLabel(field);
			var firstOption = $(field).children('option:first-child');
			
			// Insert label's innerHTML as first option
			if ( _hasValue(firstOption) ) {		
				$(field).prepend('<option value="">' + label.text() + '</option>').attr("selectedIndex", 0);	 //To do: select this first option.
			} else {
				firstOption.text( label.text() ); 
			}
			
			return true;
		}		
		
		function _handleSelectField(field, event) {
			if ( _getTag(field) !== 'select' ) {return false;}
			
			if (typeof event === 'undefined') {
				event = '';
				event.type = 'load';
			}
			
			var isPlaceholding = false; 	// Set default to remove placeholding class 
			
			if (event.type === 'focusin') {	// For focus, always remove placeholder class
				isPlaceholding = false;
			} else { 						// For other events, add/remove placeholder class depending on selection
				if (!_hasValue(field) && $(field).prop('selectedIndex') === 0) {	// Check if selected option is the first option
					isPlaceholding = true;
				}
			}
			_togglePlaceholderClass( field, isPlaceholding );
			
			return true;
		}
		
		function _handleAllFields(field, event){
			if (typeof event === 'undefined') {
				event = '';
				event.type = 'load';
			}
			
			if (_getTag(field) === 'select') {
				_handleSelectField(field, event);	
			}
			else {
				if (event.type === 'focus') {
					_toggleLabelVisibility(field, true);				//	on focus, hide label		
				} else {
					_toggleLabelVisibility(field, _hasValue(field));	// on change and blur, set label state based on value
				}
			}
		}
	
		//----------- Constructor logic -----------//
		
		// Return false if native placeholder support is detected and user has not chosen to override that native support
		if (nativePlaceholderSupport && !self.options.overrideNative) { return false; }
		
		// Find the form
		if (typeof self.options.element === 'string') {		// Dereference an ID
			self.options.$form = $( document.getElementById(self.options.element) );
		} else {
			self.options.$form = $(self.options.element);
		}

		// If we cannot find the form, return false
		if ( !_isJqueryElement(self.options.$form) ) {
			return false;
		}
		
		// Enable or disable support for select menus
		if (self.options.handleSelect) {
			self.options.fields = self.options.fields.add('select');
		}
		
		// Prepare each field:
		// Remove native HTML5 placeholder attr, wrap label/field in a span, add event handlers
		self.options.$form.find(self.options.fields).each(function() {
			
			// Remove HTML5 placeholder attr to prevent conflict
			$(this).removeAttr('placeholder');
			
			// Wrap label/field pairs in a span for styling
			if (self.options.wrapInputs) {
				$(this).add( _getLabel(this) ).wrapAll('<div class="' + self.options.wrapperClassHook + self.options.wrapperClassName + '"></div>');
			} else {
				$(this).closest(self.options.wrapperElement).addClass(self.options.wrapperClassHook + self.options.wrapperClassName);
			}
			
			var boundEvents = '';
			
			// Tag-specific settings
			if (self.options.handleSelect && _getTag(this) === 'select') {
				boundEvents = 'focusin blur'; // Use focusin to fix IE bug on selects with focus eventhandler (where selects require two clicks to open the dropdown).
				
				_toggleLabelVisibility(this, true);		// Hide label 
				_initializeSelectField(this);	// Insert label's innerHTML into first option
			} else {
				boundEvents = 'focus blur';
			}
			
			// Handle fields on page load
			_togglePlaceholderClass( _getLabel(this), true );	// Add placeholder class to labels
			_handleAllFields(this);								// Set initial placeholder state for all fields
			
			// Attach eventhandlers to fields
			$(this).bind(boundEvents, function(e) {
				_handleAllFields(this, e);
			});
		});
	}
	
	//----------- HELPERS -----------//
	
	function _getTag(field) {
		return $(field).prop('tagName').toLowerCase();
	}

	function _getLabel(field, context) {
		var field = $(field),
			label;
		
		if (context) {
			label = $(context).find('label').length ? $(context).find('label') : false;
		} else {
			label = field.prev('label').length ? field.prev('label') : field.next('label').length ? field.next('label') : false;
		}

		return label;
	}
	
	function _hasValue(field) {
		return $(field).val() === '' ? false : true;
	}

	//----------- UTIL -----------//
	
	function _isWindow(object) {
		return object && typeof object === "object" && "setInterval" in object;
	}
	
	function _isArray(object) {
		return _getDataType(object) === 'array';
	}
	
	function _isDOMElement(object) {
		return object && (_getDataType(object) === 'object') && (object.nodeType || _isWindow(object));
	}
	
	function _isJqueryElement(object) {
		return jQuery && object instanceof jQuery && object.length;
	}
	
	function _getDataType(object) {
		var parameterType = typeof object;
       
        if (parameterType !== 'object') {
            return parameterType;
        } else {
			if (object instanceof Date) {
				return 'date';
			} else if (object instanceof Array) {
				return 'array';
			} else if (object instanceof RegExp) {
				return 'regexp';
			} else {
				return 'object';
			}
	    }
	}

	
}());
