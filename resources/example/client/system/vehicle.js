import * as alt from 'alt';
import * as native from 'natives';

let velocity;

alt.onServer('vehicle:PlaceInto', placeIntoVehicle);
alt.onServer('vehicle:SaveVelocity', vehicleSaveVelocity);

function vehicleSaveVelocity(vehicle) {
    if (!vehicle) {
        return;
    }

    velocity = native.getEntityVelocity(vehicle.scriptID);
    alt.log(JSON.stringify(velocity));
}

function placeIntoVehicle(vehicle) {
    const interval = alt.setInterval(() => {
        if (!vehicle.valid) {
            return;
        }

        if (alt.Player.local.vehicle) {
            if (velocity) {
                native.setEntityVelocity(alt.Player.local.vehicle.scriptID, velocity.x, velocity.y, velocity.z);
                velocity = null;
            }

            alt.clearInterval(interval);
            return;
        }

        native.setPedIntoVehicle(alt.Player.local.scriptID, vehicle.scriptID, -1);
    }, 25);
}
