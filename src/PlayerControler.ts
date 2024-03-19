class PlayerControler {

    private _pointerIsDown: boolean = false;
    public gamepadInControl: boolean = false;

    public aim: HTMLCanvasElement;

    constructor(public player: Player) {
        player.controler = this;
        window.addEventListener("keydown", this._keyDown);
        window.addEventListener("keyup", this._keyUp);
        window.addEventListener("pointerdown", this._pointerDown);
        window.addEventListener("pointermove", this._pointerMove);
        window.addEventListener("pointerup", this._pointerUp);

        this.aim = document.createElement("canvas");
        this.aim.width = 21;
        this.aim.height = 21;
        document.body.appendChild(this.aim);

        let context = this.aim.getContext("2d");
        context.fillStyle = "#00ff00";
        context.fillRect(0, 10, 21, 1);
        context.fillRect(10, 0, 1, 21);

        this.aim.style.zIndex = "10";
        this.aim.style.position = "fixed";
        this.aim.style.pointerEvents = "none";
    }

    private _keyDown = (event: KeyboardEvent) => {
        if (event.code === "KeyW") {
            this.player.inputZ += 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, 0, 1);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyS") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyA") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyD") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
            this.gamepadInControl = false;
        }
    }

    private _keyUp = (event: KeyboardEvent) => {
        if (event.code === "KeyW") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyS") {
            this.player.inputZ += 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, 0, 1);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyA") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
            this.gamepadInControl = false;
        }
        else if (event.code === "KeyD") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
            this.gamepadInControl = false;
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
            this.gamepadInControl = false;
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

    public lastB0: number;
    public update(dt: number): void {
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let axis0 = this.testDeadZone(gamepad.axes[0]);
            let axis1 = - this.testDeadZone(gamepad.axes[1]);
            let axis2 = this.testDeadZone(gamepad.axes[2]);
            let axis3 = this.testDeadZone(gamepad.axes[3]);

            this.gamepadInControl = this.gamepadInControl || (axis0 != 0);
            this.gamepadInControl = this.gamepadInControl || (axis1 != 0);
            this.gamepadInControl = this.gamepadInControl || (axis2 != 0);
            this.gamepadInControl = this.gamepadInControl || (axis3 != 0);

            if (this.gamepadInControl) {
                this.player.inputX = axis0;
                this.player.inputZ = axis1;
                this.player.inputRY = axis2;
                this.player.inputRX = axis3;
            }

            if (this.lastB0 != gamepad.buttons[0].value) {
                if (gamepad.buttons[0].value) {
                    if (this.player.currentAction) {
                        this.player.currentAction.onClick(this.player.currentChuncks);
                    }
                }
                this.lastB0 = gamepad.buttons[0].value;
            }
        }
        
        if (this.gamepadInControl) {
            this.aim.style.top = (window.innerHeight * 0.5 - 10).toFixed(0) + "px";
            this.aim.style.left = (window.innerWidth * 0.5 - 10).toFixed(0) + "px";
            this.aim.style.display = "block";
            document.body.style.cursor = "none";
        }
        else {
            this.aim.style.display = "none";
            document.body.style.cursor = "auto";
        }
    }
}