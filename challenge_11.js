{
    init: function (elevators, floors) {
        var elvs = [],
            gc_elv, gc_floor, move, fire_event, i;
        var wait_up = [],
            wait_down = [];
        var my_elvs = [];
        var pas_counter = 1;

        var fire_press_button = function (floor, dir) {
            for (i = 0; i < my_elvs.length; i += 1) {
                my_elvs[i].press_button(floor, dir);
            }
        }

        var log = function(elevNum, floorNum, text) {
            console.log("elev: ", elevNum, " floor: ", floorNum, " ", text);
        };

        var moveTo = function(elv, floorNum){
            elv.moveTo = floorNum;
            elv.goToFloor(floorNum);
        }

        var stopAt = function(elv, floorNum) {
            elv.moveTo = floorNum;
        }

        var take_move = function(elv, floorNum, dir) {
            var i;
            var up = false, down = false;
            for (i = 0; i < elevators.length; i += 1) {
                if (elevators[i] != elv) {
                    if (elevators[i].moveTo == floorNum) {
                        if (elevators[i].loadFactor() == 0) {
                            return false;
                        }
                        // they pick up 
                        up |= wait_up[floorNum] == 0 || (wait_up[floorNum] > 0 && elevators[i].goingUpIndicator());
                        down |= wait_down[floorNum] == 0 || (wait_down[floorNum] > 0 && elevators[i].goingDownIndicator());
                        if (up && down) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        var calc_move = function (elv, floorNum) {
            var i, up, dir_flag = "both",
                pFloorNum = floorNum, near = 100;
            // move them down 
            for (i = 0; i < elv.getPressedFloors().length; ++i) {
                if (floorNum < elv.getPressedFloors()[i] && Math.abs(floorNum - elv.getPressedFloors()[i]) < near) {
                    pFloorNum = elv.getPressedFloors()[i];
                    near = floorNum - elv.getPressedFloors()[i];
                    dir_flag = "down"; // reversed because don't want to pick up down pass
                }
            }
            // if no down then move up
            if (pFloorNum == floorNum) {
                for (i = 0; i < elv.getPressedFloors().length; ++i) {
                    if (floorNum > elv.getPressedFloors()[i] && Math.abs(floorNum - elv.getPressedFloors()[i]) < near) {
                        pFloorNum = elv.getPressedFloors()[i];
                        near = floorNum - elv.getPressedFloors()[i];
                        dir_flag = "up"; // don't mind to pick up up pass
                    }
                }
            }

            // just pick up floor
            if (pFloorNum == floorNum) {
                var paths = []
                for (i = 0; i < wait_up.length; i += 1) {
                    if (i != floorNum && wait_up[i] != 0) {
                        paths.push({floor: i, counter: wait_up[i]});
                    }
                    if (i != floorNum && wait_down[i] != 0) {
                        paths.push({floor: i, counter: wait_down[i]});
                    }
                }
                paths.sort(function(a,b) { return a.counter - b.counter;});
                for (i = 0; i < paths.length && pFloorNum == floorNum; i += 1) {
                    if (take_move(elv, paths[i].floor)) {
                        pFloorNum = paths[i].floor;
                    }
                }

            }
            if (floorNum != pFloorNum) {
                elv.goingUpIndicator(dir_flag == "up" || dir_flag == "both");
                elv.goingDownIndicator(dir_flag != "up" || dir_flag == "both");
                return pFloorNum;
            }

            elv.goingUpIndicator(true);
            elv.goingDownIndicator(true);
            return -1;
        };

        var gc_elv = function (elv, elevNum) {
            var press_button;

            elv.goingUpIndicator(true);
            elv.goingDownIndicator(false);
            elv.next_floor = elevNum;
            moveTo(elv, elv.next_floor);

            elv.on("idle", function () {
                elv.next_floor = calc_move(elv, elv.currentFloor());
                if (elv.next_floor != -1) {
                    log(elevNum, elv.currentFloor(), " go to " + elv.next_floor);
                    moveTo(elv, elv.next_floor);
                }
            });
            elv.on("passing_floor", function (floorNum, dir) {
                if (dir == "up" && wait_up[floorNum] > 0 && elv.maxPassengerCount() < 1 && take_move(elv, floorNum, dir)) {
                    log(elevNum, floorNum, "-- --- stop on passing up");
                    moveTo(elv, floorNum);
                }
                if (dir == "down" && wait_down[floorNum] > 0 && elv.maxPassengerCount() < 1 && take_move(elv, floorNum, dir)) {
                    log(elevNum, floorNum, "-- --- stop on passing up");
                    moveTo(elv, floorNum);
                }

            });
            elv.on("floor_button_pressed", function (floorNum) {
                // someone enters, no need to wait
                log(elevNum, elv.currentFloor(), "button pressed to " + floorNum);
                if (elv.goingUpIndicator()) {
                    log(elevNum, elv.currentFloor(), "clear up current floor");
                    wait_up[elv.currentFloor()] = 0;
                }
                if (elv.goingDownIndicator()) {
                    log(elevNum, elv.currentFloor(), "clear down current floor");
                    wait_down[elv.currentFloor()] = 0;
                }
                if (elv.maxPassengerCount() == 1) {
                    elv.trigger("idle");
                }
            });
            elv.on("stopped_at_floor", function (floorNum) {
                log(elevNum, floorNum, "stopped at floor");
                stopAt(elv, floorNum);
                elv.next_floor = calc_move(elv, floorNum);
            });

            press_button = function (floor, dir) {
                if (elv.next_floor == -1) {
                    elv.next_floor = calc_move(elv, elv.currentFloor());
                    if (elv.next_floor != -1) {
                        log(elevNum, elv.currentFloor(),  " go to by floor button, floor = " + floor.floorNum() + " dir = " + dir);
                        moveTo(elv, elv.next_floor);
                    }
                }
            };

            return {
                press_button: press_button
            };
        };
        var gc_floor = function (floor) {
            floor.on("up_button_pressed", function () {
                if (wait_up[floor.floorNum()] == 0) {
                    wait_up[floor.floorNum()] = pas_counter;
                    pas_counter += 1;
                }
                console.log("floor up: ", floor.floorNum());
                fire_press_button(floor, "up");

            });
            floor.on("down_button_pressed", function () {
                if (wait_down[floor.floorNum()] == 0) {
                    wait_down[floor.floorNum()] = pas_counter;
                    pas_counter += 1;
                }
                console.log("floor down: ", floor.floorNum());
                fire_press_button(floor, "down");
            });
        };


        for (i = 0; i < elevators.length; i += 1) {
            my_elvs[i] = gc_elv(elevators[i], i);
        }
        for (i = 0; i < floors.length; i += 1) {
            wait_up[i] = 0;
            wait_down[i] = 0;
            gc_floor(floors[i]);
        }
    },
    update: function (dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}