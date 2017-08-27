
var canvas = document.getElementById("designbox");
var context = canvas.getContext("2d");

var DEPLOY_TIME = 2; // seconds

var DEFAULT_RAY_DURATION = 0.4;
var DEFAULT_TIME_TO_LIGHTNING = 0.04;
var LIGHTNING_DISTANCE_THRESHOLD = 200;

var RAY_WIDTH = 1;
var VERTEX_FONT_FAMILY = "Fira Sans";

var DEFAULT_TIME_FOR_REVEAL = 0.8;

var INITIAL_CIRCLES_WIDTH = 12;

// Minidlabs random distortion
var TIME_TO_EVAL_DISTORTION = 2; // seconds
var MINDLABS_DISTORTION_PROBABILITY = 0.1; 


// Responsive thresholds
var MOBILE_THRESHOLD = 500; // width pixels


// vertex letters glitching control
var LETTER_GLITCH_PROBABILITY = 0.0004; // tested every frame (!)
var LETTER_GLITCH_TIME = 0.6; // seconds

// logos
var LOGO_SPEED = 40; // pixels per second

// content pages

var MAIN_POINT_X = 0.1; // of canvas width
var MAIN_POINT_Y = 0.1; // of canvas height
var RETRACTION_TIME = 1; // seconds

var MINI_VERSION_PROPORTION_X = 0.3; // fraction of screen 
var MINI_VERSION_PROPORTION_Y = 0.3; // fraction of screen
var MINI_VERSION_TOP_MARGIN = 0.1;
var MINI_VERSION_LEFT_MARGIN = 0.05;


var CONTENT_TOP_POSITION = 0.15; // fraction of screen 
var CONTENT_LEFT_POSITION = 0.1; // fraction of screen
var CONTENT_WIDTH = 0.3; // fraction of screen 
var CONTENT_HEIGHT = 0.7; // fraction of screen

var CONTENT_OPACITY_GAIN_SPEED = 0.6;
var CONTENT_MAXIMUM_OPACITY = 0.95;

// Backbutton
var BACKBUTTON_POSITION_X = 0.05;
var BACKBUTTON_POSITION_Y = 0.05;
var BACKBUTTON_RADIUS = 10;


