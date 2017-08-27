
function draw() {

	var lastCanvasWidth = canvas.width;
	var lastCanvasHeight = canvas.height;

	setCanvasWidthAndHeight();

	if ((canvas.width != lastCanvasWidth) || (canvas.height != lastCanvasHeight)){
		resize(canvas.width / lastCanvasWidth, canvas.height / lastCanvasHeight);
	}

	context.clearRect(0, 0, canvas.width, canvas.height);
	drawBackground(context);
	drawDesign(context);

}

function drawBackground(context){
	context.fillStyle = "black";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = backGroundGradient;
	context.globalAlpha = 0.2;
	context.fillRect(0, 0, canvas.width, canvas.height);
}

var vertex = [];
var links = [];
var backgroundPoints = [];
var lightning = [];
var logos = [];

LinkStyleEnum = {
	SOLID : 0,
	DOTTED : 1,
	DASHED : 2
}

ShapeTypeEnum = {
	CIRCLE : 0,
	TRIANGLE : 1,
	SQUARE : 2,
	RING : 3
}

Ray = function(){
	this.timeLeft = DEFAULT_RAY_DURATION;
}

Ray.prototype.draw = function(context){
	context.lineWidth = RAY_WIDTH;
	context.globalAlpha = 0.2;
	context.strokeStyle = "white";
	context.beginPath();
	context.moveTo(this.bp1.x, this.bp1.y);
	context.lineTo(this.bp2.x, this.bp2.y);
	context.stroke();
	context.closePath();
}

Ray.prototype.update = function(delta){
	this.timeLeft -= delta;
}

DiagramStateEnum = {
	LOADING : 0,
	DEPLOYING : 1,
	ANIMATION : 2,
	RETRACTING : 3,
	DEPLOYING_TO_CONTENT_PAGE : 4,
	DEPLOYING_TO_ANIMATION : 5,

}

var state = DiagramStateEnum.LOADING;

function resize(widthRatio, heightRatio){
	for (var i = 0; i < vertex.length; i++){
		vertex[i].resize(widthRatio, heightRatio);
	}
	for (var i = 0; i < links.length; i++){
		links[i].resize(widthRatio, heightRatio);
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		backgroundPoints[i].resize(widthRatio, heightRatio);
	}
	if (mindLabs != undefined && mindLabs != null){
		mindLabs.resize(widthRatio, heightRatio);
	}
}

BackgroundPoint = function(x, y, radius, context){
	this.state = DiagramStateEnum.DEPLOYING;

	this.centerX = this.x;
	this.centerY = this.y;
	this.speedX = randomUniformDistribution(-5, 5); // pixels per second
	this.speedY = randomUniformDistribution(-5, 5); // pixels per second
	this.accelerationX = 0;
	this.accelerationY = 0;
	this.radius = radius;
	this.gradient = context.createRadialGradient(0, 0, 0, 0, 0, this.radius);
	this.gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
	this.gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
	this.gradient.addColorStop(0.31, 'rgba(255, 255, 255, 0.1)');
	this.gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

	this.lightningMarked = false;
	this.propagateLightning = false;
	this.timeToLightning = -1;

	this.distances = [];
	this.targetBPs = [];
}

BackgroundPoint.prototype.resize = function(widthRatio, heightRatio){
	this.targetX *= widthRatio;
	this.targetY *= heightRatio;
	this.centerX *= widthRatio;
	this.centerY *= heightRatio;
	this.x *= widthRatio;
	this.y *= heightRatio;
}

BackgroundPoint.prototype.update = function(delta, elapsedTime){
	switch(this.state){
		case DiagramStateEnum.DEPLOYING:
			var previousX = this.speedX;
			var previousY = this.speedY;
			this.speedX += this.accelerationX * delta;
			this.speedY += this.accelerationY * delta;
			this.x += this.speedX * delta;
			this.y += this.speedY * delta;
			if (previousX * this.speedX < 0 || previousY * this.speedY < 0){ // change sign
				this.state = DiagramStateEnum.ANIMATION;
				this.speedX = randomUniformDistribution(-5, 5);
				this.speedY = randomUniformDistribution(-5, 5);
			}
			break;
		case DiagramStateEnum.ANIMATION:
			this.x += this.speedX * delta;
			this.y += this.speedY * delta;

			if (this.speedX > 0 && (this.x > this.centerX + 2 * this.radius)){
				this.speedX *= -1;
			}else if (this.speedX < 0 && (this.x < this.centerX - 2 * this.radius)){
				this.speedX *= -1;
			}
			if (this.speedY > 0 && (this.y > this.centerY + 2 * this.radius)){
				this.speedY *= -1;
			}else if (this.speedY < 0 && (this.y < this.centerY - 2 * this.radius)){
				this.speedY *= -1;
			}

			if (this.timeToLightning > 0){
				this.timeToLightning -= delta;
				if (this.timeToLightning <= 0){
					this.propagateLightning = true;
				}
			}
			if (this.propagateLightning){
				var marked = 0;
				for (var j = 0; j < backgroundPoints.length; j++){
					var bp = backgroundPoints[j];
					if (this != bp && !bp.lightningMarked){
						var d = dist(this.x, this.y, bp.x, bp.y);
						if (marked < 2){
							this.distances[marked] = d;
							this.targetBPs[marked] = bp;
							marked++;
						}else{
							for (var q = 0; q < this.targetBPs.length; q++){
								if (this.distances[q] > d){
									var temp = this.distances[q];
									this.distances[q] = d;
									d = temp;
									var tempBP = this.targetBPs[q];
									this.targetBPs[q] = bp;
									bp = tempBP;
								}
							}
						}
					}
				}
				if (marked == 0){
					// finished. mark, maybe?
				}else{
					for (var q = 0; q < marked; q++){
						if (this.distances[q] < LIGHTNING_DISTANCE_THRESHOLD){
							var targetBP = this.targetBPs[q];
							targetBP.timeToLightning = DEFAULT_TIME_TO_LIGHTNING;
							targetBP.lightningMarked = true;
							var r = new Ray();
							r.bp1 = this;
							r.bp2 = targetBP;
							lightning.push(r);			
						}	
					}			
				}
				this.propagateLightning = false;
			}
			break;
	}
}

BackgroundPoint.prototype.draw = function(conext){
	context.fillStyle = "white";	
	//context.translate(this.x, this.y);
	context.beginPath();
	context.globalAlpha = 0.05;
	context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
	context.fill();
	context.closePath();
	context.beginPath();
	context.globalAlpha = 0.6;
	context.arc(this.x, this.y, this.radius * 0.3, 0, 2*Math.PI);
	context.fill();
	context.closePath();
	context.globalAlpha = 1;
	//context.translate(-this.x, -this.y);
	//context.restore();
}


Link = function(){

}

Link.prototype.resize = function(widthRatio, heightRatio){

}

