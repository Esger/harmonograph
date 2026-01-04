/**
 * Harmonograph Simulator
 * Modernized ES6 Implementation
 */

class Harmonograph {
    constructor() {
        this.initCanvas();
        this.initDOM();
        this.initParams();
        this.addEventListeners();

        this.shiftPressed = false;
        this.points = [];

        // Start initial render
        this.updateCurrentYear();
        this.resize();
        this.render();
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

        this.inputs = {
            dimensions: id('dimensions'),
            rotation: id('rotation'),
            damping: id('damping'),
            thickness: id('thickness'),
            natural: id('naturalMode')
        };

        // Capture initial values from HTML
        this.initialValues = {
            dimensions: this.inputs.dimensions.value,
            rotation: this.inputs.rotation.value,
            damping: this.inputs.damping.value,
            thickness: this.inputs.thickness.value,
            natural: this.inputs.natural.checked
        };

        this.displays = {
            dimensions: id('dimensionsValue'),
            rotation: id('rotationValue'),
            damping: id('dampingValue'),
            thickness: id('thicknessValue')
        };
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
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.shiftPressed = false;
        });

        // UI Controls
        this.inputs.natural.addEventListener('change', () => this.render());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.reset());
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
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        if (this.shiftPressed) {
            const harmonics = [0.25, 0.5, 0.75, 1, 1.33, 2, 4];
            const ratio = x / (y || 1);
            const closest = harmonics.reduce((prev, curr) =>
                Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
            );
            y = x / closest;
        }

        if (isClick) {
            // Set Table Params (Pendulums 3 & 4)
            this.params.amplitudes[2] = Math.sqrt(x) * 15;
            this.params.amplitudes[3] = this.params.dimensions >= 3 ? Math.sqrt(y) * 15 : 0;
            this.params.stepSizes[2] = Math.sqrt(y) / (x || 1);
            this.params.stepSizes[3] = Math.sqrt(x) / (y || 1);
        } else {
            // Set Pen Params (Pendulums 1 & 2)
            this.params.amplitudes[0] = Math.sqrt(x) * 15;
            this.params.amplitudes[1] = Math.sqrt(y) * 15;

            if (this.inputs.natural.checked) {
                // Natural mode: frequencies stay very close (approx 1:1) to allow for precessing ellipses
                const rawFreq0 = Math.sqrt(y) / (x || 1);
                const rawFreq1 = Math.sqrt(x) / (y || 1);
                const avgFreq = (rawFreq0 + rawFreq1) / 2;

                // Allow a tiny difference (0.5%) for that "natural" slow rotation/evolution
                const diff = (rawFreq1 - rawFreq0) * 0.05;

                this.params.stepSizes[0] = avgFreq - diff;
                this.params.stepSizes[1] = avgFreq + diff;

                // Ensure phase offset for elliptical movement
                this.params.phases[1] = Math.PI / 2;
            } else {
                this.params.stepSizes[0] = Math.sqrt(y) / (x || 1);
                this.params.stepSizes[1] = Math.sqrt(x) / (y || 1);
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
        const centerX = this.canvas.width / (2 * dpr);
        const centerY = this.canvas.height / (2 * dpr);

        this.ctx.fillStyle = '#0a0a0c';
        this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

        if (this.points.length < 2) return;

        this.ctx.lineWidth = this.params.thickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const f = 0.002;
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0][0] + centerX, this.points[0][1] + centerY);

        for (let i = 1; i < this.points.length; i++) {
            const blue = Math.sin(f * i + 0) * 127 + 128;
            const red = Math.sin(f * i + 2) * 127 + 128;
            const green = Math.sin(f * i + 4) * 127 + 128;

            this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
            this.ctx.lineTo(this.points[i][0] + centerX, this.points[i][1] + centerY);

            // To make the rainbow effect work line by line, we might need a different approach
            // But for performance at 8000 points, batching or many paths is needed.
            if (i % 20 === 0) {
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(this.points[i][0] + centerX, this.points[i][1] + centerY);
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
        link.download = `harmonograph-${Date.now()}.webp`;
        link.href = this.canvas.toDataURL('image/webp');
        link.click();
    }

    reset() {
        // Restore values to inputs
        this.inputs.dimensions.value = this.initialValues.dimensions;
        this.inputs.rotation.value = this.initialValues.rotation;
        this.inputs.damping.value = this.initialValues.damping;
        this.inputs.thickness.value = this.initialValues.thickness;
        this.inputs.natural.checked = this.initialValues.natural;

        this.initParams();

        // Update Displays
        Object.keys(this.displays).forEach(key => {
            const val = this.inputs[key].value;
            this.displays[key].textContent = key === 'dimensions' || key === 'damping' ?
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