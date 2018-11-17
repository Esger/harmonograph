// JavaScript Document
$(function(){

	(function () {
		var $elem = $('#myCanvas'),
		$body = $('body');
		var canvas = $elem.get(0),
		gogogo = null;
		
		$body.on('mouseover', $elem, function (evt) {
			gogogo = setInterval(redraw, 0);
		});
		$elem.on('touchstart', function (evt) {
			evt.preventDefault();
			gogogo = setInterval(redraw, 0);
			var eventPos;
			var touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
			eventPos = harmonoGraphInterface.getEventPos(canvas, touch);
			harmonoGraphModel.parameters.tableRatio = Math.floor(eventPos.x / 100);
			harmonoGraphModel.parameters.zAmp = Math.floor(eventPos.y / 3);			
		});
		
		$body.on('mouseout', $elem, function (evt) {
			clearInterval(gogogo);
		});
		$elem.on('touchend', function (evt) {
			clearInterval(gogogo);
		});
		function redraw () {
			harmonoGraphModel.generateLissajous();
			harmonoGraphInterface.drawLissajous(harmonoGraphModel.lissajousFigure);
		}
		
		var harmonoGraphInterface = {
			centerX : Math.round(canvas.width / 2),
			centerY : Math.round(canvas.height / 2),
			touchDevice : function (evt) {
				if ('ontouchstart' in document.documentElement) {
					this.touchDevice = true;
				}
			},
			
			// Draw the figure
			drawLissajous : function (points) {
				if (points.length > 2) {
					var x, y,
					x = points[1][0] + this.centerX;
					y = points[1][1] + this.centerY;
					ctx = canvas.getContext('2d');
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.beginPath();
					ctx.strokeStyle = "rgb(204, 204, 0)";
					ctx.moveTo(x,y);
					for (var count = 2; count < points.length; count++) {
						x = points[count][0] + this.centerX;
						y = points[count][1] + this.centerY;
						ctx.lineTo(x,y);
					}
					ctx.stroke();
					ctx.closePath();
				}
			},
			
			getEventPos : function (canvas, evt) {
				// get canvas position
				var obj = canvas;
				var top = 0;
				var left = 0;
				while (obj && obj.tagName !== 'BODY') {
					top += obj.offsetTop;
					left += obj.offsetLeft;
					obj = obj.offsetParent;
				}

				// return relative mouse position
				var mouseX = evt.clientX - left + C.pageXOffset;
				var mouseY = evt.clientY - top + window.pageYOffset;
				return {
					x: mouseX,
					y: mouseY
				};
			},
			
			setFullScreen : function () {
				
				$elem.addClass('f');
				$('#container').addClass('f');
			}//
			
		};
		
		$elem.on('mousemove', function (evt){
			var eventPos = harmonoGraphInterface.getEventPos(canvas, evt);
			harmonoGraphModel.parameters.xAmp = Math.floor(eventPos.x / 2);
			harmonoGraphModel.parameters.yAmp = Math.floor(eventPos.y / 2);
			harmonoGraphModel.parameters.freqRatio = eventPos.x / eventPos.y;
		});
		$elem.on('click', function (evt) {
			var eventPos = harmonoGraphInterface.getEventPos(canvas, evt);
			harmonoGraphModel.parameters.tableRatio = Math.floor(eventPos.x / 100);
			harmonoGraphModel.parameters.zAmp = Math.floor(eventPos.y / 3);			
		});

		$elem.on('touchmove', function (evt){
			var eventPos;
			var touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
			eventPos = harmonoGraphInterface.getEventPos(canvas, touch);
			harmonoGraphModel.parameters.xAmp = Math.floor(eventPos.x / 2);
			harmonoGraphModel.parameters.yAmp = Math.floor(eventPos.y / 2);
			harmonoGraphModel.parameters.freqRatio = eventPos.x / eventPos.y;
		});

		var harmonoGraphModel = {
			
			parameters : {
				xAmp : 300,
				yAmp : 200,
				zAmp : 250,
				freqRatio : 0.1666,
				tableRatio : 1,
				friction : 0.9992,
				minStep : Math.PI/45
			},
			
			lissajousFigure : [],
			
			generateLissajous : function () {
				var point = [0,0], 
					maxX = this.parameters.xAmp, 
					maxY = this.parameters.yAmp,
					maxZ = this.parameters.zAmp,
					maxAmp,
					angle = 0,
					tableAngle = 0,
					dX = 0, dY = 0,	dReal = 0,
					prevX = point[0], prevY = point[1],
					step = this.parameters.minStep;
				this.lissajousFigure = [[0,0]];
				while ((maxX > 10) || (maxY > 10)) {
					// Store the last point
					prevX = point[0];
					prevY = point[1];
					
					// Calc new points
					// Bitwise operation as an alternative to Math.round
					point[0] = (0.5 + maxX * Math.sin(angle) + maxZ * Math.sin(tableAngle)) | 0; 
					point[1] = (0.5 + maxY * Math.cos(angle * this.parameters.freqRatio) + maxZ * Math.cos(tableAngle)) | 0;
					
					// Push the new point on array
					this.lissajousFigure.push(point.slice());
					
					if (maxX >= maxY) {
						maxAmp = maxX;
						if (maxZ >= maxX) {
							maxAmp = maxZ
						}
					} else {
						maxAmp = maxY;
						if (maxZ >= maxY) {
							maxAmp = maxZ
						}
					}
					step = 4 * Math.PI / maxAmp;
					angle+=step;
					tableAngle = angle * this.parameters.tableRatio;
					
					//Apply friction with factor < 0 to Amplitude     
					maxX = maxX * this.parameters.friction;
					maxY = maxY * this.parameters.friction;
					maxZ = maxZ * this.parameters.friction;
				}
			},
			
			initialize : function () {
				this.generateLissajous();
				harmonoGraphInterface.drawLissajous(this.lissajousFigure);
				harmonoGraphInterface.setFullScreen();
			}
		};

		harmonoGraphModel.initialize();		

	}());
	
});

// Rainbow colors, Tweet a Lissajous figure, full-window on black bg