Link.prototype.draw = function(context){
	context.globalAlpha = 0.3;
	context.beginPath();
	context.lineWidth = 1;
	context.strokeStyle = "white";
	switch(this.style){
		case LinkStyleEnum.SOLID:
			context.setLineDash([]);
			break;
		case LinkStyleEnum.DOTTED:
			context.setLineDash([1,8]);
			break;
		case LinkStyleEnum.DASHED:
			context.setLineDash([4,10]);
			break;
	}	

	context.moveTo(this.v1.drawX, this.v1.drawY);
	context.lineTo(this.v2.drawX, this.v2.drawY);
	context.closePath();
	context.stroke();
}

var fontSize = 30;

Vertex = function(x, y, size){
	this.state = DiagramStateEnum.DEPLOYING;
	this.shape = ShapeTypeEnum.CIRCLE;
	this.speedX = randomUniformDistribution(-5, 5); // pixels per second
	this.speedY = randomUniformDistribution(-5, 5); // pixels per second
	this.accelerationX = 0;
	this.accelerationY = 0;
	this.x = canvas.width / 2;
	this.y = canvas.height / 2;
	this.size = size;

	this.poleX = x;
	this.poleY = y;
	this.backupPoleX = this.poleX;
	this.backupPoleY = this.poleY;
	
	this.poleWidth = size;

	this.hover = false;

	// Linss of text
	this.lines = [];
	this.displayLines = [];

	this.fontSize = fontSize;
	this.fontFamily = VERTEX_FONT_FAMILY;

	this.revealedCharacters = 0;
	this.revealedLines = 0;
	this.totalChars = 0;

	this.url = "";

	this.glitching = false;

	this.positions = [{x : -10000, y : -10000}, {x : -10000, y : -10000}, {x : -10000, y : -10000}, {x : -10000, y : -10000}];
}

Vertex.prototype.resize = function(widthRatio, heightRatio){
	this.x *= widthRatio;
	this.y *= heightRatio;
	this.poleX *= widthRatio;
	this.poleY *= heightRatio;
}

Vertex.prototype.addTextLine = function(t){
	this.lines.push(t);
	this.displayLines.push(t);
	this.totalChars += t.length;
}

Vertex.prototype.measureLongestText = function(){
	context.font = this.fontSize + "px " + this.fontFamily;
	this.longestText = 0;
	for (var i = 0; i < this.lines.length; i++){
		var lineLength = context.measureText(this.lines[i]).width;
		if (lineLength > this.longestText){
			this.longestText = lineLength;
		}
	}
}

var GETAWAY_ACCELERATION = 15;
var MAX_ACCELERATION = 70;
var STATIC_CENTER_ACCELERATION = 10;
var MAX_SPEED = 10;

Vertex.prototype.update = function(delta){
	switch(this.state){
		case DiagramStateEnum.LOADING:	
			this.speedX += this.accelerationX * delta;
			this.speedY += this.accelerationY * delta;
			this.x += this.speedX * delta;
			this.y += this.speedY * delta;
			break;
		case DiagramStateEnum.DEPLOYING:
			var previousSpeedX = this.speedX;
			var previousSpeedY = this.speedY;
			this.speedX += this.accelerationX * delta;
			this.speedY += this.accelerationY * delta;
			this.x += (this.speedX + previousSpeedX) * 0.5 * delta;
			this.y += (this.speedY + previousSpeedY) * 0.5 * delta;
			if (previousSpeedX * this.speedX < 0 || previousSpeedY * this.speedY < 0){ // change sign
				this.state = DiagramStateEnum.ANIMATION;
				this.speedX = randomUniformDistribution(-5, 5);
				this.speedY = randomUniformDistribution(-5, 5);
			}
			break;
		case DiagramStateEnum.ANIMATION:
			if (state == DiagramStateEnum.ANIMATION){
				if (this.lines.length > 0){
					var isHovering = (dist(this.x, this.y, mousePosition.x, mousePosition.y) < this.size * 2);
					if (!this.hover && isHovering){
						this.revealedCharacters = 0;
						this.revealedLines = 0;
						this.timeToNextReveal = DEFAULT_TIME_FOR_REVEAL / this.totalChars;
					}
					if (this.hover){
						if (this.revealedLines < this.displayLines.length){
							this.timeToNextReveal -= delta;
							if (this.timeToNextReveal <= 0){
								this.timeToNextReveal = DEFAULT_TIME_FOR_REVEAL / this.totalChars;
								this.revealedCharacters++;
								if (this.displayLines[this.revealedLines].length == this.revealedCharacters){
									this.revealedLines++;
									this.revealedCharacters = 0;
								}

							}
						}
						this.shuffleDisplayText();
					}
					this.hover = isHovering;
				}

				if (this.glitching){
					for (var i = this.positions.length - 1; i > 0; i--){
						this.positions[i].x = this.positions[i - 1].x;
						this.positions[i].y = this.positions[i - 1].y;		
					}

					this.timeToNextEvent += delta;
					if (this.timeToNextEvent >= this.events[this.currentEvent].time){
						this.currentEvent++;
						this.timeToNextEvent = 0;
						if (this.currentEvent == this.events.length){
							this.glitching = false;
							return;
						}
					}

					switch(this.events[this.currentEvent].type){
						case DistortionEventTypeEnum.DISSAPEAR:
							this.positions[0].x = canvas.width + 500;
							this.positions[0].y = canvas.height + 500;				
							break;
						case DistortionEventTypeEnum.APPEAR:			
							this.positions[0].x = this.x + 10;
							this.positions[0].y = this.y + 10;	
							break;
						case DistortionEventTypeEnum.RANDOM_MOVE:
							this.positions[0].x = this.x + 10 + randomUniformDistribution(0,10);
							this.positions[0].y = this.y + 10 + randomUniformDistribution(0,10);
							break;
					}
				}
			}

			if (!this.hover){
				var accelerationX = randomUniformDistribution(-MAX_ACCELERATION, MAX_ACCELERATION); // instant acceleration is random
				var accelerationY = randomUniformDistribution(-MAX_ACCELERATION, MAX_ACCELERATION); // instant acceleration is random
				if (Math.abs(this.x - this.poleX) > this.poleWidth){
					if (this.x > this.poleX){
						accelerationX = -GETAWAY_ACCELERATION;
					}else{
						accelerationX = GETAWAY_ACCELERATION;
					}	
				}
				if (Math.abs(this.y - this.poleY) > this.poleWidth){
					if (this.y > this.poleY){
						accelerationY = -GETAWAY_ACCELERATION;
					}else{
						accelerationY = GETAWAY_ACCELERATION;
					}	
				}
				// center pull
				if (this.y > this.poleY){
					accelerationY -= STATIC_CENTER_ACCELERATION;
				}else{
					accelerationX += STATIC_CENTER_ACCELERATION;
				}
				if (this.x > this.poleX){
					accelerationX -= STATIC_CENTER_ACCELERATION;
				}else{
					accelerationY += STATIC_CENTER_ACCELERATION;
				}
				this.speedX += delta * accelerationX;
				this.speedX = this.speedX > MAX_SPEED? MAX_SPEED : this.speedX;
				this.speedY += delta * accelerationY;
				this.speedY = this.speedY > MAX_SPEED? MAX_SPEED : this.speedY;

				this.x += this.speedX * delta;
				this.y += this.speedY * delta;

				if (state == DiagramStateEnum.ANIMATION)
					if (!this.glitching){
						if (randomUniformDistribution(0,1) < LETTER_GLITCH_PROBABILITY){
							this.glitching = true;
							
							this.reorderDisplayText();

							this.events = [];
							this.events.push({ time : randomUniformDistribution(0.1,0.3), type : DistortionEventTypeEnum.RANDOM_MOVE});	
							this.events.push({ time : randomUniformDistribution(0.2,0.5), type : DistortionEventTypeEnum.DISSAPEAR});
							this.events.push({ time : randomUniformDistribution(0.1,0.3), type : DistortionEventTypeEnum.RANDOM_MOVE});
							this.timeToNextEvent = 0;
							this.currentEvent = 0;
						}
					}

			}
			break;
	}
}

