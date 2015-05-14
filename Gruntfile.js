// Generated on 2015-05-09 using generator-ionic 0.7.3
'use strict';

var _ = require('lodash');
var path = require('path');
var cordovaCli = require('cordova');
var spawn = process.platform === 'win32' ? require('win-spawn') : require('child_process').spawn;

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: {
            // configurable paths
            app: 'app',
            views: 'views',
            scripts: 'scripts',
            styles: 'css',
            images: 'img',
            test: 'test',
            dist: 'www'
        },

        // Environment Variables for Angular App
        // This creates an Angular Module that can be injected via ENV
        // Add any desired constants to the ENV objects below.
        // https://github.com/diegonetto/generator-ionic/blob/master/docs/FAQ.md#how-do-i-add-constants
        ngconstant: {
            options: {
                space: '  ',
                wrap: '"use strict";\n\n {%= __ngModule %}',
                name: 'config',
                dest: '<%= yeoman.app %>/<%= yeoman.scripts %>/configuration.js'
            },
            development: {
                constants: {
                    ENV: {
                        name: 'development',
                        apiEndpoint: 'http://dev.yoursite.com:10000/'
                    }
                }
            },
            production: {
                constants: {
                    ENV: {
                        name: 'production',
                        apiEndpoint: 'http://api.yoursite.com/'
                    }
                }
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep', 'newer:copy:app']
            },
            html: {
                files: ['<%= yeoman.app %>/**/*.html'],
                tasks: ['newer:copy:app']
            },
            views: {
                files: ['<%= yeoman.app %>/<%= yeoman.views %>/**/*.html'],
                tasks: ['newer:copy:app', 'newer:jshint:all']
            },
            js: {
                files: ['<%= yeoman.app %>/<%= yeoman.scripts %>/**/*.js', '<%= yeoman.app %>/controllers/*.js'],
                tasks: ['newer:copy:app', 'newer:jshint:all']
            },
            styles: {
                files: ['<%= yeoman.app %>/<%= yeoman.styles %>/**/*.css'],
                tasks: ['newer:copy:styles', 'autoprefixer', 'newer:copy:tmp']
            },
            gruntfile: {
                files: ['Gruntfile.js'],
                tasks: ['ngconstant:development', 'newer:copy:app']
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost'
            },
            dist: {
                options: {
                    base: '<%= yeoman.dist %>'
                }
            },
            coverage: {
                options: {
                    port: 9002,
                    open: true,
                    base: ['coverage']
                }
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/<%= yeoman.scripts %>/**/*.js'
            ],
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/unit/**/*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.temp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.temp'
        },

        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.temp/<%= yeoman.styles %>/',
                    src: '{,*/}*.css',
                    dest: '.temp/<%= yeoman.styles %>/'
                }]
            }
        },

        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['<%= yeoman.app %>/index.html'],
                ignorePath: /\.\.\//
            }
        },


        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                staging: '.temp',
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/**/*.html'],
            css: ['<%= yeoman.dist %>/<%= yeoman.styles %>/**/*.css'],
            options: {
                assetsDirs: ['<%= yeoman.dist %>/vendor']
            }
        },

        // The following *-min tasks produce minified files in the dist folder
        cssmin: {
            options: {
                //root: '<%= yeoman.app %>',
                noRebase: true
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true,
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeComments: true, // Only if you don't use comment directives!
                    removeEmptyAttributes: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['*.html', 'templates/**/*.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        ngtemplates: {
            tabletops: {
                cwd: '<%= yeoman.app %>',
                src: '<%= yeoman.views %>/**/*.html',
                dest: '<%= yeoman.dist %>/js/app-tabletops.js',
                options: {
                    htmlmin: '<%= htmlmin.dist.options %>',
                    append: true
                }
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '<%= yeoman.images %>/**/*.{png,jpg,jpeg,gif,webp,svg}',
                        '*.html',
                        //'views/**/*.html',
                        'vendor/**/*',
                        'lib/**/*.{css,js,png,gif,jpg,jpeg,svg}',
                        'fonts/*'
                    ]
                }, {
                    expand: true,
                    cwd: '.temp/<%= yeoman.images %>',
                    dest: '<%= yeoman.dist %>/<%= yeoman.images %>',
                    src: ['generated/*']
                }, {
                    expand: true,
                    cwd: '<%= yeoman.app %>/vendor/',
                    dest: '<%= yeoman.dist %>/js/',
                    src: 'images/*.{png,jpg,jpeg,gif,webp}'
                }, {
                    expand: true,
                    cwd: '<%= yeoman.app %>/',
                    dest: '<%= yeoman.dist %>/css/',
                    src: 'fonts/**/*'
                }]
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/<%= yeoman.styles %>',
                dest: '.temp/<%= yeoman.styles %>/',
                src: '{,*/}*.css'
            },
            libImages: {
                expand: true,
                cwd: '<%= yeoman.app %>/vendor/',
                dest: '<%= yeoman.dist %>/js/',
                src: '**/**/*.{png,jpg,jpeg,gif,webp,svg}'
            },
            resources: {
                expand: true,
                cwd: 'resources/',
                dest: '<%= yeoman.dist %>/resources/',
                src: '**/**/*.png'
            },
            config: {
                expand: true,
                dest: '<%= yeoman.dist %>/',
                src: 'config.xml'
            },
            fonts: {
                expand: true,
                cwd: 'app/lib/ionic/release/fonts/',
                dest: '<%= yeoman.app %>/fonts/',
                src: '*'
            },
            vendor: {
                expand: true,
                cwd: '<%= yeoman.app %>/lib',
                dest: '.temp/<%= yeoman.styles %>/',
                src: '{,*/}*.css'
            },
            app: {
                expand: true,
                cwd: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>/',
                src: [
                    '**/*',
                    '!**/*.(scss,sass,css)',
                ]
            },
            tmp: {
                expand: true,
                cwd: '.temp',
                dest: '<%= yeoman.dist %>/',
                src: '**/*'
            }
        },

        concurrent: {
            ionic: {
                tasks: [],
                options: {
                    logConcurrentOutput: true
                }
            },
            server: [
                'copy:styles',
                'copy:vendor',
                'copy:resources',
                'copy:fonts'
            ],
            test: [
                'copy:styles',
                'copy:vendor',
                'copy:fonts'
            ],
            dist: [
                'copy:styles',
                'copy:vendor',
                'copy:resources',
                'copy:fonts',
                'copy:config'
            ]
        },

        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        // cssmin: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/<%= yeoman.styles %>/main.css': [
        //         '.temp/<%= yeoman.styles %>/**/*.css',
        //         '<%= yeoman.app %>/<%= yeoman.styles %>/**/*.css'
        //       ]
        //     }
        //   }
        // },
        // uglify: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/<%= yeoman.scripts %>/scripts.js': [
        //         '<%= yeoman.dist %>/<%= yeoman.scripts %>/scripts.js'
        //       ]
        //     }
        //   }
        // },
        // concat: {
        //   dist: {}
        // },

        // Test settings
        // These will override any config options in karma.conf.js if you create it.
        karma: {
            options: {
                basePath: '',
                frameworks: ['mocha', 'chai'],
                files: [
                    '<%= yeoman.app %>/lib/angular/angular.js',
                    '<%= yeoman.app %>/lib/angular-mocks/angular-mocks.js',
                    '<%= yeoman.app %>/lib/angular-animate/angular-animate.js',
                    '<%= yeoman.app %>/lib/angular-sanitize/angular-sanitize.js',
                    '<%= yeoman.app %>/lib/angular-ui-router/release/angular-ui-router.js',
                    '<%= yeoman.app %>/lib/ionic/release/js/ionic.js',
                    '<%= yeoman.app %>/lib/ionic/release/js/ionic-angular.js',
                    '<%= yeoman.app %>/<%= yeoman.scripts %>/**/*.js',
                    '<%= yeoman.test %>/mock/**/*.js',
                    '<%= yeoman.test %>/spec/**/*.js'
                ],
                autoWatch: false,
                reporters: ['dots', 'coverage'],
                port: 8080,
                singleRun: false,
                preprocessors: {
                    // Update this if you change the yeoman config path
                    '<%= yeoman.app %>/<%= yeoman.scripts %>/**/*.js': ['coverage']
                },
                coverageReporter: {
                    reporters: [
                        {type: 'html', dir: 'coverage/'},
                        {type: 'text-summary'}
                    ]
                }
            },
            unit: {
                // Change this to 'Chrome', 'Firefox', etc. Note that you will need
                // to install a karma launcher plugin for browsers other than Chrome.
                browsers: ['PhantomJS'],
                background: true
            },
            continuous: {
                browsers: ['PhantomJS'],
                singleRun: true,
            }
        },

        // ngAnnotate tries to make the code safe for minification automatically by
        // using the Angular long form for dependency injection.
        ngAnnotate: {
            options: {
                singleQuotes: true,
            },
            dist: {
                files: [{
                    expand: true,
                    //cwd: '.temp/concat/<%= yeoman.scripts %>',
                    src: '.temp/concat/<%= yeoman.scripts %>/*.js',
                    //src: ['.temp/concat/<%= yeoman.app %>/**/*.js',],
                    dest: '.temp/concat/<%= yeoman.scripts %>'
                }]
            }
        },

        // PhoneGap Build API
        phonegap: {
            config: {
                root: 'www',
                config: 'www/config.xml',
                cordova: '.cordova',
                html : 'index.html', // (Optional) You may change this to any other.html
                path: 'phonegap',
                plugins: ['/local/path/to/plugin', 'http://example.com/path/to/plugin.git'],
                platforms: ['ios', 'android'],
                maxBuffer: 2000, // You may need to raise this for iOS.
                verbose: false,
                releases: 'releases',
                releaseName: function(){
                    var pkg = grunt.file.readJSON('package.json');
                    return(pkg.name + '-' + pkg.version);
                },
                debuggable: false,

                // Must be set for ios to work.
                // Should return the app name.
                name: function(){
                    var pkg = grunt.file.readJSON('package.json');
                    return pkg.name;
                },

                // Add a key if you plan to use the `release:android` task
                // See http://developer.android.com/tools/publishing/app-signing.html
                key: {
                    store: 'release.keystore',
                    alias: 'release',
                    aliasPassword: function(){
                        // Prompt, read an environment variable, or just embed as a string literal
                        return('');
                    },
                    storePassword: function(){
                        // Prompt, read an environment variable, or just embed as a string literal
                        return('');
                    }
                },

                // Set an app icon at various sizes (optional)
                icons: {
                    android: {
                        ldpi: 'icon-36-ldpi.png',
                        mdpi: 'icon-48-mdpi.png',
                        hdpi: 'icon-72-hdpi.png',
                        xhdpi: 'icon-96-xhdpi.png'
                    },
                    wp8: {
                        app: 'icon-62-tile.png',
                        tile: 'icon-173-tile.png'
                    },
                    ios: {
                        icon29: 'icon29.png',
                        icon29x2: 'icon29x2.png',
                        icon40: 'icon40.png',
                        icon40x2: 'icon40x2.png',
                        icon57: 'icon57.png',
                        icon57x2: 'icon57x2.png',
                        icon60x2: 'icon60x2.png',
                        icon72: 'icon72.png',
                        icon72x2: 'icon72x2.png',
                        icon76: 'icon76.png',
                        icon76x2: 'icon76x2.png'
                    }
                },

                // Set a splash screen at various sizes (optional)
                // Only works for Android and IOS
                screens: {
                    android: {
                        ldpi: 'screen-ldpi-portrait.png',
                        // landscape version
                        ldpiLand: 'screen-ldpi-landscape.png',
                        mdpi: 'screen-mdpi-portrait.png',
                        // landscape version
                        mdpiLand: 'screen-mdpi-landscape.png',
                        hdpi: 'screen-hdpi-portrait.png',
                        // landscape version
                        hdpiLand: 'screen-hdpi-landscape.png',
                        xhdpi: 'screen-xhdpi-portrait.png',
                        // landscape version
                        xhdpiLand: 'www/screen-xhdpi-landscape.png'
                    },
                    ios: {
                        // ipad landscape
                        ipadLand: 'screen-ipad-landscape.png',
                        ipadLandx2: 'screen-ipad-landscape-2x.png',
                        // ipad portrait
                        ipadPortrait: 'screen-ipad-portrait.png',
                        ipadPortraitx2: 'screen-ipad-portrait-2x.png',
                        // iphone portrait
                        iphonePortrait: 'screen-iphone-portrait.png',
                        iphonePortraitx2: 'screen-iphone-portrait-2x.png',
                        iphone568hx2: 'screen-iphone-568h-2x.png'
                    }
                },

                // Android-only integer version to increase with each release.
                // See http://developer.android.com/tools/publishing/versioning.html
                versionCode: function(){ return(1); },

                // Android-only options that will override the defaults set by Phonegap in the
                // generated AndroidManifest.xml
                // See https://developer.android.com/guide/topics/manifest/uses-sdk-element.html
                minSdkVersion: function(){ return(10); },
                targetSdkVersion: function(){ return(19); },

                // iOS7-only options that will make the status bar white and transparent
                iosStatusBar: 'WhiteAndTransparent',

                // If you want to use the Phonegap Build service to build one or more
                // of the platforms specified above, include these options.
                // See https://build.phonegap.com/
                remote: {
                    username: 'your_username',
                    password: 'your_password',
                    platforms: ['android', 'blackberry', 'ios', 'symbian', 'webos', 'wp7']
                },

                // Set an explicit Android permissions list to override the automatic plugin defaults.
                // In most cases, you should omit this setting. See 'Android Permissions' in README.md for details.
                permissions: ['INTERNET', 'ACCESS_COURSE_LOCATION', '...']
            }
        }

    });

    // Register tasks for all Cordova commands
    _.functions(cordovaCli).forEach(function (name) {
        grunt.registerTask(name, function () {
            this.args.unshift(name.replace('cordova:', ''));
            // Handle URL's being split up by Grunt because of `:` characters
            if (_.contains(this.args, 'http') || _.contains(this.args, 'https')) {
                this.args = this.args.slice(0, -2).concat(_.last(this.args, 2).join(':'));
            }
            var done = this.async();
            var exec = process.platform === 'win32' ? 'cordova.cmd' : 'cordova';
            var cmd = path.resolve('./node_modules/cordova/bin', exec);
            var flags = process.argv.splice(3);
            var child = spawn(cmd, this.args.concat(flags));
            child.stdout.on('data', function (data) {
                grunt.log.writeln(data);
            });
            child.stderr.on('data', function (data) {
                grunt.log.error(data);
            });
            child.on('close', function (code) {
                code = code ? false : true;
                done(code);
            });
        });
    });

    // Since Apache Ripple serves assets directly out of their respective platform
    // directories, we watch all registered files and then copy all un-built assets
    // over to <%= yeoman.dist %>/. Last step is running cordova prepare so we can refresh the ripple
    // browser tab to see the changes. Technically ripple runs `cordova prepare` on browser
    // refreshes, but at this time you would need to re-run the emulator to see changes.
    grunt.registerTask('ripple', ['wiredep', 'newer:copy:app', 'ripple-emulator']);
    grunt.registerTask('ripple-emulator', function () {
        grunt.config.set('watch', {
            all: {
                files: _.flatten(_.pluck(grunt.config.get('watch'), 'files')),
                tasks: ['newer:copy:app', 'prepare']
            }
        });

        var cmd = path.resolve('./node_modules/ripple-emulator/bin', 'ripple');
        var child = spawn(cmd, ['emulate']);
        child.stdout.on('data', function (data) {
            grunt.log.writeln(data);
        });
        child.stderr.on('data', function (data) {
            grunt.log.error(data);
        });
        process.on('exit', function (code) {
            child.kill('SIGINT');
            process.exit(code);
        });

        return grunt.task.run(['watch']);
    });

    // Dynamically configure `karma` target of `watch` task so that
    // we don't have to run the karma test server as part of `grunt serve`
    grunt.registerTask('watch:karma', function () {
        var karma = {
            files: ['<%= yeoman.app %>/<%= yeoman.scripts %>/**/*.js', '<%= yeoman.test %>/spec/**/*.js'],
            tasks: ['newer:jshint:test', 'karma:unit:run']
        };
        grunt.config.set('watch', karma);
        return grunt.task.run(['watch']);
    });

    // Wrap ionic-cli commands
    grunt.registerTask('ionic', function () {
        var done = this.async();
        var script = path.resolve('./node_modules/ionic/bin/', 'ionic');
        var flags = process.argv.splice(3);
        var child = spawn(script, this.args.concat(flags), {stdio: 'inherit'});
        child.on('close', function (code) {
            code = code ? false : true;
            done(code);
        });
    });

    grunt.registerTask('test', [
        'wiredep',
        'clean',
        'concurrent:test',
        'autoprefixer',
        'karma:unit:start',
        'watch:karma'
    ]);

    grunt.registerTask('serve', function (target) {
        if (target === 'compress') {
            return grunt.task.run(['compress', 'ionic:serve']);
        }

        grunt.config('concurrent.ionic.tasks', ['ionic:serve', 'watch']);
        grunt.task.run(['wiredep', 'init', 'concurrent:ionic']);
    });
    grunt.registerTask('emulate', function () {
        grunt.config('concurrent.ionic.tasks', ['ionic:emulate:' + this.args.join(), 'watch']);
        return grunt.task.run(['init', 'concurrent:ionic']);
    });
    grunt.registerTask('run', function () {
        grunt.config('concurrent.ionic.tasks', ['ionic:run:' + this.args.join(), 'watch']);
        return grunt.task.run(['init', 'concurrent:ionic']);
    });
    grunt.registerTask('build', function () {
        return grunt.task.run(['init', 'ionic:build:' + this.args.join()]);
    });

    grunt.registerTask('init', [
        'clean',
        'ngconstant:development',
        'wiredep',
        'concurrent:server',
        'autoprefixer',
        'newer:copy:app',
        'newer:copy:tmp'
    ]);


    grunt.registerTask('compress', [
        'clean',
        'ngconstant:production',
        'wiredep',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngAnnotate',
        'copy:dist',
        'cssmin',
        'uglify',
        'ngtemplates',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('coverage',
        ['karma:continuous',
            'connect:coverage:keepalive'
        ]);

    grunt.registerTask('default', [
        'wiredep',
        'newer:jshint',
        'karma:continuous',
        'compress'
    ]);

    grunt.loadNpmTasks('grunt-phonegap');
};
