module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                    'lib/paint/module.js',
                    'lib/paint/Manager/Grid.js',
                    'lib/paint/Manager/Boxes.js',
                    'lib/paint/Manager/Polygon.js',
                    'lib/paint/Manager/Leap.js',
                    'lib/paint/Manager/Shape.js',
                    'lib/paint/Manager/Color_Palette.js',
                    'lib/paint/Manager.js',
                    'lib/paint/directives/editor.js'
                ],
                dest: 'build/Paint.js'
            }
        },
        uglify: {
            options: {
                mangle: false,
                compress: false,
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: [
                    {    src: 'build/Paint.js',
                        dest: 'index.js'},
                    {
                        src: 'build/Paint.js',
                        dest: 'public/js/Paint.js'
                    }
                ]

            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

};