class PlayerControler {

    private _pointerIsDown: boolean = false;

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
        }
        else if (event.code === "KeyS") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
        }
        else if (event.code === "KeyA") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
        }
        else if (event.code === "KeyD") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
        }
        else if (event.code === "KeyE") {    
            let gamepads = navigator.getGamepads();
            console.log(gamepads);
            if (gamepads[0]) {
                
            }
            for (let i = 0; i < 10; i++) {
            
            }
        }
    }

    private _keyUp = (event: KeyboardEvent) => {
        if (event.code === "KeyW") {
            this.player.inputZ -= 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, - 1, 0);
        }
        else if (event.code === "KeyS") {
            this.player.inputZ += 1;
            this.player.inputZ = Nabu.MinMax(this.player.inputZ, 0, 1);
        }
        else if (event.code === "KeyA") {
            this.player.inputX += 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, 0, 1);
        }
        else if (event.code === "KeyD") {
            this.player.inputX -= 1;
            this.player.inputX = Nabu.MinMax(this.player.inputX, - 1, 0);
        }
    }

    private _pointerDown = (event: PointerEvent) => {
        this._pointerIsDown = true;
    }

    private _pointerMove = (event: PointerEvent) => {
        if (this._pointerIsDown) {
            this.player.rotation.y += event.movementX / 500;
            this.player.head.rotation.x += event.movementY / 500;
            this.player.head.rotation.x = Nabu.MinMax(this.player.head.rotation.x, - Math.PI * 0.5, Math.PI * 0.5);
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
            this.player.inputX = this.testDeadZone(gamepad.axes[0]);
            this.player.inputZ = - this.testDeadZone(gamepad.axes[1]);
            this.player.rotation.y += this.testDeadZone(gamepad.axes[2]) / 100;
            this.player.head.rotation.x += this.testDeadZone(gamepad.axes[3]) / 100;
            this.player.head.rotation.x = Nabu.MinMax(this.player.head.rotation.x, - Math.PI * 0.5, Math.PI * 0.5);
        }
    }
}