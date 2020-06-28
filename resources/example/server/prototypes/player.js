import * as alt from 'alt';

/**
 * This is how you properly extend player functionality within the resource.
 * Prototyping is super simple but super useful.
 */

alt.Player.prototype.send = function send(msg) {
    alt.emitClient(this, 'chat:Send', msg);
};

alt.Player.prototype.emit = function emit(emitRoute, ...args) {
    alt.emitClient(this, emitRoute, ...args);
};

alt.Player.prototype.incrementLap = function incrementLap() {
    if (this.lap === null || this.lap === undefined) {
        this.lap = 0;
    } else {
        this.lap += 1;
        this.send(`Finished Lap. Current Lap: ${this.lap}`);
    }
};

alt.Player.prototype.resetLaps = function resetLaps() {
    this.lap = 0;
};
