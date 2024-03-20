enum KeyInput {
    NULL = -1,
    ACTION_SLOT_0 = 0,
    ACTION_SLOT_1,
    ACTION_SLOT_2,
    ACTION_SLOT_3,
    ACTION_SLOT_4,
    ACTION_SLOT_5,
    ACTION_SLOT_6,
    ACTION_SLOT_7,
    ACTION_SLOT_8,
    ACTION_SLOT_9,
    PLAYER_ACTION,
    INVENTORY,
    MOVE_FORWARD,
    MOVE_LEFT,
    MOVE_BACK,
    MOVE_RIGHT,
    JUMP,
    MAIN_MENU,
    WORKBENCH,
}

class InputManager {

    public isPointerLocked: boolean = false;
    public isPointerDown: boolean = false;

    public padButtonsMap: Map<number, KeyInput> = new Map<number, KeyInput>();
    public padButtonsDown: Nabu.UniqueList<number> = new Nabu.UniqueList<number>();

    public keyboardInputMap: Map<string, KeyInput> = new Map<string, KeyInput>();
    
    public keyInputDown: Nabu.UniqueList<KeyInput> = new Nabu.UniqueList<KeyInput>();
    public keyDownListeners: ((k: KeyInput) => any)[] = [];
    public mappedKeyDownListeners: Map<KeyInput,(() => any)[]> = new Map<KeyInput,(() => any)[]>();
    public keyUpListeners: ((k: KeyInput) => any)[] = [];
    public mappedKeyUpListeners: Map<KeyInput,(() => any)[]> = new Map<KeyInput,(() => any)[]>();

    constructor(public scene: BABYLON.Scene, public canvas: HTMLCanvasElement, public game: Game) {
        
    }

    public initialize(player: Player): void {
        
        this.canvas.addEventListener("pointerdown", (ev: PointerEvent) => {
            this.isPointerDown = true;
            if (this.game.configuration.getValue("canLockPointer") === 1) {
                this.canvas.requestPointerLock();
                this.isPointerLocked = true;
            }
        });
        this.canvas.addEventListener("pointerup", () => {
            this.isPointerDown = false;
        });
        document.addEventListener("pointerlockchange", () => {
            if (!(document.pointerLockElement === this.canvas)) {
                this.isPointerLocked = false;
            }
        });

        this.mapInput("GamepadBtn0", KeyInput.PLAYER_ACTION);
        this.mapInput("Digit0", KeyInput.ACTION_SLOT_0);
        this.mapInput("Digit1", KeyInput.ACTION_SLOT_1);
        this.mapInput("Digit2", KeyInput.ACTION_SLOT_2);
        this.mapInput("Digit3", KeyInput.ACTION_SLOT_3);
        this.mapInput("Digit4", KeyInput.ACTION_SLOT_4);
        this.mapInput("Digit5", KeyInput.ACTION_SLOT_5);
        this.mapInput("Digit6", KeyInput.ACTION_SLOT_6);
        this.mapInput("Digit7", KeyInput.ACTION_SLOT_7);
        this.mapInput("Digit8", KeyInput.ACTION_SLOT_8);
        this.mapInput("Digit9", KeyInput.ACTION_SLOT_9);
        this.mapInput("KeyI", KeyInput.INVENTORY);
        this.mapInput("KeyW", KeyInput.MOVE_FORWARD);
        this.mapInput("KeyA", KeyInput.MOVE_LEFT);
        this.mapInput("KeyS", KeyInput.MOVE_BACK);
        this.mapInput("KeyD", KeyInput.MOVE_RIGHT);
        this.mapInput("Space", KeyInput.JUMP);
        this.mapInput("Backquote", KeyInput.MAIN_MENU);
        this.mapInput("KeyI", KeyInput.INVENTORY);
        this.mapInput("m", KeyInput.MAIN_MENU);
        this.mapInput("KeyC", KeyInput.WORKBENCH);

        window.addEventListener("keydown", (e) => {
            let keyInput = this.keyboardInputMap.get(e.code);
            if (!isFinite(keyInput)) {
                keyInput = this.keyboardInputMap.get(e.key);
            }
            if (isFinite(keyInput)) {
                this.doKeyInputDown(keyInput);
            }
        });
        window.addEventListener("keyup", (e) => {
            let keyInput = this.keyboardInputMap.get(e.code);
            if (!isFinite(keyInput)) {
                keyInput = this.keyboardInputMap.get(e.key);
            }
            if (isFinite(keyInput)) {
                this.doKeyInputUp(keyInput);
            }
        });
        /*
        document.getElementById("touch-menu").addEventListener("pointerdown", () => {
            let keyInput = KeyInput.MAIN_MENU;
            if (isFinite(keyInput)) {
                this.doKeyInputDown(keyInput);
            }
        })
        document.getElementById("touch-menu").addEventListener("pointerup", () => {
            let keyInput = KeyInput.MAIN_MENU;
            if (isFinite(keyInput)) {
                this.doKeyInputUp(keyInput);
            }
        })
        document.getElementById("touch-jump").addEventListener("pointerdown", () => {
            let keyInput = KeyInput.JUMP;
            if (isFinite(keyInput)) {
                this.doKeyInputDown(keyInput);
            }
        })
        document.getElementById("touch-jump").addEventListener("pointerup", () => {
            let keyInput = KeyInput.JUMP;
            if (isFinite(keyInput)) {
                this.doKeyInputUp(keyInput);
            }
        })
        */
        this.addMappedKeyUpListener(KeyInput.INVENTORY, () => {
            /*
            this.inventoryOpened = !this.inventoryOpened;
            if (this.game.configuration.getValue("canLockPointer") === 1) {
                if (this.inventoryOpened) {
                    document.exitPointerLock();
                    this.isPointerLocked = false;
                }
                else {
                    this.canvas.requestPointerLock();
                    this.isPointerLocked = true;
                }
            }
            */
        });
    }

