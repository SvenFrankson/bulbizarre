class PlayerControler {

    public get inputManager(): Nabu.InputManager {
        return this.player.game.inputManager;
    }

    public get playerActionView(): PlayerActionView {
        return this.player.game.playerActionView;
    }

    public get playerInventoryView(): PlayerInventoryView {
        return this.player.game.playerInventoryView;
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
            if (!this.playerInventoryView.shown) {
                if (this.player.currentAction) {
                    this.player.currentAction.onClick(this.player.currentChuncks);
                }
            }
        })
        
        for (let slotIndex = 0; slotIndex < 10; slotIndex++) {
            this.inputManager.addMappedKeyDownListener(KeyInput.ACTION_SLOT_0 + slotIndex, () => {
                if (this.player.playerActionManager) {
                    if (slotIndex === this.player.playerActionManager.currentActionIndex) {
                        this.player.playerActionManager.toggleEquipAction();
                    }
                    else {
                        this.player.playerActionManager.setActionIndex(slotIndex);
                        this.player.playerActionManager.equipAction();
                    }
                }
            })
        }

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_EQUIP, () => {
            if (!this.playerInventoryView.shown) {
                if (this.player.playerActionManager) {
                    this.player.playerActionManager.toggleEquipAction();
                }
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_DEC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.setActionIndex(this.player.playerActionManager.prevActionIndex());
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_INC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.setActionIndex(this.player.playerActionManager.nextActionIndex());
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.hide();
            }
            else {
                this.playerInventoryView.show();
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_PREV_CAT, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.prevCategory);
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_NEXT_CAT, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.nextCategory);
            }
        })

        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_EQUIP_ITEM, () => {
            if (this.playerInventoryView.shown) {
                let item = this.playerInventoryView.getCurrentItem();
                if (item) {
                    let action = item.getPlayerAction(this.player);
                    this.player.playerActionManager.linkAction(action, this.player.playerActionManager.currentActionIndex);
                    if (this.player.playerActionManager.alwaysEquip) {
                        this.player.playerActionManager.equipAction();
                    }
                }
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

    public update(dt: number): void {
        this.player.inputX = 0;
        this.player.inputZ = 0;

        if (this.playerInventoryView.shown) {
            this.playerInventoryView.update(dt);
            this.gamepadInControl = false;
        }
        else if (this.player.game.router.inPlayMode) {
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
                let axis0 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[0]);
                let axis1 = - Nabu.InputManager.DeadZoneAxis(gamepad.axes[1]);
                let axis2 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[2]);
                let axis3 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[3]);
    
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
        
        if (this.playerInventoryView.shown) {
            this.aim.style.display = "none";
            document.body.style.cursor = "auto";
        }
        else if (this.gamepadInControl || this.inputManager.isPointerLocked) {
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