Vertex.prototype.shuffleDisplayText = function(){
	var firstLine = true;
	for (var i = 0; i < this.displayLines.length; i++){
		this.displayLines[i] = this.lines[i];
		if (i >= this.revealedLines){
			var startIndex = 0;
			if (i == this.revealedLines)
				startIndex = this.revealedCharacters;
			for (var j = startIndex; j < this.displayLines[i].length; j++){
				this.displayLines[i] = this.displayLines[i].replaceAt(j,randomChar());				
			}			
		}

	}
}

Vertex.prototype.reorderDisplayText = function(){
	for (var i = 0; i < this.displayLines.length; i++){
		this.displayLines[i] = this.lines[i];
	}
}

Vertex.prototype.draw = function(context){ 
	context.globalAlpha = 1;
	context.fillStyle = "white";
	context.save();
	context.beginPath();
	switch(this.shape){
		case ShapeTypeEnum.CIRCLE:
			if (this.state == DiagramStateEnum.DEPLOYING && this.rotate){
				var distanceToPole = dist(this.x, this.y, this.poleX, this.poleY);
				var distanceOriginPole = dist(this.rotationStartX, this.rotationStartY, this.poleX, this.poleY);
				this.fraction = distanceToPole / distanceOriginPole;
				context.translate(this.poleX, this.poleY);
				var rotation = this.rotation * (1 - this.fraction);
				context.rotate(rotation);
				context.arc(this.x - this.poleX, this.y - this.poleY, this.size / 2, 0, 2*Math.PI);
				context.translate(-this.poleX, -this.poleY);				
				context.fill();
				this.drawX = this.poleX + (this.x - this.poleX) * Math.cos(rotation) - (this.y - this.poleY) * Math.sin(rotation);
				this.drawY = this.poleY + (this.x - this.poleX) * Math.sin(rotation) + (this.y - this.poleY) * Math.cos(rotation);				
			}else{
				this.drawX = this.x;
				this.drawY = this.y;				
				context.arc(this.x, this.y, this.size / 2, 0, 2*Math.PI);
				context.fill();
			}
			break;
		case ShapeTypeEnum.SQUARE:
			var halfSize = this.size / 2;
			context.translate(this.x, this.y);
			context.rotate(this.rotation);
			context.moveTo(- halfSize, - halfSize);
			context.lineTo(halfSize, - halfSize);
			context.lineTo(halfSize, halfSize);
			context.lineTo(- halfSize, halfSize);
			context.lineTo(- halfSize, - halfSize);
			context.translate(- this.x, -this.y);
			context.fill();
			break;
		case ShapeTypeEnum.RING:
			context.arc(this.x, this.y, this.size, 0, 2*Math.PI);
			context.arc(this.x, this.y, this.size - this.ringWidth, 0, 2*Math.PI);
			context.fill();
			break;
		case ShapeTypeEnum.TRIANGLE:
			var halfSize = this.size / 2;
			var cos30 = Math.cos(Math.PI/6);
			var sin30 = Math.sin(Math.PI/6);
			context.translate(this.x, this.y);
			context.rotate(this.rotation);
			context.moveTo(0, -halfSize);
			context.lineTo(cos30 * halfSize, sin30 * halfSize);
			context.lineTo(-cos30 * halfSize, sin30 * halfSize);
			context.lineTo(0, -halfSize);
			context.translate(- this.x, -this.y);
			context.fill();
			break;
	}
	context.closePath();
	context.restore();

	if (this.state == DiagramStateEnum.ANIMATION && state == DiagramStateEnum.ANIMATION){
		if (this.hover || this.glitching){
			context.font = this.fontSize + "px " + this.fontFamily;
			context.textAlign = "left";
			context.textBaseline = "top";
			this.measureLongestText();
			var xPosition = this.x + this.size * 2;
			if (this.x + this.size * 2 + this.longestText > canvas.width){
				xPosition = this.x - this.longestText - this.size;
			}
			var yPosition = this.y + this.size * 2;
			if (this.y + this.size * 2 + (this.fontSize + 1) * (this.displayLines.length - 1) > canvas.height){
				yPosition = this.y - this.size - (this.fontSize + 1) * (this.displayLines.length);
			}
		}
		if (this.hover){
			for (var i = 0; i < this.displayLines.length; i++){
				drawMulticolorText(this.displayLines[i], xPosition, yPosition + i * (this.fontSize + 1), (this.glitching? 0.2 : 1));
			}
		}else if (this.glitching){
			for (var i = this.positions.length - 1; i >= 0 ; i--){
				switch(i){
					case 0:
						context.globalAlpha = 0.7;
						context.fillStyle = "white";
						break;
					case 1:
						context.globalAlpha = 0.3;
						context.fillStyle = "red";
						break;
					case 2:
						context.globalAlpha = 0.3;
						context.fillStyle = "green";
						break;
					case 3:
						context.globalAlpha = 0.3;
						context.fillStyle = "blue";
						break;
				}
				for (var j = 0; j < this.displayLines.length; j++){
					context.fillText(this.displayLines[j], this.positions[i].x, this.positions[i].y + j * (this.fontSize + 1));
				}
				
			}
			context.globalAlpha = 1;
		}
	}
}

LogoStateEnum = {
	DEPLOYING : 0,
	ANIMATION : 1
}

Logo = function(){
	this.targetY = 0;
	this.y = 0;
	this.image = 0;
	this.xSpeed = LOGO_SPEED * (randomBoolean()? 1 : -1);
	this.ySpeed = -1 * LOGO_SPEED;
	this.x = 0;
	this.hover = false;
	this.width = 0;
	this.height = 0;
	this.state = LogoStateEnum.DEPLOYING;
	this.radius = 10;
}

