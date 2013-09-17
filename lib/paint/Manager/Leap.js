(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    var LEAP_GUIDE_COLOR = 'rgb(204,0,0)';
    var LEAP_GUIDE_COLOR2 = 'rgba(0,153,0,0.5)';

    var LEAP_MIN_THRESHOLD = 30;
    var LEAP_MAJOR_THRESHOLD = 60;
    var LEAP_EXT_THRESHOLD = 150;
    var LEAP_Y_THRESHOLD = 250;

    var INERTIA_RETICLE = 'rgb(204,0,0)';

    var Z_INNER_PERCENT = 0.125;

    angular.module('Paint').factory('Paint_Manager_Leap', function () {

        function _x_guide(manager, color) {
            var x_guide = manager.add('shape');
            x_guide.x = manager.screen_width() / 2;
            x_guide.graphics.ss(2).s(color).mt(0, 0).lt(0, manager.screen_height()).es();
            return x_guide;
        }

        function _y_guide(manager, color) {
            var y_guide = manager.add('shape');
            y_guide.y = manager.screen_height() / 2;
            y_guide.graphics.ss(2).s(color).mt(0, 0).lt(manager.screen_width(), 0).es();
            return y_guide;
        }

        function _z_bubble(manager) {
            // currently not used
            manager.z_bubble_axis = manager.add('shape');
            manager.z_bubble_axis.x = manager.screen_width() / 2;
            manager.z_bubble_axis.y = manager.margin() / 2;
            manager.z_bubble_axis.graphics.s(LEAP_GUIDE_COLOR2).ss(2)
                .mt((manager.screen_width() / -2), 0)
                .lt(manager.screen_width() * -Z_INNER_PERCENT, 0).es()
                .s(LEAP_GUIDE_COLOR).mt(manager.screen_width() * Z_INNER_PERCENT, 0)
                .lt(manager.screen_width() / 2, 0).es();

            manager.z_bubble = manager.add('shape');
            manager.z_bubble.graphics.f('rgb(0,0,0)').r(-10, -20, 10, 40).ef();
        }

        function make_leap_guides(manager) {
            manager.ts = 0;
            manager.inertia = 0;

            manager.x_guide = _x_guide(manager, LEAP_GUIDE_COLOR);
            manager.y_guide = _y_guide(manager, LEAP_GUIDE_COLOR);
            manager.x_guide_2 = _x_guide(manager, LEAP_GUIDE_COLOR2);
            manager.y_guide_2 = _y_guide(manager, LEAP_GUIDE_COLOR2);

            manager.inertia_display = manager.add('shape');
            manager.inertia_display.graphics.ss(1).s(LEAP_GUIDE_COLOR).dc(0, 0, 5);

            manager.inertia_display_2 = manager.add('shape');
            manager.inertia_display_2.graphics.ss(1).s(LEAP_GUIDE_COLOR2).dc(0, 0, 5);
            manager.inertia = 0;
            manager.inertia_2 = 1;
        }

        function _smooth(old_value, new_value, manager) {
            if (!isNaN(new_value)) {
                if (isNaN(old_value)) {
                    return manager.snap(new_value);
                } else {
                    return  manager.snap(0.8 * old_value + 0.2 * new_value);
                }
            } else {
                return manager.snap(old_value);
            }
        }

        function _set_guides(manager, point, which) {

            var x_guide = which == 1 ? this.x_guide_2 : this.x_guide;
            var y_guide = which == 1 ? this.y_guide_2 : this.y_guide;
            var point_x = this.snap((point[0] * this.screen_width()));
            var y = 1 - point[1];
            var point_y = this.snap(y * this.screen_height());
            var inertial_display = (which == 1) ? this.inertia_display_2 : this.inertia_display;
            var inertia_key = which == 0 ? 'inertia' : 'inertia_2';

            if (point[3] > 30) {
                this[inertia_key] -= 5;
            } else {
                ++this[inertia_key];
            }

            this[inertia_key] = Math.max(1, Math.min(1000, this[inertia_key]));

            inertial_display.scaleX = inertial_display.scaleY = Math.sqrt(this[inertia_key] / 20);

            if (this[inertia_key] > 50) {
                inertial_display.visible = true;
                this.update();
                return;
            } else {
                inertial_display.visible = true;
            }

            inertial_display.x = x_guide.x = _smooth(x_guide.x, point_x, manager);
            inertial_display.y = y_guide.y = _smooth(y_guide.y, point_y, manager);
        }

        function update_leap_guides(points, manager) {

            _.each(points, function (point, i) {
               _set_guides(manager, point, i);
            });

            if (manager.active_shape) {
                manager.active_shape.set_x(Math.min(manager.x_guide.x, manager.x_guide_2.x) - manager.margin());
                manager.active_shape.set_width(Math.abs(manager.x_guide.x - manager.x_guide_2.x));
                manager.active_shape.set_y(Math.min(manager.y_guide.y, manager.y_guide_2.y) - manager.margin());
                manager.active_shape.set_height(Math.abs(manager.y_guide.y - manager.y_guide_2.y));
                manager.active_shape.draw();
                manager.show_boxes(true);
            }
            manager.update();
        }

        function on_leap(manager) {

            return function (obj) {
                manager.ts = obj.timestamp;

                if (obj.gestures && obj.gestures.length) {
                    // console.log(obj.gestures);
                    if (_.find(obj.gestures, function (g) {
                        return g.type = 'keyTap'
                    })) {
                        manager.active_shape = null;
                    }
                }
                if (obj.hands.length > 0) {
                    // only continue if you have two hands

                    // average all found points to a single point for each hand.

                    var points = _.map(obj.hands, function (hand) {
                        if ((!hand.fingers) || (!hand.fingers.length)) return false;

                        var avg_finger = _.reduce(hand.fingers, function (out, finger) {
                            var fsp = _.map(finger.stabilizedTipPosition, _.identity);
                            //    console.log('tv:', finger.tipVelocity);
                            fsp[3] = _.reduce(finger.tipVelocity, function (o, v) {
                                return o + Math.abs(v)
                            }, 0) / 3;

                            return _.map(out, function (v, i) {
                                return v + fsp[i];
                            })
                        }, [0, 0, 0, 0]);
                        return _.map(avg_finger, function (v) {
                            return v / hand.fingers.length;
                        })
                    });

                        points = _.map(points, function (point) {
                            var pd = obj.interactionBox.normalizePoint(point);
                            point[0] = pd[0];
                            point[1] = pd[1];
                            point[2] = pd[2];
                            return point;
                        });

                       update_leap_guides(points, manager);
                }
            };
        }

        return function (manager) {

            if (window.Leap) {

                make_leap_guides(manager);
                window.Leap.loop({enableGestures: true}, on_leap(manager));
            }

        }

    })
})(window);