    public update(): void {
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let hasButtonsDown: boolean = this.padButtonsDown.length > 0;
            for (let b = 0; b < gamepad.buttons.length; b++) {
                let v = gamepad.buttons[b].pressed;
                if (v) {
                    if (!this.padButtonsDown.contains(b)) {
                        this.padButtonsDown.push(b);
                        let key: KeyInput = this.padButtonsMap.get(b);
                        if (key) {
                            this.doKeyInputDown(key);
                        }
                    }
                }
                else if (hasButtonsDown) {
                    if (this.padButtonsDown.contains(b)) {
                        this.padButtonsDown.remove(b);
                        let key: KeyInput = this.padButtonsMap.get(b);
                        if (key) {
                            this.doKeyInputUp(key);
                        }
                    }
                }
            }
        }
    }

    private doKeyInputDown(keyInput: KeyInput): void {
        this.keyInputDown.push(keyInput);
        for (let i = 0; i < this.keyDownListeners.length; i++) {
            this.keyDownListeners[i](keyInput);
        }
        let listeners = this.mappedKeyDownListeners.get(keyInput);
        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                listeners[i]();
            }
        }
    }

    private doKeyInputUp(keyInput: KeyInput): void {
        this.keyInputDown.remove(keyInput);
        for (let i = 0; i < this.keyUpListeners.length; i++) {
            this.keyUpListeners[i](keyInput);
        }
        let listeners = this.mappedKeyUpListeners.get(keyInput);
        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                listeners[i]();
            }
        }
    }

    public mapInput(input: string, key: KeyInput): void {
        if (input.startsWith("GamepadBtn")) {
            let btnIndex = parseInt(input.replace("GamepadBtn", ""));
            this.padButtonsMap.set(btnIndex, key);
        }
        else {
            this.keyboardInputMap.set(input, key);
        }
    }

    public unMapInput(input: string): void {
        if (input.startsWith("GamepadBtn")) {
            let btnIndex = parseInt(input.replace("GamepadBtn", ""));
            this.padButtonsMap.delete(btnIndex);
        }
        else {
            this.keyboardInputMap.delete(input);
        }
    }

    /*
    public onTouchStart(): void {
        if (!this._firstTouchStartTriggered) {
            this.onFirstTouchStart();
        }
    }

    private _firstTouchStartTriggered: boolean = false;
    private onFirstTouchStart(): void {	
        let movePad = new PlayerInputMovePad(this.player);
        movePad.connectInput(true);
        
        let headPad = new PlayerInputHeadPad(this.player);
        headPad.connectInput(false);
        this._firstTouchStartTriggered = true;

        document.getElementById("touch-menu").style.display = "block";
        document.getElementById("touch-jump").style.display = "block";

        this.main.isTouch = true;
    }
    */

    public addKeyDownListener(callback: (k: KeyInput) => any): void {
        this.keyDownListeners.push(callback);
    }

    public addMappedKeyDownListener(k: KeyInput, callback: () => any): void {
        let listeners = this.mappedKeyDownListeners.get(k);
        if (listeners) {
            listeners.push(callback);
        }
        else {
            listeners = [callback];
            this.mappedKeyDownListeners.set(k, listeners);
        }
    }

    public removeKeyDownListener(callback: (k: KeyInput) => any): void {
        let i = this.keyDownListeners.indexOf(callback);
        if (i != -1) {
            this.keyDownListeners.splice(i, 1);
        }
    }

    public removeMappedKeyDownListener(k: KeyInput, callback: () => any): void {
        let listeners = this.mappedKeyDownListeners.get(k);
        if (listeners) {
            let i = listeners.indexOf(callback);
            if (i != -1) {
                listeners.splice(i, 1);
            }
        }
    }

    public addKeyUpListener(callback: (k: KeyInput) => any): void {
        this.keyUpListeners.push(callback);
    }

    public addMappedKeyUpListener(k: KeyInput, callback: () => any): void {
        let listeners = this.mappedKeyUpListeners.get(k);
        if (listeners) {
            listeners.push(callback);
        }
        else {
            listeners = [callback];
            this.mappedKeyUpListeners.set(k, listeners);
        }
    }

    public removeKeyUpListener(callback: (k: KeyInput) => any): void {
        let i = this.keyUpListeners.indexOf(callback);
        if (i != -1) {
            this.keyUpListeners.splice(i, 1);
        }
    }

    public removeMappedKeyUpListener(k: KeyInput, callback: () => any): void {
        let listeners = this.mappedKeyUpListeners.get(k);
        if (listeners) {
            let i = listeners.indexOf(callback);
            if (i != -1) {
                listeners.splice(i, 1);
            }
        }
    }

    public isKeyInputDown(keyInput: KeyInput): boolean {
        return this.keyInputDown.contains(keyInput);
    }

    public getkeyInputActionSlotDown(): KeyInput {
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_0)) {
            return KeyInput.ACTION_SLOT_0;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_1)) {
            return KeyInput.ACTION_SLOT_1;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_2)) {
            return KeyInput.ACTION_SLOT_2;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_3)) {
            return KeyInput.ACTION_SLOT_3;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_4)) {
            return KeyInput.ACTION_SLOT_4;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_5)) {
            return KeyInput.ACTION_SLOT_5;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_6)) {
            return KeyInput.ACTION_SLOT_6;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_7)) {
            return KeyInput.ACTION_SLOT_7;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_8)) {
            return KeyInput.ACTION_SLOT_8;
        }
        if (this.keyInputDown.contains(KeyInput.ACTION_SLOT_9)) {
            return KeyInput.ACTION_SLOT_9;
        }
        return KeyInput.NULL;
    }
}