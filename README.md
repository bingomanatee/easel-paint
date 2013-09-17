# Easel Paint

A fundamental drawing program done with Easel/Canvas and Angular.js

The classes required are all bundled into index.js, assembled by Grunt from the component files in lib.

The end product is a directive, `paint-editor`, whose dimensions can be customized to suit your needs.

``` html
<div paint-editor width="1000" height="700" margin="50" grid="25" class="paint-editor">
... loading easel paint
</div>
```

All you have to do is to add 'Paint' as a modular dependcy of your app. It doesn't have to be called "PaintApp" for this
directive to work.

`` html

angular.module("PaintApp", ["Paint"]);

```

## File Dependencies

The directive has a remote template, defined as a template-url, at `/js/paint/directives/editor.html`.
If that path doesn't suit your needs, you can grep it in the source.

That template defines which drawing buttons are available; the one in the sample static site,

``` html
<canvas class="paint-canvas" style="border: 1px solid black">

</canvas>
<div class="controls">
    <div class="draw_buttons">
        <button class="rectangle" title="add rectangle" ng-click="add_rectangle()"></button>
        <button class="circle" title="add oval" ng-click="add_oval()"></button>
        <button class="triangle" title="add triangle" ng-click="add_triangle()"></button>
        <button ng_class="draw_button_class('polygon')" title="add polygon" ng-click="add_polygon()"></button>
        <span class="poly_buttons" ng-show="show_poly_buttons()">
        <button ng_class="draw_button_pp_class('add')" title="add poly point" ng-click="add_polygon_point()"></button>
        <button ng_class="draw_button_pp_class('delete')" title="delete poly point" ng-click="delete_polygon_point()"></button>
        <button ng_class="draw_button_pp_class('move')" title="move poly point" ng-click="move_polygon_point()"></button>
        <button class="done_poly" ng-click="close_poly()">close poly</button>
        </span>
        <button class="move_up" title="move up" ng-show="show_move('up')" ng-click="move_up()"></button>
        <button class="move_down" title="move down" ng-show="show_move('down')" ng-click="move_down()"></button>
        <button class="rotate" title="rotate" ng-click="rotate()"></button>
    </div>
    <div class="color">
        <label for="colorInput">Color</label>
        <input id="colorInput" class="input input-small" type="text" ng-model="current_color"/>
        <button class="btn" ng-click="choose_color()">Choose</button>
    </div>
</div>
````

shows the full suite of tools.

Note that the button appearance is defined by `/css/paint.css` (a derivative of `/css/paint.scss`); feel free to
customize the button appearance to suit your needs. The included css file also depends on `/img/draw_icons.png`.

## Modifying and extending Easel Paint

You can add other drawing tools as you like.

1. The draw method of `/lib/paint/Manager/Shape.js` must have cases added to reflect your new tools
2. The `add_button_bindings` method of `/lib/paint/Manager.js` must add hooks to trigger creation of your new sprite type
3. the `/js/paint/directives/editor.html` file must have buttons added to trigger creation of our new sprite type.

suboptimal for sure; more streamlined extension is a big @todo.

### A note on the coordinate system and drawing

Every shape has an offset (x,y) and a width and height. This is used by the draw() methods to define the local dimensions
of the shape. Note that width and height are not intrinsic properties of createjs.Easel, but rather, inventions of this
directive.

In order to make rotation work, the reference point of drawing is defined as (x + width/2), (y + height/2). All drawing
(lineTo, moveTo, etc.) graphics commands use that reference point as their origin.

Width and Height are altered by dragging the manipulation boxes that appear around a selected object. (you might have to drag
an object a little to see those boxes.)

A margin is added around the drawing grid; this is to ensure that all four manipulation boses are visible at all times.
Care is taken to prevent drawing "Off the grid" but its not impossible that with cunning you can push/maneuver objects
to extend beyond the grid into the margin.

When you rotate an object, the manipulation boxes will not change. This is a known decision, not a bug. Scaling via manipulation
boxes will affect the pre-rotated width and height of the object.

Rotation is constrained to 45 degree increments. Finer increments could easily be attained by altering the rotation code.

## Colors

Colors are expressed as CSS/canvas readable strings. The palette widget expresses these values in HSV but any
digestable string (hex notation, rgb, rgba) can be used by manually entering a color in the text box. Take care,
as no validation on color formats currently is done.

## Polygons

The Polygon code is the most inolved and messiest part of this codebase. Polygons, once drawn, are not editable at the
point level. You must hit the 'Close" button to finish the polygon. Until you do this, the manipulation boxes won't effect
the actual position/size of the polygon. Note that while you are adding points to the polygon, there is a set of buttons
that will allow you to delete or move individuual points but once the polygon is closed these tools are not available
for editng your polygon.

For this reason, it is best to make multiple polygons with a small number of points rather than involved multipoint polygons.

# Painting with Easel Paint

Easel Paint allows you to create using primitives - circles, triangles, squares and polygons, of different colrs and
sizes. Currently you cannot save your drawings - if you like your work take a screen grab :D

You cannot add lines gradations, or text to your paintings.

The grid is always on - you cannot (easily) draw shapes that are not snapped to this grid.

Shapes can be rotated, and their layering re-shuffled, by clicking on a shape and hitting the rotate/shufflb buttons.

Shapes can be re-colored any number of times.

The color widget affects the color of the currently selected object and the color of any subsequently drawn shapes.

To draw perfectly square boxes or perfectly circular ovals, drag the manipulation boxes until their heights and widths are the same.
You can hold the shift key down while doing this if you want to. But it won't help.