Logo.prototype.update = function(delta){
	switch(this.state){
		case LogoStateEnum.DEPLOYING:
			if (this.y > this.targetY){
				this.y += this.ySpeed * delta;
			}else{
				this.state = LogoStateEnum.ANIMATION;
			}
			break
		case LogoStateEnum.ANIMATION:
			var accelerationX = randomUniformDistribution(-MAX_ACCELERATION, MAX_ACCELERATION); // instant acceleration is random
			var accelerationY = randomUniformDistribution(-MAX_ACCELERATION, MAX_ACCELERATION); // instant acceleration is random
			if (Math.abs(this.x - this.targetX) > this.radius){
				if (this.x > this.targetX){
					accelerationX = -GETAWAY_ACCELERATION;
				}else{
					accelerationX = GETAWAY_ACCELERATION;
				}	
			}
			if (Math.abs(this.y - this.targetY) > this.radius){
				if (this.y > this.targetY){
					accelerationY = -GETAWAY_ACCELERATION;
				}else{
					accelerationY = GETAWAY_ACCELERATION;
				}	
			}
			// center pull
			if (this.y > this.targetY){
				accelerationY -= STATIC_CENTER_ACCELERATION;
			}else{
				accelerationX += STATIC_CENTER_ACCELERATION;
			}
			if (this.x > this.targetX){
				accelerationX -= STATIC_CENTER_ACCELERATION;
			}else{
				accelerationY += STATIC_CENTER_ACCELERATION;
			}
			this.xSpeed += delta * accelerationX;
			this.xSpeed = this.xSpeed > MAX_SPEED? MAX_SPEED : this.xSpeed;
			this.ySpeed += delta * accelerationY;
			this.ySpeed = this.ySpeed > MAX_SPEED? MAX_SPEED : this.ySpeed;

			this.x += this.xSpeed * delta;
			this.y += this.ySpeed * delta;
			break;
	}

	if (rect2dCollisionDetection(mousePosition.x, mousePosition.y, this.x + this.width / 2, this.y + this.height / 2, this.width, this.height)){
		this.hover = true;
	}else{
		this.hover = false;
	}
}

Logo.prototype.draw = function(context){
	context.drawImage(this.image, this.x, this.y, this.width, this.height);
}

function drawMulticolorText(line, x, y, alphaScale){
	var rbAlpha = 0.5 * alphaScale;
	var whiteAlpha = 1 * alphaScale;
	context.globalAlpha = rbAlpha;
	context.fillStyle = "red";
	context.fillText(line, x - 2, y + 2);
	context.fillStyle = "blue";
	context.fillText(line, x + 2, y - 2);
	context.globalAlpha = whiteAlpha;
	context.fillStyle = "white";
	context.fillText(line, x, y);
	context.globalAlpha = 1;
}

var v1, v2;

function click(){
	if (canvas.width < MOBILE_THRESHOLD){
		for (var v in siteStructure.mobile){
			var boundingBox = siteStructure.mobile[v];
			if (boundingBox.hover){
				window.open(vertex.url,'_blank');
			}
		}
	}else{
		
		for (var i = 0; i < logos.length; i++){
			if (logos[i].hover){
				window.open(logos[i].url,'_blank');
			}
		}
		if (state == DiagramStateEnum.ANIMATION){
			for (var i = 0; i < vertex.length; i++){
				if (vertex[i].hover){
					currentPage = document.getElementById(vertex[i].ref);
					state = DiagramStateEnum.RETRACTING;
					calculateRetraction(MAIN_POINT_X * canvas.width, MAIN_POINT_Y * canvas.height);
					nextState = DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE;
				}
			}			
		}else if (state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
			if (backbutton.hover){
				currentPage.style.display = "none";
				state = DiagramStateEnum.RETRACTING;
				calculateRetraction(backbutton.x, backbutton.y);
				nextState = DiagramStateEnum.DEPLOYING_TO_ANIMATION;
			}
		}
		canvas.style.cursor = 'default';
	}	
}

var timeToDeploy;
var nextState;
var currentPage;

function calculateRetraction(targetX, targetY){
	for (var i = 0; i < vertex.length; i++){
		v = vertex[i];
		
		v.poleX = targetX;
		v.poleY = targetY;
		
		v.speedX = (v.poleX - v.x);
		v.speedY = (v.poleY - v.y); 

		v.accelerationX = (v.poleX - v.speedX * RETRACTION_TIME - v.x) * 2 / (RETRACTION_TIME * RETRACTION_TIME);
		v.accelerationY = (v.poleY - v.speedY * RETRACTION_TIME - v.y) * 2 / (RETRACTION_TIME * RETRACTION_TIME);

		v.rotate = false;
		v.state = DiagramStateEnum.DEPLOYING;
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		var bp = backgroundPoints[i];
		bp.centerX = targetX;
		bp.centerY = targetY;
		
		bp.speedX = (targetX - bp.x);
		bp.speedY = (targetY - bp.y); 

		bp.accelerationX = (targetX - bp.speedX * RETRACTION_TIME - bp.x) * 2 / (RETRACTION_TIME * RETRACTION_TIME);
		bp.accelerationY = (targetY - bp.speedY * RETRACTION_TIME - bp.y) * 2 / (RETRACTION_TIME * RETRACTION_TIME);

		bp.state = DiagramStateEnum.DEPLOYING;
	}

	timeToDeploy = RETRACTION_TIME;
}

