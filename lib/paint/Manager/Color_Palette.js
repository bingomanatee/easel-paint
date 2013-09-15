(function () {

    var HUES = 18;
    var SWATCH_HEIGHT = 24;
    var SHADES = 8;
    var VALUES = 8;

    var _hsl_template = _.template('hsl(<%= Math.max(0, Math.min(360, Math.round(h))) %>, <%= Math.max(0, Math.min(100, Math.round(s))) %>%, <%= Math.max(0, Math.min(100, Math.round(v))) %>%)');
    /* ***************** Color Palette ******************* */

    function Color_Palette(manager, x, y, width, height) {
        this.manager = manager;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;

        this.init_cp_layer();
        this.manager.stage.addChild(this.palette);
        this.show(false);
    }

    Color_Palette.prototype = {

        ld: function (hue) {
            var self = this;

            return function (event) {
                self.lighten.removeAllChildren();
                self.darken.removeAllChildren();
                var w = self.width / VALUES;
                _.each(_.range(50, 100, 50 / VALUES), function (value, i) {
                    var x = w * i;
                    _.each([100, 50, 25, 10], function (sat, i) {
                        var swatch = self.make_swatch(hue, sat, value, x, SWATCH_HEIGHT * i, w, SWATCH_HEIGHT);
                        swatch.addEventListener('mousedown', self.color_choice(hue, 100, value));
                        self.lighten.addChild(swatch);
                    });


                    _.each([100, 50, 25, 10], function (sat, i) {
                        swatch = self.make_swatch(hue, sat, 100 - value, x, -SWATCH_HEIGHT * i, w, SWATCH_HEIGHT);
                        swatch.addEventListener('mousedown', self.color_choice(hue, 100, 100 - value));
                        self.darken.addChild(swatch);
                    });
                });
                self.update();
            }
        },

        color_choice: function (hue, sat, value) {

            return _.bind(function (event) {
                console.log('chosen hsv ', hue, sat, value);
                this.show(false);
                var color = this._color_string(hue, sat, value);
                this.manager.scope.current_color = color;
                this.manager.scope.$apply();
            }, this);

        },

        update: function () {
            this.manager.update();
        },

        init_cp_layer: function () {
            this.palette = new createjs.Container();
            this.palette.x = this.x;
            this.palette.y = this.y;

            this.lighten = new createjs.Container();
            this.darken = new createjs.Container();
            this.darken.y = this.height - SWATCH_HEIGHT;
            this.palette.addChild(this.darken, this.lighten);

            var back = new createjs.Shape();
            back.graphics.f('rgba(200,200,200, 0.25)').r(0, 0, this.width, this.height).ef().s('rgba(100,100,100,0.25)').ss(1).r(0, 0, this.width, this.height).es();

            this.palette.addChild(back);
            var hue_width = this.width / HUES;
            var y = (this.height ) / 2 - SWATCH_HEIGHT;

            _.each(_.range(0, 360, 360 / HUES), function (hue, i) {
                var x = i * hue_width;
                var swatch = this.make_swatch(hue, 100, 50, x, y, hue_width, SWATCH_HEIGHT);
                this.palette.addChild(swatch);

                swatch.addEventListener('mousedown', this.ld(hue));
            }, this);

            y += SWATCH_HEIGHT;
            var grey_width = this.width / (SHADES + 1);
            _.each(_.range(0, 101, 100 / SHADES), function (lightness, i) {
                var x = i * grey_width;
                var swatch = this.make_swatch(0, 0, lightness, x, y, grey_width, SWATCH_HEIGHT);
                swatch.addEventListener('mousedown', this.color_choice(0, 0, lightness));
                this.palette.addChild(swatch);
            }, this);


        },

        make_swatch: function (hue, sat, value, x, y, w, h) {

            var swatch = new createjs.Shape();
            swatch.x = x;
            swatch.y = y;
            swatch.graphics.f(this._color_string(hue, sat, value)).r(0, 0, w, h).ef();

            return swatch;
        },

        _color_string: function (h, s, v) {
            var data = {h: h, s: s, v: v};
            return _hsl_template(data);
        },

        show: function (hide) {
            this.palette.visible = hide === false ? false : true;
            this.manager.update();
        }


    };

    var app = angular.module('Paint');
    app.factory('Color_Palette', function () {

        return function (manager, x, y, width, height) {

            return new Color_Palette(manager,x, y, width, height);

        }


    })

})(window);