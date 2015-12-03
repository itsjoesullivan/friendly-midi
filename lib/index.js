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