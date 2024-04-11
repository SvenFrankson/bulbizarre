class PlayerActionView {

    private _tiles: HTMLDivElement[] = [];
    public getTile(slotIndex: number): HTMLDivElement {
        if (slotIndex < 0 || slotIndex > 9) {
            return undefined;
        }
        if (!this._tiles[slotIndex]) {
            this._tiles[slotIndex] = document.querySelector("#action-" + slotIndex.toFixed(0));
        }
        return this._tiles[slotIndex];
    }

    public player: Player;

    constructor() {
        
    }

    public initialize(player: Player): void {
        this.player = player;
        for (let i = 0; i <= 9; i++) {
            let slotIndex = i;
            let tile = this.getTile(i);
            tile.onclick = () => {
                if (this.player.playerActionManager) {
                    if (slotIndex === this.player.playerActionManager.currentActionIndex) {
                        this.player.playerActionManager.toggleEquipAction();
                    }
                    else {
                        this.player.playerActionManager.setActionIndex(slotIndex);
                        this.player.playerActionManager.equipAction();
                    }
                }
            }
        }
    }

    public highlight(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.add("highlit");
            }
        }
    }

    public unlight(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.remove("highlit");
            }
        }
    }

    public equip(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.add("equiped");
            }
        }
    }

    public unEquip(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.remove("equiped");
            }
        }
    }

    public onActionEquiped(slotIndex: number): void {
        for (let i = 0; i <= 9; i++) {
            this.unEquip(i);
        }
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.equip(slotIndex);
        }
    }

    public onHintStart(slotIndex: number): void {
        
    }

    public onHintEnd(slotIndex: number): void {

    }

    public onActionLinked(action: PlayerAction, slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                if (action.iconUrl) {
                    tile.style.background = "url(" + action.iconUrl + ")";
                    tile.style.backgroundSize = "contain";
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.style.backgroundPosition = "center";
                    tile.style.backgroundColor = action.backgroundColor;
                }
                else {
                    tile.style.background = undefined;
                    tile.style.backgroundColor = action.backgroundColor;
                }

                action._onIconUrlChanged = () => {
                    console.log(action.iconUrl);
                    tile.style.background = "url(" + action.iconUrl + ")";
                    tile.style.backgroundSize = "contain";
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.style.backgroundPosition = "center";
                    tile.style.backgroundColor = action.backgroundColor;
                }
            }
        }
    }

    public onActionUnlinked(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.background = undefined;
                tile.style.backgroundColor = undefined;
            }
        }
    }
}