function calculateDeployToAnimation(){
	for (var i = 0; i < vertex.length; i++){
		v = vertex[i];
		v.poleX = v.backupPoleX;
		v.poleY = v.backupPoleY;
		
		v.speedX = (v.poleX - v.x);
		v.speedY = (v.poleY - v.y); 

		v.accelerationX = (v.poleX - v.speedX * DEPLOY_TIME - v.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		v.accelerationY = (v.poleY - v.speedY * DEPLOY_TIME - v.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);

		v.rotate = false;
		v.state = DiagramStateEnum.DEPLOYING;
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		var bp = backgroundPoints[i];
		var targetX = randomUniformDistribution(0,1) * canvas.width;
		var targetY = randomUniformDistribution(0,1) * canvas.height;

		bp.centerX = targetX;
		bp.centerY = targetY;
		
		bp.speedX = (targetX - bp.x);
		bp.speedY = (targetY - bp.y); 

		bp.accelerationX = (targetX - bp.speedX * DEPLOY_TIME - bp.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		bp.accelerationY = (targetY - bp.speedY * DEPLOY_TIME - bp.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);

		bp.state = DiagramStateEnum.DEPLOYING;
	}
}

function calculateDeployToContentState(){
	for (var i = 0; i < vertex.length; i++){
		v = vertex[i];
		v.poleX = v.backupPoleX * MINI_VERSION_PROPORTION_X + canvas.width * MINI_VERSION_LEFT_MARGIN;
		v.poleY = v.backupPoleY * MINI_VERSION_PROPORTION_Y + canvas.height * MINI_VERSION_TOP_MARGIN;
		
		v.speedX = (v.poleX - v.x);
		v.speedY = (v.poleY - v.y); 

		v.accelerationX = (v.poleX - v.speedX * DEPLOY_TIME - v.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		v.accelerationY = (v.poleY - v.speedY * DEPLOY_TIME - v.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);

		v.rotate = false;
		v.state = DiagramStateEnum.DEPLOYING;
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		var bp = backgroundPoints[i];
		var targetX = randomUniformDistribution(0,1) * canvas.width * MINI_VERSION_PROPORTION_X + canvas.width * MINI_VERSION_LEFT_MARGIN;
		var targetY = randomUniformDistribution(0,1) * canvas.height * MINI_VERSION_PROPORTION_Y + canvas.height * MINI_VERSION_TOP_MARGIN;

		bp.centerX = targetX;
		bp.centerY = targetY;
		
		bp.speedX = (targetX - bp.x);
		bp.speedY = (targetY - bp.y); 

		bp.accelerationX = (targetX - bp.speedX * DEPLOY_TIME - bp.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		bp.accelerationY = (targetY - bp.speedY * DEPLOY_TIME - bp.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);

		bp.state = DiagramStateEnum.DEPLOYING;
	}
}

function initLoader(){
	var width = Math.min(200, canvas.width * 0.4);

	var v = new Vertex(canvas.width * 0.3, canvas.height / 2, INITIAL_CIRCLES_WIDTH);
	v.x = canvas.width * 0.5 - width / 2;
	v.y = canvas.height / 2;
	v.state = DiagramStateEnum.LOADING;
	v.shape = ShapeTypeEnum.CIRCLE;
	v.accelerationX = 100;
	v.speedX = 10;
	v.speedY = 0;
	vertex.push(v);

	v1 = v;

	v = new Vertex(canvas.width * 0.7, canvas.height / 2, INITIAL_CIRCLES_WIDTH);
	v.x = canvas.width * 0.5 + width / 2;
	v.y = canvas.height / 2;
	v.state = DiagramStateEnum.LOADING;
	v.shapeX = ShapeTypeEnum.CIRCLE;
	v.accelerationX = -100;
	v.speedX = -10;
	v.speedY = 0;
	vertex.push(v);

	v2 = v;

	l = new Link();
	l.v1 = v1;
	l.v2 = v2;
	l.style = LinkStyleEnum.SOLID;
	links.push(l);
}

function fillStructureFromJSON(){
	var vertexJSON = siteStructure.vertex;
	for (var i = 0; i < vertexJSON.length; i++){
		var v = new Vertex(canvas.width * vertexJSON[i].width, canvas.height * vertexJSON[i].height, vertexJSON[i].circleDiameter);
		v.shape = ShapeTypeEnum.CIRCLE;
		v.id = vertexJSON[i].id;
		for (var j = 0; j < vertexJSON[i].text.length; j++){
			v.addTextLine(vertexJSON[i].text[j]);
		}
		v.ref = vertexJSON[i].page_ref;
		v.rotationStartX = v.x;
		v.rotationStartY = v.y;
		v.rotate = true;
		v.rotation = Math.PI * randomUniformDistribution(0, 0.5) * randomInteger(-1,1);
		vertex.push(v);
	}
	var linksJSON = siteStructure.links;
	for (var i = 0; i < linksJSON.length; i++){
		var l = new Link();
		l.v1 = getVertex(linksJSON[i].v1);
		l.v2 = getVertex(linksJSON[i].v2);
		l.style = linksJSON[i].style;
		links.push(l);
	}
	var logosJSON = siteStructure.logos;
	var totalLogoWidth = 0;
	for (var i = 0; i < logosJSON.length; i++){
		var l = new Logo();
		l.image = document.getElementById(logosJSON[i].logo);
		l.x = canvas.width * logosJSON[i].targetX - l.image.width / 2; 
		l.targetX = l.x;
		l.targetY = canvas.height * logosJSON[i].targetY - l.image.height / 2;
		l.url = logosJSON[i].url;
		l.y = canvas.height;
		l.width = l.image.width;
		l.height = l.image.height;
		totalLogoWidth += l.width;
		logos.push(l);
	}
	if (totalLogoWidth > canvas.width * 0.7){
		for (var i = 0; i < logos.length; i++){
			logos[i].width *= 0.5;
			logos[i].height *= 0.5;		
			logos[i].x += logos[i].width / 2;
			logos[i].y += logos[i].height / 2; 
			logos[i].targetY += logos[i].height / 2;
		}	
	}
	createMindLabsLogo();
	createBackgroundPoints();
	initVertex();

	backbutton = new BackButton();
}

function createMindLabsLogo(){
	if (canvas.width < MOBILE_THRESHOLD){
		mindLabs = new MindLabs(canvas.width * 0.5, canvas.height * 0.1, canvas.height * 0.04);
	}else{
		mindLabs = new MindLabs(canvas.width * 0.5, canvas.height * 0.5, canvas.height * 0.08);
	}
}

function createBackgroundPoints(){
	var pointCount = Math.max(40, canvas.width * canvas.height / 14000); // change
	for (var i = 0; i < pointCount; i++){
		var radius = Math.min(canvas.width * 0.02, randomUniformDistribution(7,18));
		var targetX = randomUniformDistribution(canvas.width * 0.05, canvas.width * 0.95);
		var targetY = randomUniformDistribution(canvas.height * 0.05, canvas.height * 0.95);
		var bp = new BackgroundPoint(targetX, targetY, radius, context);
		bp.x = canvas.width / 2;
		bp.y = canvas.height / 2;
		bp.speedX = (targetX - bp.x) * 1.5;
		bp.speedY = (targetY - bp.y) * 1.5; 

		bp.accelerationX = (targetX - bp.speedX * DEPLOY_TIME - bp.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		bp.accelerationY = (targetY - bp.speedY * DEPLOY_TIME - bp.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);

		backgroundPoints.push(bp);
	}
}

function initVertex(){
	for (var i = 0; i < vertex.length; i++){
		v = vertex[i];
		v.speedX = (v.poleX - v.x);
		v.speedY = (v.poleY - v.y); 

		v.accelerationX = (v.poleX - v.speedX * DEPLOY_TIME - v.x) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
		v.accelerationY = (v.poleY - v.speedY * DEPLOY_TIME - v.y) * 2 / (DEPLOY_TIME * DEPLOY_TIME);
	}
}

function fillStructure(){

	createMindLabsLogo();

	var v = new Vertex(canvas.width * 0.1, canvas.height * 0.2, 18);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.rotation = Math.PI / 8;
	v.id = 0;
	v.addTextLine("Virtual");
	v.addTextLine(" Reality");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.3, canvas.height * 0.18, 14);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 1;
	v.addTextLine("Mind");
	v.addTextLine(" Maps");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.65, canvas.height * 0.18, 18);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 2;
	v.addTextLine("Mind");
	v.addTextLine(" Labs");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.8, canvas.height * 0.1, 20);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 3;
	v.addTextLine("Mind");
	v.addTextLine(" Labs");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.55, canvas.height * 0.4, 12);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 4;
	v.addTextLine("Mind");
	v.addTextLine(" Labs");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.31, canvas.height * 0.52, 13);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 5;
	v.addTextLine("Mind");
	v.addTextLine(" Labs");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.81, canvas.height * 0.54, 15);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 6;
	v.addTextLine("Mind");
	v.addTextLine(" Labs");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.305, canvas.height * 0.7, 13);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 7;
	v.addTextLine("Augmented");
	v.addTextLine(" Reality");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.12, canvas.height * 0.8, 15);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 8;
	v.addTextLine("Internet");
	v.addTextLine("   of   ");
	v.addTextLine(" things ");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.43, canvas.height * 0.9, 17);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 9;
	v.addTextLine("Internet");
	v.addTextLine("   of   ");
	v.addTextLine(" things ");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.6, canvas.height * 0.78, 10);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 10;
	v.addTextLine("Internet");
	v.addTextLine("   of   ");
	v.addTextLine(" things ");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.96, canvas.height * 0.91, 12);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 11;
	v.addTextLine("Internet");
	v.addTextLine("   of   ");
	v.addTextLine(" things ");
	vertex.push(v);

	v = new Vertex(canvas.width * 0.4, canvas.height * 0.72, 22);
	v.shape = ShapeTypeEnum.CIRCLE;
	v.id = 12;
	v.addTextLine("Augmented");
	v.addTextLine(" Reality");
	vertex.push(v);

	var l = new Link();
	l.v1 = getVertex(0);
	l.v2 = getVertex(1);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(1);
	l.v2 = getVertex(2);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(2);
	l.v2 = getVertex(3);
	l.style = LinkStyleEnum.DOTTED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(2);
	l.v2 = getVertex(4);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(2);
	l.v2 = getVertex(6);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(3);
	l.v2 = getVertex(4);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(4);
	l.v2 = getVertex(5);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(4);
	l.v2 = getVertex(6);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(0);
	l.v2 = getVertex(7);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(1);
	l.v2 = getVertex(8);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(5);
	l.v2 = getVertex(12);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(1);
	l.v2 = getVertex(8);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(8);
	l.v2 = getVertex(9);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(2);
	l.v2 = getVertex(10);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(6);
	l.v2 = getVertex(10);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(6);
	l.v2 = getVertex(11);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(9);
	l.v2 = getVertex(10);
	l.style = LinkStyleEnum.DOTTED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(10);
	l.v2 = getVertex(11);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(1);
	l.v2 = getVertex(10);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(7);
	l.v2 = getVertex(12);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(8);
	l.v2 = getVertex(12);
	l.style = LinkStyleEnum.DASHED;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(9);
	l.v2 = getVertex(12);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	l = new Link();
	l.v1 = getVertex(10);
	l.v2 = getVertex(12);
	l.style = LinkStyleEnum.SOLID;
	links.push(l);

	initVertex();
	createBackgroundPoints();

}

