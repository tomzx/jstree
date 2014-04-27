/*global module:false, require:false, __dirname:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: [
          'src/jstree._bootstrap.js',
          'src/jstree._helpers.js',
          'src/jstree.defaults.core.js',
          'src/jstree.core.js',
          'src/jstree.prototype.js',
          'src/core/*.js',
          'src/plugins/jstree.*.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    copy: {
      libs: {
        files: [
          { expand: true, cwd: 'libs/', src: ['*'], dest: 'dist/libs/' }
        ]
      },
      docs: {
        files: [
          { expand: true, cwd: 'dist/', src: ['**/*'], dest: 'docs/assets/dist/' }
        ]
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> - (<%= _.pluck(pkg.licenses, "type").join(", ") %>) */\n',
        preserveComments: false,
        //sourceMap: "dist/jstree.min.map",
        //sourceMappingURL: "jstree.min.map",
        report: "min",
        beautify: {
                ascii_only: true
        },
        compress: {
                hoist_funs: false,
                loops: false,
                unused: false
        }
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      options: {
        'boss': true,
        'browser': true,
        'curly': true,
        'expr': true,
        'eqeqeq': true,
        'eqnull': true,
        'latedef': true,
        'newcap': true,
        'noarg': true,
        'sub': true,
        'trailing': true,
        'undef': true,
        'globals': {
          'console': true,
          'jQuery': true,
          'browser': true,
          'XSLTProcessor': true,
          'ActiveXObject': true,
        }
      },
      beforeconcat: ['src/jstree.*.js', 'src/plugins/jstree.*.js'],
      afterconcat: ['dist/jstree.js']
    },
    dox: {
      files: {
        src: ['src/*.js'],
        dest: 'docs'
      }
    },
    less: {
      production: {
        options: {
          cleancss: true,
          compress: true
        },
        files: {
          "dist/themes/default/style.min.css": "src/themes/default/style.less"
        }
      },
      development: {
        files: {
          "src/themes/default/style.css": "src/themes/default/style.less",
          "dist/themes/default/style.css": "src/themes/default/style.less"
        }
      }
    },
    watch: {
      js: {
        files: ['src/**/*.js'],
        tasks: ['js'],
        options: {
          atBegin: true
        }
      },
      css: {
        files: ['src/**/*.less','src/**/*.png','src/**/*.gif'],
        tasks: ['css'],
        options: {
          atBegin: true
        }
      },
    },
    imagemin: {
      dynamic: {
        options: {                       // Target options
          optimizationLevel: 7,
          pngquant: true
        },
        files: [{
          expand: true,                  // Enable dynamic expansion
          cwd:  'src/themes/default/',    // Src matches are relative to this path
          src: ['**/*.{png,jpg,gif}'],   // Actual patterns to match
          dest: 'dist/themes/default/'   // Destination path prefix
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-imagemin');

  grunt.registerMultiTask('dox', 'Generate dox output ', function() {
    var exec = require('child_process').exec,
        path = require('path'),
        done = this.async(),
        doxPath = path.resolve(__dirname),
        formatter = [doxPath, 'node_modules', '.bin', 'dox'].join(path.sep);
    exec(formatter + ' < "dist/jstree.js" > "docs/jstree.json"', {maxBuffer: 5000*1024}, function(error, stout, sterr){
      if (error) {
        grunt.log.error(formatter);
        grunt.log.error("WARN: "+ error);
      }
      if (!error) {
        grunt.log.writeln('dist/jstree.js doxxed.');
        done();
      }
    });
  });

  // Default task.
  grunt.registerTask('default', ['jshint:beforeconcat','concat','jshint:afterconcat','copy:libs','uglify','less','imagemin','copy:docs','qunit','dox']);
  grunt.registerTask('js', ['concat','uglify']);
  grunt.registerTask('css', ['copy','less']);

};
