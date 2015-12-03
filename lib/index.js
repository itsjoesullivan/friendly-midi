module.exports = function () {};

navigator.requestMIDIAccess().then(function (access) {
  access.onstatechange = function (e) {
    applyListenersToMIDIInputs(access);
  };
  applyListenersToMIDIInputs(access);
}, function (err) {
  throw err;
});

function applyListenersToMIDIInputs(access) {
  var inputs = access.inputs.values();
  access.inputs.forEach(function (input) {
    input.onmidimessage = handleMIDIMessage;
  });
}

function handleMIDIMessage(event) {
  console.log('handleMIDIMessage', event);
}