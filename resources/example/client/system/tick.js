import * as alt from 'alt';
import * as native from 'natives';

alt.onServer(`race:Marker`, setRaceMarker);

const interval = alt.setInterval(handleTickEvents, 0);

let nextFreezeCheck = Date.now() + 100;
let markerPosition;
let markerBlip;

function handleTickEvents() {
    // Untimed Draw Functions
    drawNextTargetMarker();

    // Timed Checks
    checkFreeze();
}

function setRaceMarker(pos) {
    markerPosition = { ...pos };

    if (!markerBlip) {
        markerBlip = new alt.PointBlip(markerPosition.x, markerPosition.y, markerPosition.z);
        markerBlip.sprite = 57;
        markerBlip.name = 'Next Target';
        markerBlip.scale = 0.2;
    } else {
        markerBlip.pos = pos;
    }
}

function checkFreeze() {
    if (Date.now() < nextFreezeCheck) {
        return;
    }

    nextFreezeCheck = Date.now() + 100;

    const frozenState = alt.Player.local.getSyncedMeta('frozen');
    if (!frozenState) {
        native.freezeEntityPosition(alt.Player.local.scriptID, false);
        if (alt.Player.local.vehicle) {
            native.freezeEntityPosition(alt.Player.local.vehicle.scriptID, false);
        }
        return;
    }

    native.freezeEntityPosition(alt.Player.local.scriptID, true);

    if (alt.Player.local.vehicle) {
        native.freezeEntityPosition(alt.Player.local.vehicle.scriptID, true);
    }
}

function drawNextTargetMarker() {
    if (!markerPosition) {
        return;
    }

    native.drawMarker(
        1,
        markerPosition.x,
        markerPosition.y,
        markerPosition.z - 1,
        0,
        0,
        0,
        0,
        0,
        0,
        10,
        10,
        5,
        0,
        100,
        0,
        255,
        false,
        false,
        0,
        false
    );
}
