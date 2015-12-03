(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/joe/dev/keyboard/main.js":[function(require,module,exports){
'use strict';

var _index = require('./src/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Instantiate
var midi = new _index2.default();

// Example usage
// Import FriendlyMIDI
midi.on('ready', function () {});
midi.on('midimessage', function (data) {});
midi.on('noteOn', function (data) {
  console.log('noteOn', data);
});
midi.on('noteOff', function (data) {
  console.log('noteOff', data);
});
midi.on('modulation', function (value) {
  console.log('modulation', value);
});
midi.on('pitchBend', function (value) {
  console.log('pitchBend', value);
});

var context = new AudioContext();

var playingNotes = new Map();

// Tremolo stuff
var tremolo = context.createGain();
var lfo = context.createOscillator();
lfo.frequency.value = 7;
lfo.connect(tremolo.gain);
lfo.start();
var dry = context.createGain();
dry.connect(context.destination);
var wet = context.createGain();
wet.connect(context.destination);
tremolo.connect(wet);
wet.gain.value = 0;

midi.on('noteOn', function (data) {
  var osc = context.createOscillator();
  osc.frequency.value = data.frequency;
  osc.type = 'sawtooth';
  var gain = context.createGain();
  playingNotes.set(data.note, {
    osc: osc,
    rootFrequency: data.frequency
  });
  osc.start();
  osc.connect(gain);
  gain.gain.value = data.velocity / 128;
  gain.connect(tremolo);
  gain.connect(dry);
});

midi.on('noteOff', function (data) {
  var playingNote = playingNotes.get(data.note);
  if (!playingNote) {
    return;
  }
  playingNote.osc.stop();
  playingNotes.delete(data.note);
});

midi.on('pitchBend', function (value) {
  playingNotes.forEach(function (note) {
    var frequency = note.rootFrequency;
    var shift = 2 * (value / 128);
    if (shift < 1) {
      shift = 0.5 + shift / 2;
    }
    var targetFrequency = frequency * shift;
    note.osc.frequency.setValueAtTime(targetFrequency, context.currentTime);
  });
});

midi.on('modulation', function (value) {
  dry.gain.value = (128 - value) / 128;
  wet.gain.value = value / 128;
});

},{"./src/index":"/Users/joe/dev/keyboard/src/index.js"}],"/Users/joe/dev/keyboard/node_modules/midiutils/src/MIDIUtils.js":[function(require,module,exports){
(function() {

	var noteMap = {};
	var noteNumberMap = [];
	var notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];


	for(var i = 0; i < 127; i++) {

		var index = i,
			key = notes[index % 12],
			octave = ((index / 12) | 0) - 1; // MIDI scale starts at octave = -1

		if(key.length === 1) {
			key = key + '-';
		}

		key += octave;

		noteMap[key] = i;
		noteNumberMap[i] = key;

	}


	function getBaseLog(value, base) {
		return Math.log(value) / Math.log(base);
	}


	var MIDIUtils = {

		noteNameToNoteNumber: function(name) {
			return noteMap[name];
		},

		noteNumberToFrequency: function(note) {
			return 440.0 * Math.pow(2, (note - 69.0) / 12.0);
		},

		noteNumberToName: function(note) {
			return noteNumberMap[note];
		},

		frequencyToNoteNumber: function(f) {
			return Math.round(12.0 * getBaseLog(f / 440.0, 2) + 69);
		}

	};


	// Make it compatible for require.js/AMD loader(s)
	if(typeof define === 'function' && define.amd) {
		define(function() { return MIDIUtils; });
	} else if(typeof module !== 'undefined' && module.exports) {
		// And for npm/node.js
		module.exports = MIDIUtils;
	} else {
		this.MIDIUtils = MIDIUtils;
	}


}).call(this);


},{}],"/Users/joe/dev/keyboard/src/index.js":[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _midiutils = require('midiutils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FriendlyMIDI = (function (_EventEmitter) {
  _inherits(FriendlyMIDI, _EventEmitter);

  function FriendlyMIDI() {
    _classCallCheck(this, FriendlyMIDI);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FriendlyMIDI).call(this));

    navigator.requestMIDIAccess().then(function (access) {
      _this.access = access;
      access.onstatechange = _this.handleAccessStateChange.bind(_this);
      _this.applyListenersToMIDIInputs();
      _this.emit('ready');
    }, function (error) {
      _this.emit('error', error);
    });
    return _this;
  }

  _createClass(FriendlyMIDI, [{
    key: 'midiMessageHandler',
    value: function midiMessageHandler(event) {
      this.emit(event.type, event.data, event);
      var data = event.data;
      var status = data[0];

      if (this.statusIsNoteOn(status)) {
        this.emit('noteOn', {
          note: (0, _midiutils.noteNumberToName)(data[1]),
          frequency: (0, _midiutils.noteNumberToFrequency)(data[1]),
          noteNumber: data[1],
          velocity: data[2]
        });
      } else if (this.statusIsNoteOff(status)) {
        this.emit('noteOff', {
          note: (0, _midiutils.noteNumberToName)(data[1]),
          frequency: (0, _midiutils.noteNumberToFrequency)(data[1]),
          noteNumber: data[1],
          velocity: data[2]
        });
      } else if (this.statusIsPitchBend(status)) {
        this.emit('pitchBend', data[2]);
      } else if (this.statusIsControlChange(status)) {
        if (this.controlChangeIsModulation(data[1])) {
          this.emit('modulation', data[2]);
        }
      }
    }
  }, {
    key: 'statusIsNoteOn',
    value: function statusIsNoteOn(status) {
      return status >= 144 && status <= 159;
    }
  }, {
    key: 'statusIsNoteOff',
    value: function statusIsNoteOff(status) {
      return status >= 128 && status <= 143;
    }
  }, {
    key: 'statusIsPitchBend',
    value: function statusIsPitchBend(status) {
      return status >= 224 && status <= 239;
    }
  }, {
    key: 'statusIsControlChange',
    value: function statusIsControlChange(status) {
      return status >= 176 && status <= 191;
    }
  }, {
    key: 'controlChangeIsModulation',
    value: function controlChangeIsModulation(value) {
      return value === 1;
    }
  }, {
    key: 'applyListenersToMIDIInputs',
    value: function applyListenersToMIDIInputs() {
      this.access.inputs.forEach(this.applyListenerToMIDIInput.bind(this));
    }
  }, {
    key: 'applyListenerToMIDIInput',
    value: function applyListenerToMIDIInput(input) {
      input.onmidimessage = this.midiMessageHandler.bind(this);
    }
  }, {
    key: 'handleAccessStateChange',
    value: function handleAccessStateChange(e) {
      this.emit('statechange', e);
      this.applyListenersToMIDIInputs(this.access);
    }
  }]);

  return FriendlyMIDI;
})(_events.EventEmitter);

exports.default = FriendlyMIDI;

},{"events":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js","midiutils":"/Users/joe/dev/keyboard/node_modules/midiutils/src/MIDIUtils.js"}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},["/Users/joe/dev/keyboard/main.js"]);
