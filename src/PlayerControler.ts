class PlayerControler {

    private _pointerIsDown: boolean = false;
    public gamepadCanControl: boolean = false;

    constructor(public player: Player) {
        player.controler = this;
        window.addEventListener("keydown", this._keyDown);
        window.addEventListener("keyup", this._keyUp);
        window.addEventListener("pointerdown", this._pointerDown);
        window.addEventListener("pointermove", this._pointerMove);
        window.addEventListener("pointerup", this._pointerUp);
    }

    private _keyDown = (event: KeyboardEvent) => {
        if (event.code === "KeyW") {
            this.player.inputZ += 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, 0, 1);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyS") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyA") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyD") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
            this.gamepadCanControl = false;
        }
    }

    private _keyUp = (event: KeyboardEvent) => {
        if (event.code === "KeyW") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyS") {
            this.player.inputZ += 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, 0, 1);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyA") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
            this.gamepadCanControl = false;
        }
        else if (event.code === "KeyD") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
            this.gamepadCanControl = false;
        }
    }

    private _pointerDown = (event: PointerEvent) => {
        this._pointerIsDown = true;
        if (this.player.currentAction) {
            this.player.currentAction.onClick(this.player.currentChuncks);
        }
    }

    private _pointerMove = (event: PointerEvent) => {
        if (this._pointerIsDown) {
            this.player.inputDeltaX += event.movementX;
            this.player.inputDeltaY += event.movementY;
        }
    }

    private _pointerUp = (event: PointerEvent) => {
        this._pointerIsDown = false;
    }

    private testDeadZone(v: number, threshold: number = 0.1): number {
        if (Math.abs(v) > threshold) {
            return (v - threshold * Math.sign(v)) / (1 - threshold);
        }
        return 0;
    }

    public update(dt: number): void {
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let axis0 = this.testDeadZone(gamepad.axes[0]);
            let axis1 = - this.testDeadZone(gamepad.axes[1]);
            let axis2 = this.testDeadZone(gamepad.axes[2]);
            let axis3 = this.testDeadZone(gamepad.axes[3]);

            this.gamepadCanControl = this.gamepadCanControl || (axis0 != 0);
            this.gamepadCanControl = this.gamepadCanControl || (axis1 != 0);
            this.gamepadCanControl = this.gamepadCanControl || (axis2 != 0);
            this.gamepadCanControl = this.gamepadCanControl || (axis3 != 0);

            if (this.gamepadCanControl) {
                this.player.inputX = axis0;
                this.player.inputZ = axis1;
                this.player.inputRY = axis2;
                this.player.inputRX = axis3;
            }
        }
    }
}