function getVertex(id){
	var v = null;
	for (var i = 0; i < vertex.length; i++){
		if (vertex[i].id == id){
			v = vertex[i];
			break;
		}
	}
	return v;
}

var backgroundCanvas = document.createElement('canvas');
var backgroundContext = backgroundCanvas.getContext('2d');
var blurredCanvas = document.createElement('canvas');
var blurredContext = blurredCanvas.getContext('2d');

function drawDesign(context){
	context.globalAlpha = 1;

	backgroundCanvas.width = canvas.width;
	backgroundCanvas.height = canvas.height;
	//blurredCanvas.width = canvas.width;
	//blurredCanvas.height = canvas.height;

	for (var i = 0; i < lightning.length; i++){
		lightning[i].draw(backgroundContext);
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		backgroundPoints[i].draw(backgroundContext);
	}
	//blurredContext.filter = 'blur(3px)';
	//blurredContext.drawImage(backgroundCanvas, 0, 0);
	context.drawImage(backgroundCanvas, 0, 0);

	if (canvas.width < MOBILE_THRESHOLD){

		drawMobile(context);

	}else{
		for (var i = 0; i < links.length; i++){
			links[i].draw(context);
		}
		for (var i = 0; i < vertex.length; i++){
			vertex[i].draw(context);
		}

		if (state == DiagramStateEnum.ANIMATION || state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
			mindLabs.draw(context);
		}	
		if (state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
			backbutton.draw(context);
		}
	}	

	for (var i = 0; i < logos.length; i++){
		logos[i].draw(context)
	}	
}	

BackButton = function(){
	this.x = canvas.width * BACKBUTTON_POSITION_X;
	this.y = canvas.height * BACKBUTTON_POSITION_Y;
	this.radius = BACKBUTTON_RADIUS;
	this.colors = ["red", "blue", "white"];
	this.opacities = [0.4, 0.4, 1];
	this.offsetX = [-1, 1, 0];
	this.offsetY = [1, -1, 0];
	this.hover = false;
}

BackButton.prototype.draw = function(context){
	for (var i = 0; i < this.colors.length; i++){
		context.fillStyle = this.colors[i];
		context.globalAlpha = this.opacities[i];
		context.beginPath();
		context.arc(this.x + this.offsetX[i], this.y + this.offsetY[i], this.radius, 0, 2*Math.PI);
		context.fill();
		context.closePath();

		var blackArrow = document.getElementById('black_arrow');
		if (blackArrow.complete && blackArrow.naturalWidth !== "undefined" && blackArrow.naturalWidth != 0){
			context.drawImage(blackArrow, this.x - this.radius * 0.9, this.y - this.radius* 0.9, this.radius * 1.8, this.radius * 1.8);
		}

	}
	context.globalAlpha = 1;
}

BackButton.prototype.evalHovering = function(){
	this.hover = (dist(this.x, this.y, mousePosition.x, mousePosition.y) < this.radius);
	return this.hover;
}

