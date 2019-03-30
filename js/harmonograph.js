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
                    clearInterval(gogogo);
                    harmonographController.nextTip(4);
                });

                $canvas.on('touchend', function () {
                    clearInterval(gogogo);
                    harmonographController.nextTip(4);
                });

                $canvas.on('mousemove', function (evt) {
                    var eventPos = harmonographInterface.getEventPos($elem, evt);
                    harmonographModel.setPenParams(eventPos);
                    requestAnimationFrame(harmonographController.redraw);
                });

                $canvas.on('click', function (evt) {
                    var eventPos = harmonographInterface.getEventPos($elem, evt);
                    harmonographModel.setTableParams(eventPos);
                    harmonographController.nextTip(3);
                });

                $canvas.on('touchstart', function (evt) {
                    evt.preventDefault();

                    var eventPos,
                        touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);

                    eventPos = harmonographInterface.getEventPos($canvas, touch);
                    harmonographModel.setTableParams(eventPos);

                    harmonographController.nextTip(2);
                });

                $canvas.on('touchmove', function (evt) {
                    var eventPos;
                    var touch = (evt.originalEvent.touches[0] || evt.changedTouches[0]);
                    eventPos = harmonographInterface.getEventPos($canvas, touch);
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
            },

            redraw: function () {
                harmonographModel.generateLissajous();
                harmonographInterface.drawLissajous(harmonographModel.lissajousFigure);
            },

            nextTip: function (tipNumber) {
                setTimeout(function () { harmonographInterface.showNextTip(tipNumber); }, 3000);
            },

            init: function () {
                harmonographInterface.touchDevice();
                harmonographInterface.ieRangefix();
                this.addListeners();
                this.redraw();
                harmonographInterface.addSharingShortCut();
                this.nextTip(1);
            }

        };

        var harmonographInterface = {

            currentTip: 1,

            // Check if it is a touch device
            touchDevice: function () {
                if ('ontouchstart' in document.documentElement) {
                    $('body').addClass('touchDevice');
                }
            },

            ieRangefix: function () {
                if ($.browser.msie) {
                    if (parseInt($.browser.version, 10) < 10) {
                        $('body').addClass('msie');
                    }
                }
            },

            // Draw the figure
            drawLissajous: function (points) {
                var $canvas = $('#myCanvas')[0],
                    $body = $('body'),
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
                        $canvas.width = $body.width();
                        $canvas.height = $body.height();
                        $canvas.style.width = $body.width() + 'px';
                        $canvas.style.height = $body.height() + 'px';
                        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
                        ctx.lineWidth = 2;
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

            drawGrid: function () {
                var $canvas = $('#myCanvas'),
                    canvasEl = $canvas[0],
                    $body = $('body'),
                    lines = [1 / 4, 1 / 2, 3 / 4, 1, 4 / 3, 2, 4],
                    largestSide = Math.max($canvas.width(), $canvas.height());

                if ($canvas.getContext) {
                    var ctx = $canvas.getContext('2d'),
                        x = points[1][0] + centerX,
                        y = points[1][1] + centerY,
                        newX, newY,
                        f = 0.002, blue, red, green;
                    canvasEl.width = $body.width();
                    canvasEl.height = $body.height();
                    canvasEl.style.width = $body.width() + 'px';
                    canvasEl.style.height = $body.height() + 'px';

                    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                    ctx.lineWidth = 2;

                    for (var a = 0; a < lines.length; a++) {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        newX = largestSide;
                        newY = lines[a] * largestSide;
                        ctx.strokeStyle = 'rgb(245,245,245)'; // whitesmoke
                        x = newX;
                        y = newY;
                        ctx.lineTo(x, y);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }

            },

            getEventPos: function (canvas, evt) {
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
                console.log(this.lissajousFigure.length);
            }
        };

        harmonographController.init();

    }());

});

// Save parameters with image to regenerate it?