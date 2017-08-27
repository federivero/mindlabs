

var lastFrameTimeMs = 0;
var elapsedTime = 0;

var evalLightningTime = 700; // milliseconds
var lightningTime = 0;

function mainLoop(timestamp) {

	delta = timestamp - lastFrameTimeMs; 
	lastFrameTimeMs = timestamp;

	if (delta >= 100) delta = 100;

	delta = delta;
	elapsedTime += delta;

	var deltaInSeconds = (delta / 1000);

	if (state == DiagramStateEnum.ANIMATION || state == DiagramStateEnum.DEPLOYING_TO_CONTENT_PAGE){
		lightningTime += delta;
		if (lightningTime > evalLightningTime || lightningStrike){
			lightningTime = 0;
			if (randomUniformDistribution(0, 1) > 0.8 || lightningStrike){
				// lightning!
				for (var i = 0; i < backgroundPoints.length; i++){
					backgroundPoints[i].lightningMarked = false;
					backgroundPoints[i].propagateLightning = false;
					backgroundPoints[i].timeToLightning = -1;
				}
				var limit = Math.min(15, backgroundPoints.length);
				for (var i = 0; i < limit; ){
					var lightningStartIndex = randomInteger(0, backgroundPoints.length - 1);
					if (backgroundPoints[lightningStartIndex].timeToLightning < 0){
						backgroundPoints[lightningStartIndex].timeToLightning = DEFAULT_TIME_TO_LIGHTNING + randomUniformDistribution(0, 5*DEFAULT_TIME_TO_LIGHTNING);
						i++;
					}
				}
				lightningStrike = false;
			}
		}
	}
	update(deltaInSeconds, elapsedTime);
    draw();
    requestAnimationFrame(mainLoop);
}




