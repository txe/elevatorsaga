{
    init: function (elevators, floors) {
        var elvs = [],
            gc_elv, gc_floor, i;
        var wait_up = [],
            wait_down = [];

        var gc_elv = function (elv, up) {
            elv.goingUpIndicator(up);
            elv.goingDownIndicator(!up);

            elv.on("idle", function () {
                var i;
                if (up) {
                    if (elv.getPressedFloors().length > 0) {
                        elv.goToFloor(elv.getPressedFloors()[0]);
                    } else {
                        elv.goToFloor(0);
                    }
                } else {
                    if (elv.getPressedFloors().length > 0) {
                        elv.goToFloor(elv.getPressedFloors()[0]);
                    } else {
                        console.log("try");
                        for (i = wait_down.length - 1; i >= 0; i -= 1) {
                            if (wait_down[i] == 1) {
                                elv.goToFloor(i);
                                break;
                            }
                        }
                        elv.goToFloor(floors.length - 1);
                    }
                }
            });
            elv.on("stopped_at_floor", function (floorNum) {
                if (!up) {
                    wait_down[floorNum] = 0;
                }
                if (up) {
                    if (floorNum == 0) {
                        elv.goingUpIndicator(true);
                        elv.goingDownIndicator(false);
                    } else if (elv.getPressedFloors().length == 0) {
                        elv.goingUpIndicator(false);
                        elv.goingDownIndicator(true);
                    }
                } else {
                    if (floorNum == 0) {
                        elv.goingUpIndicator(true);
                        elv.goingDownIndicator(false);
                    } else {
                        elv.goingUpIndicator(false);
                        elv.goingDownIndicator(true);
                    }
                }
            })
        };
        var gc_floor = function (floor) {
            floor.on("up_button_pressed", function () {
                wait_up[floor.floorNum()] = 1;
            });
            floor.on("down_button_pressed", function () {
                wait_down[floor.floorNum()] = 1;
            });
        };
        for (i = 0; i < elevators.length; i += 1) {
            gc_elv(elevators[i], i != 0);
        }
        for (i = 0; i < floors.length; i += 1) {
            gc_floor(floors[i]);
        }
    },
    update: function (dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}