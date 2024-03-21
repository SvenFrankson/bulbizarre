class PlayerControler {

    public get inputManager(): Nabu.InputManager {
        return this.player.game.inputManager;
    }

    private _pointerIsDown: boolean = false;
    public gamepadInControl: boolean = false;

    public aim: HTMLCanvasElement;

    constructor(public player: Player) {
        player.controler = this;
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

    public initialize(): void {
        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION, () => {
            if (this.player.currentAction) {
                this.player.currentAction.onClick(this.player.currentChuncks);
            }
        })
        
        for (let slotIndex = 0; slotIndex < 10; slotIndex++) {
            this.inputManager.addMappedKeyDownListener(KeyInput.ACTION_SLOT_0 + slotIndex, () => {
                if (this.player.playerActionManager) {
                    this.player.playerActionManager.equipAction(slotIndex);
                }
            })
        }

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_EQUIP, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.equipAction(this.player.playerActionManager.equipedActionIndex);
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_DEC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.equipAction(this.player.playerActionManager.prevActionIndex());
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_INC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.equipAction(this.player.playerActionManager.nextActionIndex());
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY, () => {
            if (this.player.game.playerInventoryView.shown) {
                this.player.game.playerInventoryView.hide();
            }
            else {
                this.player.game.playerInventoryView.show();
            }
        })
    }

    private _pointerDown = (event: PointerEvent) => {
        if (!this.player.game.router.inPlayMode) {
            return;
        }
        this._pointerIsDown = true;
        if (this.player.currentAction) {
            this.player.currentAction.onClick(this.player.currentChuncks);
        }
    }

    private _pointerMove = (event: PointerEvent) => {
        if (!this.player.game.router.inPlayMode) {
            return;
        }
        if (this._pointerIsDown || this.inputManager.isPointerLocked) {
            this.gamepadInControl = false;
            this.player.inputDeltaX += event.movementX;
            this.player.inputDeltaY += event.movementY;
        }
    }

    private _pointerUp = (event: PointerEvent) => {
        if (!this.player.game.router.inPlayMode) {
            return;
        }
        this._pointerIsDown = false;
    }

    private testDeadZone(v: number, threshold: number = 0.1): number {
        if (Math.abs(v) > threshold) {
            return (v - threshold * Math.sign(v)) / (1 - threshold);
        }
        return 0;
    }

    public update(dt: number): void {
        this.player.inputX = 0;
        this.player.inputZ = 0;

        if (this.player.game.router.inPlayMode) {
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_FORWARD)) {
                this.player.inputZ += 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_BACK)) {
                this.player.inputZ -= 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_RIGHT)) {
                this.player.inputX += 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_LEFT)) {
                this.player.inputX -= 1;
                this.gamepadInControl = false;
            }
    
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
            }
        }
        else {
            this.gamepadInControl = false;
        }
        
        if (this.gamepadInControl || this.inputManager.isPointerLocked) {
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