function drawMobile(context){

	if (state == DiagramStateEnum.LOADING){
		for (var i = 0; i < links.length; i++){
			links[i].draw(context);
		}
		for (var i = 0; i < vertex.length; i++){
			vertex[i].draw(context);
		}
	}else if (state == DiagramStateEnum.ANIMATION){
		mindLabs.draw(context);

		context.strokeStyle = "white";
		context.lineWidth = "1px";
		context.beginPath();
		var verticalLineStart = canvas.height * 0.25;
		var verticalLineHeight = canvas.width * 0.8; // 
		context.moveTo(canvas.width * 0.5, verticalLineStart);
		context.lineTo(canvas.width * 0.5, verticalLineStart + verticalLineHeight);
		var middleLinePosition = verticalLineStart + verticalLineHeight / 2;
		context.moveTo(canvas.width * 0.1, middleLinePosition);
		context.lineTo(canvas.width * 0.9, middleLinePosition);
		context.stroke();
		context.closePath();

		var availableSpace = canvas.width * 0.5 - canvas.width * 0.15;
		var fontSize = 40;
		var fontSizeOk = false;
		while (!fontSizeOk){
			context.font = fontSize + "px " + VERTEX_FONT_FAMILY;
			if (context.measureText(siteStructure.longestString).width > availableSpace){
				fontSize--;
			}else{
				fontSizeOk = true;
			}
		}

		context.fillStyle = "white";
		context.textAlign = "center";
		context.textBaseline = "top";
		// top right
		var topRightText = siteStructure.mobile.top_right.text;
		var interLineSpace = 5;
		var totalRightTextVSpace = topRightText.length * fontSize + (topRightText.length - 1) * interLineSpace; 
		var startVPosition = verticalLineStart + (middleLinePosition - verticalLineStart) * 0.5 - totalRightTextVSpace * 0.5;
		for (var i = 0; i < topRightText.length; i++){
			context.fillText(topRightText[i], canvas.width * 0.7, startVPosition + i * (fontSize + interLineSpace));
		}
		// calculate bounding box for url
		siteStructure.mobile.top_right.x = canvas.width * 0.7 - availableSpace / 2;
		siteStructure.mobile.top_right.y = startVPosition + fontSize;
		siteStructure.mobile.top_right.width = availableSpace;
		siteStructure.mobile.top_right.height = topRightText.length * (fontSize + interLineSpace);

		// top left
		var topLeftText = siteStructure.mobile.top_left.text;
		var interLineSpace = 5;
		var totalLeftTextVSpace = topLeftText.length * fontSize + (topLeftText.length - 1) * interLineSpace; 
		var startVPosition = verticalLineStart + (middleLinePosition - verticalLineStart) * 0.5 - totalLeftTextVSpace * 0.5;
		for (var i = 0; i < topLeftText.length; i++){
			context.fillText(topLeftText[i], canvas.width * 0.3, startVPosition + i * (fontSize + interLineSpace));
		}
		// calculate bounding box for url
		siteStructure.mobile.top_left.x = canvas.width * 0.3 - availableSpace / 2;
		siteStructure.mobile.top_left.y = startVPosition + fontSize;
		siteStructure.mobile.top_left.width = availableSpace;
		siteStructure.mobile.top_left.height = topLeftText.length * (fontSize + interLineSpace);

		// bottom right
		var bottomRightText = siteStructure.mobile.bottom_right.text;
		var interLineSpace = 5;
		var totalBottomRightTextVSpace = bottomRightText.length * fontSize + (bottomRightText.length - 1) * interLineSpace; 
		var startVPosition = middleLinePosition + (middleLinePosition - verticalLineStart) * 0.5 - totalBottomRightTextVSpace * 0.5;
		for (var i = 0; i < bottomRightText.length; i++){
			context.fillText(bottomRightText[i], canvas.width * 0.7, startVPosition + i * (fontSize + interLineSpace));
		}
		// calculate bounding box for url
		siteStructure.mobile.bottom_right.x = canvas.width * 0.7 - availableSpace / 2;
		siteStructure.mobile.bottom_right.y = startVPosition + fontSize;
		siteStructure.mobile.bottom_right.width = availableSpace;
		siteStructure.mobile.bottom_right.height = bottomRightText.length * (fontSize + interLineSpace);

		// top left
		var bottomLeftText = siteStructure.mobile.bottom_left.text;
		var interLineSpace = 5;
		var totalBottomLeftTextVSpace = bottomLeftText.length * fontSize + (bottomLeftText.length - 1) * interLineSpace; 
		var startVPosition = middleLinePosition + (middleLinePosition - verticalLineStart) * 0.5 - totalBottomLeftTextVSpace * 0.5;
		for (var i = 0; i < bottomLeftText.length; i++){
			context.fillText(bottomLeftText[i], canvas.width * 0.3, startVPosition + i * (fontSize + interLineSpace));
		}
		// calculate bounding box for url
		siteStructure.mobile.bottom_left.x = canvas.width * 0.3 - availableSpace / 2;
		siteStructure.mobile.bottom_left.y = startVPosition + fontSize;
		siteStructure.mobile.bottom_left.width = availableSpace;
		siteStructure.mobile.bottom_left.height = bottomLeftText.length * (fontSize + interLineSpace);

	}
}

function checkDependencies(){
	var logos = [];
	logos.push(document.getElementById('mindlabs_logo'));
	logos.push(document.getElementById('fontys_logo'));
	logos.push(document.getElementById('gameente_logo'));
	logos.push(document.getElementById('uvtpgn_logo'));
	
	for (var i = 0; i < logos.length; i++){
		var logo = logos[i];
		if (logo == null)
			return false;	
		if (!logo.complete) {
	        return false;
	    }
	    if (typeof logo.naturalWidth !== "undefined" && logo.naturalWidth === 0) {
	        return false;
		}
	}

	if (siteStructure == null){ // check json loading
		return false;
	}
	return true;
}

var timeToAnimation = 0;
var lightningStrike = false;

function update(delta, elapsedTime) {

	if (state == DiagramStateEnum.LOADING){
		if ((v1.x > v2.x && v1.accelerationX > 0) || (v1.x < v2.x && v1.accelerationX < 0)){
			var ready = checkDependencies();
			if (!ready){
				v1.accelerationX *= -1;
				v2.accelerationX *= -1;
			}else{
				state = DiagramStateEnum.DEPLOYING;
				vertex = [];
				links = [];
				//fillStructure();
				fillStructureFromJSON();
				timeToAnimation = DEPLOY_TIME;
			}
		}
	}else if (state == DiagramStateEnum.DEPLOYING){
		timeToAnimation -= delta;
		if (timeToAnimation <= 0){
			state = DiagramStateEnum.ANIMATION;
			lightningStrike = true;
		}
	}else if (state == DiagramStateEnum.ANIMATION){
		canvas.style.cursor = 'default';
		if (canvas.width < MOBILE_THRESHOLD){
			for (var v in siteStructure.mobile){
				var boundingBox = siteStructure.mobile[v];
				if (rect2dCollisionDetection(mousePosition.x, mousePosition.y, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)){
					boundingBox.hover = true;
				}else{
					boundingBox.hover = false;
				}
			}
		}else{
			for (var i = 0; i < vertex.length; i++){
				if (vertex[i].hover){
					canvas.style.cursor = 'pointer';
					break;
				}
			}
			for (var i = 0; i < logos.length; i++){
				if (logos[i].hover){
					canvas.style.cursor = 'pointer';
					break;
				}
			}	
		}
	}else if (state == DiagramStateEnum.RETRACTING){
		timeToDeploy -= delta;
		if (timeToDeploy <= 0){
			state = nextState;
			if (nextState == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
				calculateDeployToContentState();
				currentPage.style.opacity = 0;
				currentPage.style.display = "block";
				currentPage.style.left = CONTENT_LEFT_POSITION * canvas.width;
				currentPage.style.top = CONTENT_TOP_POSITION * canvas.height;  
				currentPage.style.width = CONTENT_WIDTH * canvas.width;
				currentPage.style.height = CONTENT_HEIGHT * canvas.height;
			}else if (nextState == DiagramStateEnum.DEPLOYING_TO_ANIMATION){
				calculateDeployToAnimation();
				timeToAnimation = DEPLOY_TIME;
			}	
		}
	}else if (state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
		if (currentPage.style.opacity < CONTENT_MAXIMUM_OPACITY){
			currentPage.style.opacity = parseFloat(currentPage.style.opacity) + CONTENT_OPACITY_GAIN_SPEED * delta;
			if (currentPage.style.opacity > CONTENT_MAXIMUM_OPACITY)
				currentPage.style.opacity = CONTENT_MAXIMUM_OPACITY;
		}
		canvas.style.cursor = 'default';
		if (backbutton.evalHovering()){
			canvas.style.cursor = 'pointer';
		}
	}else if (state == DiagramStateEnum.DEPLOYING_TO_ANIMATION){
		timeToAnimation -= delta;
		if (timeToAnimation < 0){
			state = DiagramStateEnum.ANIMATION;
		}
	}
	for (var i = 0; i < logos.length; i++){
		logos[i].update(delta)
	}	
	for (var i = lightning.length - 1; i >= 0 ; i--){
		lightning[i].update(delta);
		if (lightning[i].timeLeft <= 0){
			lightning.splice(i, 1);
		}
	}
	for (var i = 0; i < backgroundPoints.length; i++){
		backgroundPoints[i].update(delta, elapsedTime);
	}
	for (var i = 0; i < vertex.length; i++){
		vertex[i].update(delta, elapsedTime);
	}	

	if (state == DiagramStateEnum.ANIMATION){
		mindLabs.update(delta, elapsedTime);
	}	
}

