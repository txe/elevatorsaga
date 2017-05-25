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

        var move = function (elv, floorNum) {
            var i, up, wait_flag = "none",
                pFloorNum = floorNum,
                near = 100,
                counter = 0;
            for (i = 0; i < elv.getPressedFloors().length; ++i) {
                if (floorNum != elv.getPressedFloors()[i] && Math.abs(floorNum - elv.getPressedFloors()[i]) < near) {
                    pFloorNum = elv.getPressedFloors()[i];
                    near = floorNum - elv.getPressedFloors()[i];
                }
            }
            if (pFloorNum == floorNum) {

                for (i = 0; i < wait_up.length; i += 1) {
                    if (i != floorNum && wait_up[i] != 0 && (counter == 0 || wait_up[i] < counter)) {
                        counter = wait_up[i];
                        pFloorNum = i;
                        wait_flag = "up";
                    }
                    if (i != floorNum && wait_down[i] != 0 && (counter == 0 || wait_down[i] < counter)) {
                        counter = wait_down[i];
                        pFloorNum = i;
                        wait_flag = "down";
                    }
                }
                // near = 100;
                // // look for nearest floor
                // for (i = 0; i < wait_up.length; i += 1) {
                //     if (floorNum != i && wait_up[i] == 1 && Math.abs(i - floorNum) < near) {
                //         near = Math.abs(i - floorNum);
                //         pFloorNum = i;
                //         wait_flag = "up";
                //     }
                // }
                // for (i = 0; i < wait_down.length; i += 1) {
                //     if (floorNum != i && wait_down[i] == 1 && Math.abs(i - floorNum) < near) {
                //         near = Math.abs(i - floorNum);
                //         pFloorNum = i;
                //         wait_flag = "down";
                //     }
                // }
            }
            if (floorNum != pFloorNum) {
                up = floorNum < pFloorNum;
                elv.goingUpIndicator(up);
                elv.goingDownIndicator(!up);
                if (wait_flag == "up") wait_up[pFloorNum] = 0;
                if (wait_flag == "down") wait_down[pFloorNum] = 0;
                return pFloorNum;
            }

            elv.goingUpIndicator(true);
            elv.goingDownIndicator(true);
            return -1;
        };

        var gc_elv = function (elv, elevNum) {
            var next_floor = -1,
                event,
                press_button;

            elv.goingUpIndicator(true);
            elv.goingDownIndicator(false);

            elv.on("idle", function () {
                if (next_floor == -1) {
                    next_floor = move(elv, elv.currentFloor());
                }
                if (next_floor != -1) {
                    elv.goToFloor(next_floor);
                }
            });
            elv.on("passing_floor", function (floorNum, dir) {
                if (dir == "up" && wait_up[floorNum] > 0) {
                    console.log("-- --- stop on passing up, elv: ", elevNum, " floor: ", floorNum);
                    elv.destinationQueue = [floorNum];
                    elv.checkDestinationQueue();
                }
                if (dir == "down" && wait_down[floorNum] > 0) {
                    console.log("-- --- stop on passing up, elv: ", elevNum, " floor: ", floorNum);
                    elv.destinationQueue = [floorNum];
                    elv.checkDestinationQueue();
                }

            });
            elv.on("floor_button_pressed", function (floorNum) {
                // someone enters, no need to wait
                console.log("button pressed, elv: ", elevNum, " floor: ", floorNum);
                if (elv.goingUpIndicator()) {
                    console.log("clear up, elv: ", elevNum, " floor: ", floorNum);
                    wait_up[elv.currentFloor()] = 0;
                }
                if (elv.goingDownIndicator()) {
                    console.log("clear down, elv: ", elevNum, " floor: ", floorNum);
                    wait_down[elv.currentFloor()] = 0;
                }
            });
            elv.on("stopped_at_floor", function (floorNum) {
                next_floor = move(elv, floorNum);
            });

            press_button = function (floor, dir) {
                if (next_floor == -1) {
                    next_floor = move(elv, elv.currentFloor());
                    if (next_floor != -1) {
                        console.log("press floor button, elv: " + elevNum + ", floor: " + floor.floorNum() + ", dir: " + dir);
                        elv.goToFloor(next_floor);
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
                fire_press_button(floor, "up");

            });
            floor.on("down_button_pressed", function () {
                if (wait_down[floor.floorNum()] == 0) {
                    wait_down[floor.floorNum()] = pas_counter;
                    pas_counter += 1;
                }
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