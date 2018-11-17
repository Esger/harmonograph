// JavaScript Document
$(function(){

	(function () {
		var elem = $('#myCanvas');
		var canvas = elem.get(0),
		gogogo;
		
		elem.on('mouseover', function (evt) {
			gogogo = setInterval(redraw, 0);
		});
		
		elem.on('mouseout', function (evt) {
			clearInterval(gogogo);
		});
		
		elem.on('mousemove', function (evt){
			var mousePos = harmonoGraphInterface.getMousePos(canvas, evt);
			harmonoGraphModel.parameters.xAmp = Math.floor(mousePos.x / 2);
			harmonoGraphModel.parameters.yAmp = Math.floor(mousePos.y / 2);
		});

		var harmonoGraphInterface = {
			centerX : Math.round(canvas.width / 2),
			centerY : Math.round(canvas.height / 2),
			
			// Draw the figure
			drawLissajous : function (points) {
				var x,y,
					ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.beginPath();
				ctx.strokeStyle = "rgb(204, 204, 0)";
				x = points[0][0] + this.centerX;
				y = points[0][1] + this.centerY;
				ctx.moveTo(x,y);
				for (var count = 1; count < points.length; count++) {
					x = points[count][0] + this.centerX;
					y = points[count][1] + this.centerY;
					ctx.lineTo(x,y);
				}
				ctx.stroke();
				ctx.closePath();
			},
			
			getMousePos : function (canvas, evt) {
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
				var mouseX = evt.clientX - left + window.pageXOffset;
				var mouseY = evt.clientY - top + window.pageYOffset;
				return {
					x: mouseX,
					y: mouseY
				};
			}
			
		};
		
		var harmonoGraphModel = {
			
			parameters : {
				xAmp : 300,
				yAmp : 200,
				freqRatio : 0.3333,
				friction : 0.99,
				interval : 20
			},
			
			lissajousFigure : [],
			
			generateLissajous : function () {
				var point = [], 
					maxX = this.parameters.xAmp, 
					maxY = this.parameters.yAmp, 
					angle = 0, 
					step = 20 * Math.PI / (maxX + maxY);
				while ((maxX + maxY) > 10) {
					point[0] = Math.round(maxX * Math.sin(angle));
					point[1] = Math.round(maxY * Math.cos(angle * this.parameters.freqRatio));
					this.lissajousFigure.push(point.slice());
					angle+=step;
					maxX = maxX * this.parameters.friction;
					maxY = maxY * this.parameters.friction;
				}
			},
			
			initialize : function () {
				this.generateLissajous();
				harmonoGraphInterface.drawLissajous(this.lissajousFigure);
			}
		};
		
		harmonoGraphModel.initialize();
		
		function redraw () {
			harmonoGraphModel.generateLissajous();
			harmonoGraphInterface.drawLissajous(harmonoGraphModel.lissajousFigure);
		}
		

	}());
	
});