DistortionStateEnum = {
	DISTORTION : 0,
	STABLE : 1
}

DistortionEventTypeEnum = {
	DISSAPEAR : 0,
	APPEAR : 1,
	RANDOM_MOVE : 2
}

MindLabs = function(x, y){
	this.x = x;
	this.y = y;
	this.aspectRatio = 167 / 31;
	this.width = clamp(canvas.width / 3, 200, 250);
	this.height = this.width / this.aspectRatio;
	this.images = []; 
	this.prepareDistortion();
	this.state = DistortionStateEnum.DISTORTION;

	this.currentEvent = 0;
	this.events = [];
	this.timeToNextEvent = 0;
	this.events.push({ time : 1, type : DistortionEventTypeEnum.DISSAPEAR});
	this.events.push({ time : 0.1, type : DistortionEventTypeEnum.RANDOM_MOVE});	
	this.events.push({ time : 0.4, type : DistortionEventTypeEnum.DISSAPEAR});
	this.events.push({ time : 0.2, type : DistortionEventTypeEnum.RANDOM_MOVE});	
	this.events.push({ time : 0.5, type : DistortionEventTypeEnum.APPEAR});	
	this.events.push({ time : 0.1, type : DistortionEventTypeEnum.RANDOM_MOVE});
	this.events.push({ time : 0.5, type : DistortionEventTypeEnum.APPEAR});		

	this.timeToEvalDistortion = TIME_TO_EVAL_DISTORTION;
}

MindLabs.prototype.resize = function(widthRatio, heightRatio){
	this.x *= widthRatio;
	this.y *= heightRatio;
	for (var i = 0; i < this.images.length; i++){
		this.images[i].x *= widthRatio;
		this.images[i].y *= heightRatio;	
	}
}

MindLabs.prototype.prepareDistortion = function(){
	var logo = document.getElementById('mindlabs_logo');
	for (var i = 0; i < 4; i++){
		var image = document.createElement('canvas');
		var context = image.getContext('2d');
		image.width = this.width;
		image.height = this.height;
		/*
		context.font = this.fontSize + "px Arial";
		context.textAlign = "left";
		context.textBaseline = "top";
		*/
		var redFilter = 0;
		var greenFilter = 0;
		var blueFilter = 0;
		switch(i){
			case 0:
				redFilter = 1;
				greenFilter = 1;
				blueFilter = 1;
				break;
			case 1:
				redFilter = 1;
				break;
			case 2:
				greenFilter = 1;
				break;
			case 3:
				blueFilter = 1;
				break;
		}
		context.drawImage(logo, 0, 0, this.width, this.height);
		var imageData = context.getImageData(0, 0, image.width, image.height);			
		colorAlphaFilter(imageData, redFilter, greenFilter, blueFilter);
		context.putImageData(imageData, 0, 0);
		//context.fillText("MINDLABS", 0, 0);
		this.images.push({ image : image, x : this.x, y : this.y, moved: false});
	}
}

MindLabs.prototype.update = function(delta){
	if (this.state == DistortionStateEnum.DISTORTION){
		for (var i = this.images.length - 1; i > 0; i--){
			this.images[i].x = this.images[i - 1].x;
			this.images[i].y = this.images[i - 1].y;		
		}

		this.timeToNextEvent += delta;
		if (this.timeToNextEvent >= this.events[this.currentEvent].time){
			this.currentEvent++;
			this.timeToNextEvent = 0;
			if (this.currentEvent == this.events.length){
				this.state = DistortionStateEnum.STABLE;
				return;
			}
		}

		switch(this.events[this.currentEvent].type){
			case DistortionEventTypeEnum.DISSAPEAR:
				this.images[0].x = canvas.width + 2 + this.width / 2;
				this.images[0].y = canvas.height + 2 + this.height / 2;				
				break;
			case DistortionEventTypeEnum.APPEAR:			
				this.images[0].x = this.x;
				this.images[0].y = this.y;	
				break;
			case DistortionEventTypeEnum.RANDOM_MOVE:
				this.images[0].x = this.x + randomUniformDistribution(-10,10);
				this.images[0].y = this.y + randomUniformDistribution(-10,10);
				break;
		}		
	}else if (this.state == DistortionStateEnum.STABLE){
		this.timeToEvalDistortion -= delta;
		if (this.timeToEvalDistortion <= 0){
			this.timeToEvalDistortion = TIME_TO_EVAL_DISTORTION;
			if (randomUniformDistribution(0,1) < MINDLABS_DISTORTION_PROBABILITY){
				this.timeToNextEvent = 0;
				this.currentEvent = 0;
				this.state = DistortionStateEnum.DISTORTION;
				this.events = [];
				this.events.push({ time : randomUniformDistribution(0.1,0.3), type : DistortionEventTypeEnum.RANDOM_MOVE});	
				this.events.push({ time : randomUniformDistribution(0.2,0.5), type : DistortionEventTypeEnum.DISSAPEAR});
				this.events.push({ time : randomUniformDistribution(0.1,0.3), type : DistortionEventTypeEnum.RANDOM_MOVE});
			}
		}
	}
}		

MindLabs.prototype.draw = function(context){
	if (state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
		var proportion = 0.5;
		context.drawImage(this.images[0].image, 
			BACKBUTTON_POSITION_X * canvas.width * 1.4, 
			BACKBUTTON_POSITION_Y * canvas.height - this.height * 0.5 * proportion,
			this.width * proportion,
			this.height * proportion);
	}else{
		if (this.state == DistortionStateEnum.DISTORTION){
			for (var i = this.images.length - 1; i >= 0 ; i--){
				context.drawImage(this.images[i].image, this.images[i].x - this.width / 2, this.images[i].y - this.height / 2);
			}
		}else{
			context.drawImage(this.images[0].image, this.x - this.width / 2, this.y - this.height / 2);
		}		
	}
		

}

