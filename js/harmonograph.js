// JavaScript Document
$(function () {
    "use strict";

    (function () {
		/* Make the mod function work properly so negative numbers return a correct positive value
		http://javascript.about.com/od/problemsolving/a/modulobug.htm */
        Number.prototype.mod = function (n) {
            return ((this % n) + n) % n;
        };

        var harmonographController = {

            shiftPressed: false,

            addListeners: function () {

                var gogogo = null,
                    $snapShotButton = $('.createSnapshot'),
                    $dimensions = $('#dimensions'),
                    $canvas = $('#myCanvas'),
                    $elem = $canvas[0];

                $canvas.on('mouseover', function () {
                    harmonographController.nextTip(2);
                });

                $canvas.on('mouseout', function () {
                    harmonographController.nextTip(4);
                });

                $canvas.on('touchend', function () {
                    harmonographController.nextTip(4);
                });

                $canvas.on('mousemove', function (evt) {
                    var eventPos = harmonographInterface.getEventPos(evt, harmonographController.shiftPressed);
                    harmonographModel.setPenParams(eventPos);
                    requestAnimationFrame(harmonographController.redraw);
                });

                $canvas.on('click', function (evt) {
                    var eventPos = harmonographInterface.getEventPos(evt, harmonographController.shiftPressed);
                    harmonographModel.setTableParams(eventPos);
                    harmonographController.nextTip(3);
                });

                $canvas.on('touchstart', function (evt) {
                    evt.preventDefault();

                    var eventPos,
                        touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);

                    eventPos = harmonographInterface.getEventPos(touch);
                    harmonographModel.setTableParams(eventPos);

                    harmonographController.nextTip(2);
                });

                $canvas.on('touchmove', function (evt) {
                    var eventPos;
                    var touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
                    eventPos = harmonographInterface.getEventPos(touch);
                    harmonographModel.setPenParams(eventPos);
                    requestAnimationFrame(harmonographController.redraw);
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

                $dimensions.on('change', function () {
                    harmonographModel.setDimensions(this.value);
                });

                $(document).on('keydown', function (e) {
                    if (e.keyCode == 16) {
                        harmonographController.shiftPressed = true;
                        harmonographController.redraw();
                    }
                }).on('keyup', function (e) {
                    if (e.keyCode == 16) {
                        harmonographController.shiftPressed = false;
                        harmonographController.redraw();
                    }
                });

            },

            redraw: function () {
                harmonographModel.generateLissajous();
                harmonographInterface.drawLissajous(harmonographModel.lissajousFigure, harmonographController.shiftPressed);
            },

            nextTip: function (tipNumber) {
                setTimeout(function () { harmonographInterface.showNextTip(tipNumber); }, 7000);
            },

            init: function () {
                harmonographInterface.touchDevice();
                this.addListeners();
                this.redraw();
                harmonographInterface.addSharingShortCut();
                this.nextTip(1);
            }

        };

        var harmonographInterface = {

            // Check if it is a touch device
            touchDevice: function () {
                if ('ontouchstart' in document.documentElement) {
                    $('body').addClass('touchDevice');
                }
            },

            // Draw the figure
            drawLissajous: function (points, grid = false) {
                var $canvas = $('#myCanvas'),
                    canvasEl = $canvas[0],
                    $body = $('body'),
                    centerX = Math.round(canvasEl.width / 2),
                    centerY = Math.round(canvasEl.height / 2);

                if (points.length > 2) {
                    if (canvasEl.getContext) {
                        var ctx = canvasEl.getContext('2d'),
                            x = points[1][0] + centerX,
                            y = points[1][1] + centerY,
                            newX, newY,
                            f = 0.002, blue, red, green,
                            lines = [1 / 4, 1 / 2, 3 / 4, 1, 4 / 3, 2, 4],
                            largestSide = Math.max(canvasEl.width, canvasEl.height);

                        // With special thanks to Asad at Stackoverflow for helping out with the rainbow path.
                        canvasEl.width = $body.width();
                        canvasEl.height = $body.height();
                        canvasEl.style.width = $body.width() + 'px';
                        canvasEl.style.height = $body.height() + 'px';
                        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                        ctx.lineWidth = 2;

                        // draw grid
                        if (grid) {
                            for (var a = 0; a < lines.length; a++) {
                                ctx.beginPath();
                                ctx.moveTo(0, 0);
                                newX = largestSide;
                                newY = lines[a] * largestSide;
                                ctx.strokeStyle = 'rgba(245,245,245,0.1)'; // whitesmoke
                                ctx.lineTo(newX, newY);
                                ctx.stroke();
                                ctx.closePath();
                            }
                        }

                        // draw lissajous
                        for (var count = 2; count < points.length; count++) {
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            newX = points[count][0] + centerX;
                            newY = points[count][1] + centerY;
                            blue = Math.sin(f * count + 0) * 127 + 128;
                            red = Math.sin(f * count + 2) * 127 + 128;
                            green = Math.sin(f * count + 4) * 127 + 128;
                            ctx.strokeStyle = 'rgb(' + Math.round(red) + ', ' + Math.round(green) + ', ' + Math.round(blue) + ')';
                            x = newX;
                            y = newY;
                            ctx.lineTo(x, y);
                            ctx.stroke();
                            ctx.closePath();
                        }
                    } else {
                        console.log('canvas not supported');
                    }
                }
            },

            getEventPos: function (evt, constrain = false) {
                var x = evt.clientX,
                    y = evt.clientY,
                    ratio, closestRatio,
                    harmonics = [1 / 4, 1 / 2, 3 / 4, 1, 4 / 3, 2, 4];

                if (y > 0) {
                    ratio = x / y;
                }
                if (constrain) {
                    closestRatio = harmonics.reduce(function (prev, curr) {
                        return (Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev);
                    });
                    y = x / closestRatio;
                }
                console.log(constrain, x, y);
                return {
                    x: x,
                    y: y
                };
            },

            imageId: 0,
            newimageId: function () {
                this.imageId = Math.floor((Math.random() * 100000) % 100000 + '');
                return this.imageId;
            },
            newHref: null,

            // Save the canvasdata as image with random number in name.
            saveHarmonogram: function () {
                var $canvas = $('#myCanvas')[0],
                    canvasData = $canvas.toDataURL("image/png"),
                    ajax = new XMLHttpRequest();

                this.newimageId();
                this.newHref = 'snapshot.php' + '?imageId=' + this.imageId;
                ajax.open("POST", this.newHref, false);
                ajax.setRequestHeader('Content-Type', 'application/upload');
                ajax.send(canvasData);
                //window.open('your-harmonogram.php?imageId='+ imgId);
            },

            addSharingShortCut: function () {
                shortcut.add('Space', function () {
                    harmonographInterface.saveHarmonogram();
                    window.location = harmonographInterface.newHref;
                });
            },

            showNextTip: function (tipNumber) {
                $('.wizzard p').removeClass('active');
                $('.wizzard p:nth-child(' + tipNumber + ')').addClass('active');
            }
        };

        var harmonographModel = {

            parameters: {
                dimensions: 2,
                amplitudes: [250, 250, 100, 0],
                stepSizes: [Math.PI / 45, Math.PI / 45, Math.PI / 45, Math.PI / 45],
                friction: [0.9992, 0.9992, 0.9996, 0.9996]
            },

            lissajousFigure: [],

            setPenParams: function (ePos) {
                this.parameters.amplitudes[0] = Math.sqrt(ePos.x) * 15;
                this.parameters.amplitudes[1] = Math.sqrt(ePos.y) * 15;
                this.parameters.stepSizes[0] = Math.sqrt(ePos.y) / ePos.x;
                this.parameters.stepSizes[1] = Math.sqrt(ePos.x) / ePos.y;
            },

            setTableParams: function (ePos) {
                this.parameters.amplitudes[2] = Math.sqrt(ePos.x) * 15;
                if (this.parameters.dimensions < 3) {
                    this.parameters.amplitudes[3] = 0;
                } else {
                    this.parameters.amplitudes[3] = Math.sqrt(ePos.y) * 15;
                }
                this.parameters.stepSizes[2] = Math.sqrt(ePos.y) / ePos.x;
                this.parameters.stepSizes[3] = Math.sqrt(ePos.x) / ePos.y;
            },

            setDimensions: function (val) {
                this.parameters.dimensions = val;
            },

            generateLissajous: function () {
                var point = [0, 0],
                    max = this.parameters.amplitudes.slice(),
                    angle = [0, 0, 0, 0];

                this.lissajousFigure = [];

                while ((max[0] > 5) || (max[1] > 5)) {

                    // Calc points
                    point = [0, 0];
                    for (var dim = 0; dim <= this.parameters.dimensions; dim += 2) {
                        point[0] += (Math.sin(angle[dim]) * max[dim]);
                        point[1] += (Math.cos(angle[dim + 1]) * max[dim + 1]);
                    }

                    // Push the new point on array
                    this.lissajousFigure.push(point.slice());

                    // Increase angles with stepsizes					
                    for (dim = 0; dim <= this.parameters.dimensions; dim++) {
                        angle[dim] += this.parameters.stepSizes[dim];
                    }

                    //Apply friction with factor < 0 to Amplitudes   
                    for (dim = 0; dim <= this.parameters.dimensions; dim++) {
                        max[dim] = max[dim] * this.parameters.friction[dim];
                    }
                }
                // console.log(this.lissajousFigure.length);
            }
        };

        harmonographController.init();

    }());

});

// Save parameters with image to regenerate it?