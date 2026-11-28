# Sound-novel player shell

Ports render their native pixel canvas and import these small controls. `start-choice.js` chooses new/continue without a gesture gate, `touch-choices.js` maps pointer coordinates directly to native choice rows, and `report-button.js` reads the port's `globalThis.soundnovelReport` context. The shell never owns game text or assets.
