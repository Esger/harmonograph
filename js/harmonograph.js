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
                    $thickness = $('#thickness'),
                    $rotation = $('#rotation'),
                    $damping = $('#damping'),
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
                    harmonographController.redraw();
                });

                $thickness.on('input change', function () {
                    harmonographModel.setThickness(this.value);
                    harmonographController.redraw();
                });

                $rotation.on('input change', function () {
                    harmonographModel.setRotation(this.value);
                    harmonographController.redraw();
                });

                $damping.on('input change', function () {
                    harmonographModel.setDamping(this.value);
                    harmonographController.redraw();
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
                harmonographInterface.detectEnvironment();
                this.addListeners();
                this.redraw();
                harmonographInterface.addSharingShortCut();
                this.nextTip(1);
            }

        };

        var harmonographInterface = {

            // Check if it is a touch device
            detectEnvironment: function () {
                if ('ontouchstart' in document.documentElement) {
                    $('body').addClass('touchDevice');
                }
                if (window.parent !== window) {
                    // document is being loaded in an iframe
                    $('body').addClass('isIframed');
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
                        ctx.lineWidth = harmonographModel.parameters.thickness;

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
                        console.error('canvas not supported');
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
                console.info(constrain, x, y);
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
                amplitudes: [250, 250, 250, 250],
                stepSizes: [Math.PI / 45, Math.PI / 45.1, Math.PI / 45.2, Math.PI / 45.3],
                phases: [0, Math.PI / 2, Math.PI / 4, Math.PI / 3],
                friction: [0.9992, 0.9992, 0.9992, 0.9992],
                thickness: 1,
                rotationAmplitude: 3.14,
                rotationStepSize: Math.PI / 100
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
                this.parameters.dimensions = parseInt(val);
            },

            setThickness: function (val) {
                this.parameters.thickness = parseFloat(val);
            },

            setRotation: function (val) {
                this.parameters.rotationAmplitude = parseFloat(val) * Math.PI * 2;
            },

            setDamping: function (val) {
                var percentage = parseFloat(val);
                // Map 0% -> 0.9999 (least damping/long life)
                // Map 100% -> 0.9990 (most damping/short life)
                var d = 0.9999 - (percentage / 100) * 0.0009;
                for (var i = 0; i < 4; i++) {
                    this.parameters.friction[i] = d;
                }
            },

            generateLissajous: function () {
                var rawX, rawY, rotatedX, rotatedY,
                    max = this.parameters.amplitudes.slice(),
                    angle = [0, 0, 0, 0],
                    rotTimer = 0,
                    rotAngle = 0,
                    dampingRatio = 1;

                this.lissajousFigure = [];

                // Continue as long as any significant pendulum is still moving
                var limit = 2; // End when amplitude drops below 2 pixels
                var counts = 0;

                while ((max[0] > limit || max[1] > limit || max[2] > limit || max[3] > limit) && counts < 8000) {
                    counts++;

                    // Pendulum decay ratio for rotation
                    dampingRatio = max[0] / this.parameters.amplitudes[0];

                    // Calc raw pendulum positions
                    rawX = 0;
                    rawY = 0;

                    if (this.parameters.dimensions >= 1) rawX += Math.sin(angle[0] + this.parameters.phases[0]) * max[0];
                    if (this.parameters.dimensions >= 2) rawY += Math.cos(angle[1] + this.parameters.phases[1]) * max[1];
                    if (this.parameters.dimensions >= 3) rawX += Math.sin(angle[2] + this.parameters.phases[2]) * max[2];
                    if (this.parameters.dimensions >= 4) rawY += Math.cos(angle[3] + this.parameters.phases[3]) * max[3];

                    // Apply Rotary Oscillation (Swing)
                    rotAngle = this.parameters.rotationAmplitude * Math.sin(rotTimer) * dampingRatio;

                    rotatedX = rawX * Math.cos(rotAngle) - rawY * Math.sin(rotAngle);
                    rotatedY = rawX * Math.sin(rotAngle) + rawY * Math.cos(rotAngle);

                    this.lissajousFigure.push([rotatedX, rotatedY]);

                    // Update angles and apply damping
                    for (var i = 0; i < 4; i++) {
                        angle[i] += this.parameters.stepSizes[i];
                        max[i] *= this.parameters.friction[i];
                    }
                    rotTimer += this.parameters.rotationStepSize;
                }
            }
        };

        harmonographController.init();

    }());

});

// Save parameters with image to regenerate it?