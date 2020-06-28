import * as alt from 'alt';
import { sendToAll } from './chat';
import { RACE_TRACKS } from '../configuration/config';
import { VALID_VEHICLES_LIST } from '../../shared/vehicleData';
import { distance2d } from '../utility/vector';

const TIME_UNTIL_RACE_START = 3000;
const TARGET_RADIUS = 5;

let race;

class Race {
    constructor(raceCoordinates) {
        this.raceInfo = raceCoordinates;
        this.players = [];
        this.started = false;
        this.goTime = Date.now();
        this.goTimeEnd = this.goTime + TIME_UNTIL_RACE_START;
        alt.setTimeout(this.startRace.bind(this), TIME_UNTIL_RACE_START);
        this.raceStartInterval = alt.setInterval(this.tickTillRaceStart.bind(this), 1000);
    }

    tickTillRaceStart() {
        if (this.started) {
            return;
        }

        const secondsUntilStart = Math.abs((Date.now() - this.goTimeEnd) / 1000).toFixed(0);
        sendToAll(`Race Begins in ${secondsUntilStart}s`);

        if (Date.now() > this.goTimeEnd) {
            alt.clearInterval(this.raceStartInterval);
            this.interval = null;
            this.startRace();
            sendToAll(`Begin!`);
            return;
        }
    }

    startRace() {
        if (this.started) {
            return;
        }

        this.started = true;
        this.startTime = Date.now();
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!player || !player.valid) {
                continue;
            }

            player.currentIndex = null;
            player.resetLaps();
            player.setSyncedMeta('frozen', false);
            this.updatePlayerVehicle(player);
            this.setNextTarget(player);
        }

        // Check Race Positions ~ 25ms
        this.interval = alt.setInterval(this.checkRacerPositions.bind(this), 25);
    }

    updatePlayerVehicle(player) {
        const index = Math.floor(Math.random() * VALID_VEHICLES_LIST.length);
        const vehicleData = VALID_VEHICLES_LIST[index];

        player.emit('vehicle:SaveVelocity', player.vehicle);

        alt.setTimeout(() => {
            if (player.currentVehicle && player.currentVehicle.valid) {
                player.currentVehicle.destroy();
                player.currentVehicle = null;

                const pos = { ...player.pos };
                const rot = { ...player.rot };
                player.currentVehicle = new alt.Vehicle(vehicleData.model, pos.x, pos.y, pos.z, rot.x, rot.y, -rot.z);
            } else {
                const pos = this.raceInfo.start;
                player.currentVehicle = new alt.Vehicle(vehicleData.model, pos.x, pos.y, pos.z, 0, 0, 0);
            }

            player.currentVehicle.engineOn = true;
            player.emit('vehicle:PlaceInto', player.currentVehicle);
        }, 500);
    }

    setNextTarget(player) {
        player.send(`Checkpoint Complete!`);
        player.target = null;

        if (player.currentIndex === null || player.currentIndex === undefined) {
            player.currentIndex = 0;
            player.target = this.raceInfo.positions[player.currentIndex];
            player.emit(`race:Marker`, player.target);
            return;
        }

        // Finish Lap
        const finalIndex = this.raceInfo.positions.length - 1;
        if (player.currentIndex >= finalIndex) {
            player.currentIndex = 0;
            player.target = this.raceInfo.positions[player.currentIndex];
            player.emit(`race:Marker`, player.target);
            player.incrementLap();
            this.updatePlayerVehicle(player);
            return;
        }

        player.currentIndex += 1;
        player.target = this.raceInfo.positions[player.currentIndex];
        player.emit(`race:Marker`, player.target);
    }

    checkRacerPositions() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!player || !player.valid || !player.vehicle || !player.target) {
                continue;
            }

            const dist = distance2d(player.pos, player.target);
            if (dist >= 6) {
                continue;
            }

            this.setNextTarget(player);
        }
    }

    addPlayer(player) {
        this.removePlayer(player);
        this.players.push(player);
        player.resetLaps();

        if (!this.started) {
            player.setSyncedMeta('frozen', true);
        }
    }

    removePlayer(player) {
        const index = this.players.findIndex(target => target === player);

        if (index >= 0) {
            this.players.splice(index, 1);
        }
    }
}

export function fetchRaceInstance() {
    if (race) {
        return race;
    }

    // Fetch Random Course
    const racetrack = RACE_TRACKS[0];
    race = new Race(racetrack);
    return race;
}
