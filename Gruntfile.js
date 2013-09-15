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
                    'lib/paint/Shape.js',
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