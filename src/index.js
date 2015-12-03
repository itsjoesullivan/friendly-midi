import { EventEmitter } from 'events';
import { noteNumberToFrequency, noteNumberToName } from 'midiutils';

class FriendlyMIDI extends EventEmitter {
  constructor() {
    super();

    navigator.requestMIDIAccess().then(access => {
      this.access = access;
      access.onstatechange = this.handleAccessStateChange.bind(this);
      this.applyListenersToMIDIInputs();
      this.emit('ready');
    }, error => {
      this.emit('error', error);
    });
  }
  midiMessageHandler(event) {
    this.emit(event.type, event.data, event);
    var data = event.data;
    var status = data[0];

    if (this.statusIsNoteOn(status)) {
      this.emit('noteOn', {
        note: noteNumberToName(data[1]),
        frequency: noteNumberToFrequency(data[1]),
        noteNumber: data[1],
        velocity: data[2]
      });
    } else if (this.statusIsNoteOff(status)) {
      this.emit('noteOff', {
        note: noteNumberToName(data[1]),
        frequency: noteNumberToFrequency(data[1]),
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
  statusIsNoteOn(status) {
    return status >= 144 && status <= 159;
  }
  statusIsNoteOff(status) {
    return status >= 128 && status <= 143;
  }
  statusIsPitchBend(status) {
    return status >= 224 && status <= 239;
  }
  statusIsControlChange(status) {
    return status >= 176 && status <= 191;
  }
  controlChangeIsModulation(value) {
    return value === 1;
  }
  applyListenersToMIDIInputs() {
    this.access.inputs.forEach(this.applyListenerToMIDIInput.bind(this));
  }
  applyListenerToMIDIInput(input) {
    input.onmidimessage = this.midiMessageHandler.bind(this);
  }
  handleAccessStateChange(e) {
    this.emit('statechange', e);
    this.applyListenersToMIDIInputs(this.access);
  }
}
export default FriendlyMIDI;
