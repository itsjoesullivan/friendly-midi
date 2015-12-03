## Friendly-MIDI

Simple wrapper around current web midi implementation.

## Usage

`npm install --save friendly-midi`

```javascript
var FriendlyMIDI = require('friendly-midi');

var midi = FriendlyMIDI();

midi.on('noteOn', function(data) {
});

midi.on('noteOff', function(data) {
});

midi.on('pitchBend', function(value) {
});

midi.on('modulation', function(value) {
});
```
