/**
 * Harmonograph Simulator
 * Modernized ES6 Implementation
 */

// Iframe detection - add class to body if loaded in iframe
if (window.parent !== window) {
    // document is being loaded in an iframe
    if (document.body) {
        document.body.classList.add('isIframed');
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('isIframed');
        });
    }
}

class Harmonograph {
    constructor() {
        this.initCanvas();
        this.initDOM();
        this.initParams();
        this.addEventListeners();

        this.shiftPressed = false;
        this.menuOpen = false;
        this.points = [];

        // Start initial render
        this.updateCurrentYear();
        this.resize();
        this.render();
        this.initTooltips();
    }

    initCanvas() {
        this.canvas = document.getElementById('harmonographCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
    }

    initParams() {
        this.params = {
            dimensions: parseInt(this.inputs.dimensions.value),
            amplitudes: [250, 250, 250, 250],
            stepSizes: [Math.PI / 45, Math.PI / 45.1, Math.PI / 45.2, Math.PI / 45.3],
            phases: [0, Math.PI / 2, Math.PI / 4, Math.PI / 3],
            friction: [0.9992, 0.9992, 0.9992, 0.9992],
            thickness: parseFloat(this.inputs.thickness.value),
            rotationAmplitude: parseFloat(this.inputs.rotation.value) * Math.PI * 2,
            rotationStepSize: Math.PI / 100
        };
        this.setDamping(this.inputs.damping.value);
    }

    initDOM() {
        this.controlsPanel = id('controls');
        this.downloadBtn = id('downloadBtn');
        this.resetBtn = id('resetBtn');
        this.tooltip = id('tooltip');
        this.tooltipText = this.tooltip.querySelector('.tooltip-text');

        this.inputs = {
            dimensions: id('dimensions'),
            rotation: id('rotation'),
            damping: id('damping'),
            thickness: id('thickness'),
            natural: id('naturalMode'),
            customColor: id('customColor'),
            lineColor: id('lineColor')
        };

        this.colorPickerContainer = id('colorPickerContainer');

        // Capture initial values from HTML
        this.initialValues = {
            dimensions: this.inputs.dimensions.value,
            rotation: this.inputs.rotation.value,
            damping: this.inputs.damping.value,
            thickness: this.inputs.thickness.value,
            natural: this.inputs.natural.checked,
            customColor: this.inputs.customColor.checked,
            lineColor: this.inputs.lineColor.value
        };

        this.displays = {
            dimensions: id('dimensionsValue'),
            rotation: id('rotationValue'),
            damping: id('dampingValue'),
            thickness: id('thicknessValue'),
            color: id('colorValue')
        };

        // Initialize color picker UI state
        const isCustom = this.inputs.customColor.checked;
        this.colorPickerContainer.classList.toggle('rainbow-mode', !isCustom);
        this.displays.color.textContent = isCustom ? this.inputs.lineColor.value.toUpperCase() : 'RAINBOW';
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());

        // Parameter Sliders
        this.inputs.dimensions.addEventListener('input', (e) => this.handleParamChange('dimensions', e.target.value));
        this.inputs.rotation.addEventListener('input', (e) => this.handleParamChange('rotation', e.target.value));
        this.inputs.damping.addEventListener('input', (e) => this.handleParamChange('damping', e.target.value));
        this.inputs.thickness.addEventListener('input', (e) => this.handleParamChange('thickness', e.target.value));

        // Interaction
        this.canvas.addEventListener('mousemove', (e) => this.handleInteraction(e));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleInteraction(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => this.handleInteraction(e, true));
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.menuOpen) return;
            e.preventDefault();
            this.handleInteraction(e.touches[0], true);
        }, { passive: false });

        // Tooltip visibility
        this.canvas.addEventListener('mouseenter', () => this.tooltip.classList.add('visible'));
        this.canvas.addEventListener('mouseleave', () => this.tooltip.classList.remove('visible'));

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') this.shiftPressed = true;
            if (e.key.toLowerCase() === 'd') this.downloadImage();
            if (e.key.toLowerCase() === 'm') {
                try {
                    this.controlsPanel.togglePopover();
                } catch (err) {
                    // Fallback if togglePopover is not supported or errors
                    console.error('Popover toggle failed', err);
                }
            }
            if (e.key.toLowerCase() === 'r') this.reset();
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.shiftPressed = false;
        });

        // UI Controls
        this.inputs.natural.addEventListener('change', () => this.render());

        this.inputs.customColor.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.colorPickerContainer.classList.toggle('rainbow-mode', !enabled);
            this.displays.color.textContent = enabled ? this.inputs.lineColor.value.toUpperCase() : 'RAINBOW';
            this.render();
        });

        // Click wrapper to toggle mode and open picker
        this.colorPickerContainer.addEventListener('click', (e) => {
            if (!this.inputs.customColor.checked) {
                this.inputs.customColor.checked = true;
                this.inputs.customColor.dispatchEvent(new Event('change'));
            }
            // If click was on the container background or text, trigger the hidden color input
            if (e.target !== this.inputs.lineColor) {
                this.inputs.lineColor.click();
            }
        });

        this.inputs.lineColor.addEventListener('input', (e) => {
            if (this.inputs.customColor.checked) {
                this.displays.color.textContent = e.target.value.toUpperCase();
                this.render();
            }
        });

        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Menu state tracking
        this.controlsPanel.addEventListener('toggle', (e) => {
            this.menuOpen = e.newState === 'open';
            this.canvas.classList.toggle('interaction-disabled', this.menuOpen);
        });
    }

    initTooltips() {
        this.tips = [
            "Move your pointer slowly to adjust the primary pendulum",
            "Click to adjust the secondary pendulum",
            "Press SHIFT to interlock x and y axes of the same pendulums",
            "Press M to open the menu",
            "Press R to reset all parameters",
            "Press D to download the harmonogram"
        ];
        this.currentTipIndex = 0;

        setInterval(() => {
            this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
            this.tooltipText.style.opacity = 0;

            setTimeout(() => {
                this.tooltipText.textContent = this.tips[this.currentTipIndex];
                this.tooltipText.style.opacity = 1;
            }, 500); // Wait for fade out
        }, 10000); // 15 seconds
    }

    handleParamChange(key, value) {
        const val = parseFloat(value);
        this.displays[key].textContent = val.toFixed(key === 'dimensions' || key === 'damping' ? 0 : 2);

        switch (key) {
            case 'dimensions':
                this.params.dimensions = parseInt(val);
                break;
            case 'rotation':
                this.params.rotationAmplitude = val * Math.PI * 2;
                break;
            case 'damping':
                this.setDamping(val);
                break;
            case 'thickness':
                this.params.thickness = val;
                break;
        }
        this.render();
    }

    setDamping(percentage) {
        // Map 0% -> 0.9999 (least damping/long life)
        // Map 100% -> 0.9990 (most damping/short life)
        const d = 0.9999 - (percentage / 100) * 0.0009;
        for (let i = 0; i < 4; i++) {
            this.params.friction[i] = d;
        }
    }

    handleInteraction(e, isClick = false) {
        if (this.menuOpen) return;
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Normalized coordinates (0 to 1)
        let nx = (e.clientX - rect.left) / width;
        let ny = (e.clientY - rect.top) / height;

        // Clamp to avoid division by zero and extreme values
        nx = Math.max(0.001, Math.min(0.999, nx));
        ny = Math.max(0.001, Math.min(0.999, ny));

        if (this.shiftPressed) {
            const harmonics = [0.25, 0.5, 0.75, 1, 1.33, 2, 4];
            const ratio = nx / ny;
            const closest = harmonics.reduce((prev, curr) =>
                Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
            );
            ny = nx / closest;
        }

        // Virtual coordinates for agnostic parameter mapping (0 to 1000)
        const vx = nx * 1000;
        const vy = ny * 1000;

        if (isClick) {
            // Set Table Params (Pendulums 3 & 4)
            this.params.amplitudes[2] = Math.sqrt(vx) * 15;
            this.params.amplitudes[3] = this.params.dimensions >= 3 ? Math.sqrt(vy) * 15 : 0;
            this.params.stepSizes[2] = Math.sqrt(vy) / (vx || 1);
            this.params.stepSizes[3] = Math.sqrt(vx) / (vy || 1);
        } else {
            // Set Pen Params (Pendulums 1 & 2)
            this.params.amplitudes[0] = Math.sqrt(vx) * 15;
            this.params.amplitudes[1] = Math.sqrt(vy) * 15;

            if (this.inputs.natural.checked) {
                // Natural mode: frequencies stay very close (approx 1:1)
                const rawFreq0 = Math.sqrt(vy) / (vx || 1);
                const rawFreq1 = Math.sqrt(vx) / (vy || 1);
                const avgFreq = (rawFreq0 + rawFreq1) / 2;

                // Allow a tiny difference (5%) for slow evolution
                const diff = (rawFreq1 - rawFreq0) * 0.05;

                this.params.stepSizes[0] = avgFreq - diff;
                this.params.stepSizes[1] = avgFreq + diff;

                // Ensure phase offset for elliptical movement
                this.params.phases[1] = Math.PI / 2;
            } else {
                this.params.stepSizes[0] = Math.sqrt(vy) / (vx || 1);
                this.params.stepSizes[1] = Math.sqrt(vx) / (vy || 1);
            }
        }

        this.render();
    }

    generatePoints() {
        const { dimensions, amplitudes, stepSizes, phases, friction, rotationAmplitude, rotationStepSize } = this.params;
        const currentAmps = [...amplitudes];
        const angles = [0, 0, 0, 0];
        let rotTimer = 0;

        this.points = [];
        const limit = 2;
        let count = 0;

        while ((currentAmps[0] > limit || currentAmps[1] > limit || currentAmps[2] > limit || currentAmps[3] > limit) && count < 8000) {
            const dampingRatio = currentAmps[0] / (amplitudes[0] || 1);

            let rawX = 0;
            let rawY = 0;

            if (dimensions >= 1) rawX += Math.sin(angles[0] + phases[0]) * currentAmps[0];
            if (dimensions >= 2) rawY += Math.cos(angles[1] + phases[1]) * currentAmps[1];
            if (dimensions >= 3) rawX += Math.sin(angles[2] + phases[2]) * currentAmps[2];
            if (dimensions >= 4) rawY += Math.cos(angles[3] + phases[3]) * currentAmps[3];

            const rotAngle = rotationAmplitude * Math.sin(rotTimer) * dampingRatio;

            const rotatedX = rawX * Math.cos(rotAngle) - rawY * Math.sin(rotAngle);
            const rotatedY = rawX * Math.sin(rotAngle) + rawY * Math.cos(rotAngle);

            this.points.push([rotatedX, rotatedY]);

            for (let i = 0; i < 4; i++) {
                angles[i] += stepSizes[i];
                currentAmps[i] *= friction[i];
            }
            rotTimer += rotationStepSize;
            count++;
        }
    }

    render() {
        this.generatePoints();

        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;
        const centerX = width / 2;
        const centerY = height / 2;

        // Scale to fit the smallest screen dimension (agnostic unit system)
        const scale = Math.min(width, height) / 1000;

        this.ctx.fillStyle = '#0a0a0c';
        this.ctx.fillRect(0, 0, width, height);

        if (this.points.length < 2) return;

        this.ctx.lineWidth = this.params.thickness * scale * 2; // Scale thickness with view
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const f = 0.002;
        const useCustom = this.inputs.customColor.checked;
        const customColor = this.inputs.lineColor.value;

        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0][0] * scale + centerX, this.points[0][1] * scale + centerY);

        for (let i = 1; i < this.points.length; i++) {
            if (useCustom) {
                this.ctx.strokeStyle = customColor;
            } else {
                const blue = Math.sin(f * i + 0) * 127 + 128;
                const red = Math.sin(f * i + 2) * 127 + 128;
                const green = Math.sin(f * i + 4) * 127 + 128;
                this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
            }

            this.ctx.lineTo(this.points[i][0] * scale + centerX, this.points[i][1] * scale + centerY);

            if (i % 20 === 0) {
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(this.points[i][0] * scale + centerX, this.points[i][1] * scale + centerY);
            }
        }
        this.ctx.stroke();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.render();
    }

    downloadImage() {
        const link = document.createElement('a');
        const timestamp = Date.now();

        // Check for JPEG XL support (falls back to WebP if unsupported)
        const jxlData = this.canvas.toDataURL('image/jxl');
        const isJxlSupported = jxlData.startsWith('data:image/jxl');

        if (isJxlSupported) {
            link.download = `harmonograph-${timestamp}.jxl`;
            link.href = jxlData;
        } else {
            link.download = `harmonograph-${timestamp}.webp`;
            link.href = this.canvas.toDataURL('image/webp');
        }

        link.click();
    }

    reset() {
        // Restore values to inputs
        this.inputs.dimensions.value = this.initialValues.dimensions;
        this.inputs.rotation.value = this.initialValues.rotation;
        this.inputs.damping.value = this.initialValues.damping;
        this.inputs.thickness.value = this.initialValues.thickness;
        this.inputs.natural.checked = this.initialValues.natural;
        this.inputs.customColor.checked = this.initialValues.customColor;
        this.inputs.lineColor.value = this.initialValues.lineColor;

        // Reset color container state
        this.colorPickerContainer.classList.toggle('rainbow-mode', !this.initialValues.customColor);
        this.displays.color.textContent = this.initialValues.customColor ?
            this.initialValues.lineColor.toUpperCase() : 'RAINBOW';

        this.initParams();

        // Update Displays
        Object.keys(this.displays).forEach(key => {
            if (key === 'color') return; // Handled above
            const val = this.inputs[key].value;
            this.displays[key].textContent = (key === 'dimensions' || key === 'damping') ?
                parseInt(val) : parseFloat(val).toFixed(2);
        });

        this.render();
    }

    updateCurrentYear() {
        id('currentYear').textContent = new Date().getFullYear();
    }
}

// Utility
function id(name) { return document.getElementById(name); }

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.harmonograph = new Harmonograph();
});