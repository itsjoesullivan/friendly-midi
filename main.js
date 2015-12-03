// Import FriendlyMIDI
import FriendlyMIDI from './src/index';

// Instantiate
var midi = new FriendlyMIDI();

// Example usage
midi.on('ready', function() {
});
midi.on('midimessage', function(data) {
});
midi.on('noteOn', function(data) {
  console.log('noteOn', data);
});
midi.on('noteOff', function(data) {
  console.log('noteOff', data);
});
midi.on('modulation', function(value) {
  console.log('modulation', value);
});
midi.on('pitchBend', function(value) {
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

midi.on('noteOn', function(data) {
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

midi.on('noteOff', function(data) {
  var playingNote = playingNotes.get(data.note);
  if (!playingNote) {
    return;
  }
  playingNote.osc.stop();
  playingNotes.delete(data.note);
});

midi.on('pitchBend', function(value) {
  playingNotes.forEach(function(note) {
    var frequency = note.rootFrequency;
    var shift = 2 * (value / 128);
    if (shift < 1) {
      shift = 0.5 + shift / 2;
    }
    var targetFrequency = frequency * shift;
    note.osc.frequency
      .setValueAtTime(targetFrequency, context.currentTime);
  });
});

midi.on('modulation', function(value) {
  dry.gain.value = (128 - value) / 128;
  wet.gain.value = value / 128;
});
