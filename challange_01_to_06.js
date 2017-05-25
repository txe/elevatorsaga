{
    init: function (elevators, floors) {
        var elvs = [],
            gc_elv, gc_floor, i;
        var wait_on = [];

        var gc_elv = function (elv) {
            elv.on("idle", function () {
                var i;
                if (elv.getPressedFloors().length > 0) {
                    elv.goToFloor(elv.getPressedFloors()[0]);
                } else {
                    //console.log(wait_on);
                    for (i = 0; i < wait_on.length; i += 1) {
                        if (wait_on[i] == 1) {
                            elv.goToFloor(i);
                            break;
                        }
                    }
                }
               //elv.goToFloor(0);
            });
            elv.on("stopped_at_floor", function (floorNum) {
                wait_on[floorNum] = 0
            })
        };
        var gc_floor = function (floor) {
            floor.on("up_button_pressed", function () {
                wait_on[floor.floorNum()] = 1;
            });
            floor.on("down_button_pressed", function () {
                wait_on[floor.floorNum()] = 1;
            });
        };
        for (i = 0; i < elevators.length; i += 1) {
            gc_elv(elevators[i]);
        }
        for (i = 0; i < floors.length; i += 1) {
            gc_floor(floors[i]);
        }
    },
    update: function (dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}