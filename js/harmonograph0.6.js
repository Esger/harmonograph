// JavaScript Document
$(function () {
"use strict";

	(function () {
		/* Make the mod function work properly so negative numbers return a correct positive value
		http://javascript.about.com/od/problemsolving/a/modulobug.htm */
		Number.prototype.mod = function(n) {
			return ((this%n)+n)%n;
		};
		
		var harmonographController = {
			
			addListeners : function () {
				
				var gogogo = null,
				$snapShotButton = $('.createSnapshot'),
				$canvas = $('#myCanvas'),
				$elem = $canvas[0];
				
				$canvas.on('mouseover', function () {
					gogogo = setInterval(harmonographController.redraw, 0);
				});
				
				$canvas.on('mouseout', function () {
					clearInterval(gogogo);
				});
				
				$canvas.on('touchend', function () {
					clearInterval(gogogo);
				});
				
				$canvas.on('mousemove', function (evt){
					var eventPos = harmonographInterface.getEventPos($elem, evt);
					harmonographModel.setPenParams(eventPos);
				});
				
				$canvas.on('click', function (evt) {
					var eventPos = harmonographInterface.getEventPos($elem, evt);
					harmonographModel.setTableParams(eventPos);
				});
		
				$canvas.on('touchstart', function (evt) {
					evt.preventDefault();
					gogogo = setInterval(harmonographController.redraw, 0);
					
					var eventPos,
					touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
					
					eventPos = harmonographInterface.getEventPos(harmonographController.$canvas, touch);
					harmonographModel.setTableParams(eventPos);
				});
								
				$canvas.on('touchmove', function (evt){
					var eventPos;
					var touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
					eventPos = harmonographInterface.getEventPos(harmonographController.$canvas, touch);
					harmonographModel.setPenParams(eventPos);
				});
		
				$snapShotButton.on('touchstart', function (e) {
					e.preventDefault(); // don't follow the link before the image is saved
					var anchor = $(this), h,
					newHref;
					h = anchor.attr('href');
					harmonographInterface.saveHarmonogram(harmonographInterface.newimageId());
					newHref = h + '?imageId=' + harmonographInterface.imageId;
					window.location = newHref;
				});
		
				$snapShotButton.on('click', function (e) {
					e.preventDefault(); // don't follow the link before the image is saved
					var anchor = $(this), h,
					newHref;
					h = anchor.attr('href');
					harmonographInterface.saveHarmonogram(harmonographInterface.newimageId());
					newHref = h + '?imageId=' + harmonographInterface.imageId;
					window.open(newHref);
				});
			},
			
			redraw : function () {
				harmonographModel.generateLissajous();
				harmonographInterface.drawLissajous(harmonographModel.lissajousFigure);
			},
			
			init : function () {
				harmonographInterface.touchDevice();
				this.addListeners();
				this.redraw();
				harmonographInterface.addSharingShortCut();
			}
		
		};
		
		var harmonographInterface = {
			
			// Check if it is a touch device
			touchDevice : function () {
				if ('ontouchstart' in document.documentElement) {
					$('body').addClass('touchDevice');
				}
			},

			// Draw the figure
			drawLissajous : function (points) {
				var $canvas = $('#myCanvas')[0],
				centerX = Math.round($canvas.width / 2),
				centerY = Math.round($canvas.height / 2);
				
				if (points.length > 2) {
					if ($canvas.getContext) {
						var ctx = $canvas.getContext('2d'),
						x = points[1][0] + centerX,
						y = points[1][1] + centerY,
						newX, newY,
						f = 0.002, blue, red, green;
						
						// With special thanks to Asad at Stackoverflow for helping out with the rainbow path.
						ctx.clearRect(0, 0, $canvas.width, $canvas.height);
						for (var count = 2; count < points.length; count++) {
							ctx.beginPath();
							ctx.moveTo(x,y);
							newX = points[count][0] + centerX;
							newY = points[count][1] + centerY;
							blue = Math.sin(f * count + 0) * 127 + 128;
							red = Math.sin(f * count + 2) * 127 + 128;
							green = Math.sin(f * count + 4) * 127 + 128;
							ctx.strokeStyle = 'rgb(' + Math.round(red) + ', ' + Math.round(green) + ', ' + Math.round(blue) + ')';
							x = newX;
							y = newY;
							ctx.lineTo(x,y);
							ctx.stroke();
							ctx.closePath();
						}
					} else {
						console.log ('canvas not supported');
					}
				}
			},
			
			getEventPos : function (canvas, evt) {
				// get canvas position
				var obj = canvas,
				top = 0,
				left = 0;
				
				while (obj && obj.tagName !== 'BODY') {
					top += obj.offsetTop;
					left += obj.offsetLeft;
					obj = obj.offsetParent;
				}

				// return relative mouse position
				var mouseX = evt.clientX - left + window.pageXOffset,
				mouseY = evt.clientY - top + window.pageYOffset;
				
				return {
					x: mouseX,
					y: mouseY
				};
			},
			
			imageId : 0,
			newimageId : function () {
				this.imageId = Math.floor((Math.random() * 100000) % 100000 + '');
				return this.imageId;
			},
			newHref : null,
			
			// Save the canvasdata as image with random number in name.
			saveHarmonogram : function () {
				var $canvas = $('#myCanvas')[0],
				canvasData = $canvas.toDataURL("image/png"),
				ajax = new XMLHttpRequest();
				
				this.newimageId();
				this.newHref = 'snapshot.php' + '?imageId=' + this.imageId;
				ajax.open("POST",this.newHref,false);
				ajax.setRequestHeader('Content-Type', 'application/upload');
				ajax.send(canvasData);
				//window.open('your-harmonogram.php?imageId='+ imgId);
			},
			
			addSharingShortCut : function () {
				shortcut.add('Space', function () {
					harmonographInterface.saveHarmonogram();
					window.location = harmonographInterface.newHref;
				});	
			}
									
		};
		
		var harmonographModel = {
			
			parameters : {
				xAmp : 300,
				yAmp : 200,
				zAmp : 250,
				freqRatio : 0.1666,
				tableRatio : 1,  // Change this
				frictionX : 0.9992,
				frictionY : 0.9992,
				frictionZ : 0.9992,
				minStep : Math.PI/45
			},
			
			lissajousFigure : [],
			
			setPenParams : function (ePos) {
				this.parameters.xAmp = Math.floor(ePos.x / 2);
				this.parameters.yAmp = Math.floor(ePos.y / 2);
				this.parameters.freqRatio = ePos.x / ePos.y;
			},
			
			setTableParams : function (ePos) {
				this.parameters.tableRatio = Math.floor(ePos.x / 100);
				this.parameters.zAmp = Math.floor(ePos.y / 3);			
			},
			
			generateLissajous : function () {
				var point = [0,0], 
					maxX = this.parameters.xAmp, 
					maxY = this.parameters.yAmp,
					maxZ = this.parameters.zAmp,
					maxAmp,
					angle = 0,
					tableAngle = 0,
					step = this.parameters.minStep;
					
				this.lissajousFigure = [[0,0]];
				
				while ((maxX > 10) || (maxY > 10)) {
					
					// Calc points
					// Bitwise operation as an alternative to Math.round
					point[0] = (0.5 + maxX * Math.sin(angle) + maxZ * Math.sin(tableAngle)) | 0; 
					point[1] = (0.5 + maxY * Math.cos(angle * this.parameters.freqRatio) + maxZ * Math.cos(tableAngle)) | 0;
					
					// Push the new point on array
					this.lissajousFigure.push(point.slice());
					
					// Get the largest amplitude
					if (maxX >= maxY) {
						maxAmp = maxX;
						if (maxZ >= maxX) {
							maxAmp = maxZ;
						}
					} else {
						maxAmp = maxY;
						if (maxZ >= maxY) {
							maxAmp = maxZ;
						}
					}
					
					// Adjust stepsize to largest amplitude
					step = 4 * Math.PI / maxAmp;
					
					angle+=step;
					tableAngle = angle * this.parameters.tableRatio;
					
					//Apply friction with factor < 0 to Amplitude     
					maxX = maxX * this.parameters.frictionX;
					maxY = maxY * this.parameters.frictionY;
					maxZ = maxZ * this.parameters.frictionZ;
				}
			}
		};
		
		harmonographController.init();

	}());
	
});
