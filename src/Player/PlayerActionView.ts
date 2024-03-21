class PlayerActionView {

    private _tiles: HTMLDivElement[] = [];
    public getTile(slotIndex: number): HTMLDivElement {
        if (!this._tiles[slotIndex]) {
            this._tiles[slotIndex] = document.querySelector("#action-" + slotIndex.toFixed(0));
        }
        return this._tiles[slotIndex];
    }

    constructor() {
        
    }

    public highlight(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.border = "2px solid rgb(255, 255, 255)";
            }
        }
    }

    public unlit(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.border = "2px solid rgb(127, 127, 127)";
            }
        }
    }

    public onActionEquiped(slotIndex: number): void {
        for (let i = 0; i <= 9; i++) {
            this.unlit(i);
        }
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.highlight(slotIndex);
        }
    }

    public onActionUnequiped(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.unlit(slotIndex);
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
                tile.style.backgroundColor = action.backgroundColor;
            }
        }
    }

    public onActionUnlinked(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.backgroundColor = undefined;
            }
        }
    }
}