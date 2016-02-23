"use strict";

module.exports = function(grunt) {
  // Show tasks' elapsed time
  require("time-grunt")(grunt);
  // Auto-load Grunt tasks
  require("load-grunt-tasks")(grunt);

  // Grunt config
  grunt.initConfig({
    // Import package metadata
    pkg: grunt.file.readJSON("package.json"),

    // Shell
    shell: {
      setup: {
        command: "bower install && bundle install"
      },
      jekyllBuild: {
        command: "bundle exec jekyll build --config=_config.yml,_config.dev.yml"
      },
      jekyllServe: {
        command: "bundle exec jekyll serve --config=_config.yml,_config.dev.yml"
      }
    },

    // Libsass
    sass: {
      options: {
        sourceMap: false,
        outputStyle: "expanded"
      },
      dist: {
        files: {
          "assets/css/style.css": "assets/sass/style.scss"
        }
      }
    },

    // Minify *.css
    cssmin: {
      options: {
        sourceMap: true
      },
      target: {
        files: [{
          expand: true,
          cwd: "assets/css",
          src: [
            "*.css",
            "!*.min.css"
          ],
          dest: "assets/css",
          ext: ".min.css"
        }]
      }
    },

    // Concatenate files
    concat: {
      dist: {
        src: [
          "assets/js/libs.js", // Loads first and tests for any required dependencies
          "assets/js/**/*.js",
          "!assets/js/**/script.js",
          "!assets/js/**/*.min.js",
          "!assets/js/**/*.js.map"
        ],
        dest: "assets/js/script.js"
      }
    },

    // Uglify script.js
    uglify: {
      options: {
        sourceMap: true
      },
      my_target: {
        files: {
          "assets/js/script.min.js" : ["assets/js/script.js"]
        }
      }
    },

    // Watch for changes
    watch: {
      sass: {
        files: ["assets/sass/**/*.scss"],
        tasks: ["sass"]
      },
      cssmin: {
        files: [
          "assets/css/**/*.css",
          "!assets/css/**/*.min.css",
          "!assets/css/**/*.map"
        ],
        tasks: ["cssmin"]
      },
      concat: {
        files: [
          "assets/js/libs.js",
          "assets/js/**/*.js",
          "!assets/js/**/script.js",
          "!assets/js/**/*.min.js",
          "!assets/js/**/*.js.map"
        ],
        tasks: ["concat"]
      },
      uglify: {
        files: [
          "assets/js/script.js",
          "!assets/js/script.min.js",
          "!assets/js/script.js.map"
        ],
        tasks: ["uglify"]
      }
    },

    // Concurrent
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      serve: [
        "sass",
        "cssmin",
        "concat",
        "uglify",
        "watch",
        "shell:jekyllServe"
      ]
    },

    // Other task(s) configuration
  });

  // Tasks

  // Setup
  // > bower & bundle install
  // > sass
  // > minify css
  // > concat *.js
  // > uglify script.js
  grunt.registerTask("setup", [
    "shell:setup",
    "sass",
    "cssmin",
    "concat",
    "uglify"
  ]);

  // Build
  // > concurrent:build
  grunt.registerTask("build", [
    "setup",
    "shell:jekyllBuild"
  ]);

  // Serve
  // > concurrent:serve
  grunt.registerTask("serve", [
    "concurrent:serve"
  ]);

  // Default
  grunt.registerTask("default", [
      "setup",
      "concurrent:serve"
  ]);
}