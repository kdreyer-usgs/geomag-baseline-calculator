'use strict';

var LIVE_RELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVE_RELOAD_PORT});

var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {

	// Load grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// App configuration, used throughout
	var appConfig = {
		dev: 'dev',
		dist: 'dist',
		test: 'test',
		tmp: '.tmp'
	};

	// TODO :: Read this from .bowerrc
	var bowerConfig = {
		directory: 'bower_components'
	};

	grunt.initConfig({
		app: appConfig,
		bower: bowerConfig,
		watch: {
			scripts: {
				files: ['<%= app.dev %>/htdocs/js/{,*/}*.js'],
				tasks: ['jshint:scripts', 'mocha_phantomjs'],
			},
			scss: {
				files: ['<%= app.dev %>/htdocs/css/{,*/}*.scss'],
				tasks: ['compass:dev'],
			},
			tests: {
				files: ['<%= app.test %>/*.html', '<%= app.test %>/{,*/}*.js'],
				tasks: ['jshint:tests', 'mocha_phantomjs']
			},
			livereload: {
				options: {
					livereload: LIVE_RELOAD_PORT
				},
				files: [
					'<%= app.dev %>/htdocs/{,*/}*.html',
					'<%= app.dev %>/htdocs/css/{,*/}*.css',
					'<%= app.dev %>/htdocs/js/{,*/}*.js',
					'<%= app.dev %>/htdocs/img/{,*/}*.{png,jpg,jpeg,gif}',
					'.tmp/css/{,*/}*.css'
				]
			}
		},
		connect: {
			options: {
				port: 8080,
				hostname: 'localhost'
			},
			dev: {
				options: {
					base: '<%= app.dev %>/htdocs',
					components: bowerConfig.directory,
					middleware: function (connect, options) {
						return [
							lrSnippet,
							mountFolder(connect, '.tmp'),
							mountFolder(connect, options.components),
							mountFolder(connect, options.base)
						];
					}
				}
			},
			dist: {
				options: {
					base: '<%= app.dist %>/htdocs',
					middleware: function (connect, options) {
						return [
							mountFolder(connect, options.base)
						];
					}
				}
			},
			test: {
				options: {
					base: '<%= app.test %>',
					components: bowerConfig.directory,
					port: 8000,
					middleware: function (connect, options) {
						return [
							mountFolder(connect, '.tmp'),
							mountFolder(connect, 'bower_components'),
							mountFolder(connect, 'node_modules'),
							mountFolder(connect, options.base),
							mountFolder(connect, appConfig.dev + '/htdocs/js')
						];
					}
				}
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: ['Gruntfile.js'],
			scripts: ['<%= app.dev %>/htdocs/js/{,*/}*.js'],
			tests: ['<%= app.test %>/spec/{,*/}*.js']
		},
		compass: {
			dev: {
				options: {
					sassDir: '<%= app.dev %>/htdocs/css',
					cssDir: '<%= app.tmp %>/css',
					environment: 'development'
				}
			}
		},
		mocha_phantomjs: {
			all: {
				options: {
					urls: [
						'http://localhost:<%= connect.test.options.port %>/index.html'
					]
				}
			}
		},
		open: {
			server: {
				path: 'http://localhost:<%= connect.options.port %>'
			},
			test: {
				path: 'http://localhost:%<%= connect.dev.options.port %>'
			}
		},
		clean: {
			dist: ['<%= app.dist %>/*'],
			dev: ['<%= app.tmp %>', '.sass-cache']
		}
	});

	grunt.registerTask('build', [
		'clean:dist',
	]);

	grunt.registerTask('develop', [
		'clean:dist',
		'connect:dev',
		'connect:test',
		'open:server',
		'watch'
	]);

	grunt.registerTask('default', [
		'jshint'/*,
		'test',
		'build'*/
	]);
};