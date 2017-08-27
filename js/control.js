



var mousePosition = { x : -10000, y : -10000};

var scenes = [];

var musicOn = true;

var images = [];
var sounds = [];
var loadedAssets = 0;

var assetCount = 0;
var loadingImages = true;

var imageSources;
var soundSources;


var percentLoaded = 0;

var blurType = 0;

var mindLabs = null;

var backGroundGradient = null;

var siteStructure = null;

// Control variables 
var start = function(){
		
	loadJSON("description.json", loadJSONOK, loadJSONError);

	setCanvasWidthAndHeight();

	backGroundGradient = context.createRadialGradient(canvas.width / 2,canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
	backGroundGradient.addColorStop(0,"#AAAAFF");
	backGroundGradient.addColorStop(1,"black");
	

	initLoader();

	requestAnimationFrame(mainLoop);

}

function loadJSONOK(data){
	siteStructure = data;
	// calculate longest string
	var longestString = "";
	var topRight = siteStructure.mobile.top_right;
	for (var i = 0; i < topRight.text.length; i++){
		if (topRight.text[i].length > longestString.length){
			longestString = topRight.text[i];
		}
	}
	topRight.x = 0;
	topRight.y = 0;
	topRight.width = 0;
	topRight.height = 0;
	topRight.hover = false;
	var topLeft = siteStructure.mobile.top_left;
	for (var i = 0; i < topLeft.text.length; i++){
		if (topLeft.text[i].length > longestString.length){
			longestString = topLeft.text[i];
		}
	}
	topLeft.x = 0;
	topLeft.y = 0;
	topLeft.width = 0;
	topLeft.height = 0;
	topLeft.hover = false;
	var bottomRight = siteStructure.mobile.bottom_right;
	for (var i = 0; i < bottomRight.text.length; i++){
		if (bottomRight.text[i].length > longestString.length){
			longestString = bottomRight.text[i];
		}
	}
	bottomRight.x = 0;
	bottomRight.y = 0;
	bottomRight.width = 0;
	bottomRight.height = 0;
	bottomRight.hover = false;
	var bottomLeft = siteStructure.mobile.bottom_left;
	for (var i = 0; i < bottomLeft.text.length; i++){
		if (bottomLeft.text[i].length > longestString.length){
			longestString = bottomLeft.text[i];
		}
	}
	bottomLeft.x = 0;
	bottomLeft.y = 0;
	bottomLeft.width = 0;
	bottomLeft.height = 0;	
	bottomLeft.hover = false;
	siteStructure.longestString = longestString;
}

function loadJSONError(xhr){
	// fallback to hardcoded data
	console.log(xhr);
}

function loadJSON(path, success, error){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

function setCanvasWidthAndHeight(){
	//var windowRatio = window.innerWidth / window.innerHeight;
	//if (windowRatio > aspectRatio){
		// height guides aspect ratio
		canvas.height = window.innerHeight;
	//	canvas.width = canvas.height * aspectRatio;
	//}else{
		// width guides aspect ratio
		canvas.width = window.innerWidth;
	//	canvas.height = canvas.width / aspectRatio;
	//}
}

var touch = false;
var startTouchMusic = false;

document.onmousemove = function(event){
	if (!touch){
		event = event || window.event;
		var deltaX = event.clientX - mousePosition.x;
		var deltaY = event.clientY - mousePosition.y;
		var rect = canvas.getBoundingClientRect();	
		mousemove(event.clientX - rect.left, event.clientY - rect.top);		
	}
}

document.ontouchstart = function(event){
	if (!touch){
		startTouchMusic = true;
	}
	touch = true;
	event = event || window.event;
	var deltaX = event.clientX - mousePosition.x;
	var deltaY = event.clientY - mousePosition.y;
	var rect = canvas.getBoundingClientRect();	
	mousemove(event.changedTouches[0].clientX - rect.left, event.changedTouches[0].clientY - rect.top);	
}

document.ontouchmove = function(event){
	event = event || window.event;
	var deltaX = event.clientX - mousePosition.x;
	var deltaY = event.clientY - mousePosition.y;
	var rect = canvas.getBoundingClientRect();	
	mousemove(event.changedTouches[0].clientX - rect.left, event.changedTouches[0].clientY - rect.top);	
	event.preventDefault();
	event.stopPropagation();
}

document.ontouchend = function(event){
	click();
	event.preventDefault();
}

function mousemove(x, y){
	mousePosition.x = x;
	mousePosition.y = y;
}

// Called when mouse is held up 
function canvasMouseUp(){
	click();
}

