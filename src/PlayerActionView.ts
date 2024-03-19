class PlayerActionView {

    public get scene(): BABYLON.Scene {
        return this.game.scene;
    }
    public get inventory(): Inventory {
        return this.player.inventory;
    }

    public isOpened: boolean = false;
    public tiles: HTMLDivElement[];
    private _equipedSlotIndex: number = - 1;

    constructor(public player: Player, public game: Game) {
        
    }

    public initialize(): void {
        this.tiles = [];
        for (let slotIndex = 0; slotIndex <= 9; slotIndex++) {
            this.tiles[slotIndex] = document.querySelector("#action-" + slotIndex.toFixed(0));
        }
    }

    public highlight(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.border = "2px solid rgb(255, 255, 255)";
        }
    }

    public unlit(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.border = "2px solid rgb(127, 127, 127)";
        }
    }

    public onActionEquiped(action: PlayerAction, slotIndex: number): void {
        if (this._equipedSlotIndex >= 0 && this._equipedSlotIndex <= 9) {
            this.unlit(this._equipedSlotIndex);
        }
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.highlight(slotIndex);
            this._equipedSlotIndex = slotIndex;
        }
    }

    public onActionUnequiped(action: PlayerAction, slotIndex: number): void {
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
            this.tiles[slotIndex].style.backgroundColor = action.backgroundColor;
            /*
            this.hudLateralTileImageMeshes[slotIndex].isVisible = true;
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture = new BABYLON.Texture(action.iconUrl);
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture.hasAlpha = true;
            this.itemCountTexts[slotIndex].prop.text = action.item.count.toFixed(0);
            this.itemNameTexts[slotIndex].prop.text = action.item.name;
            this.slika.needRedraw = true;
            */
        }
    }

    public onActionUnlinked(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.backgroundColor = undefined;
            /*
            this.hudLateralTileImageMeshes[slotIndex].isVisible = false;
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture = undefined;
            this.itemCountTexts[slotIndex].prop.text = "";
            this.itemNameTexts[slotIndex].prop.text = "";
            this.slika.needRedraw = true;
            */
        }
    }

    public onPointerUp(): void {
        if (this.inventory.draggedItem) {
            //this.player.playerActionManager.linkAction(this.inventory.draggedItem.playerAction, index);
            this.inventory.draggedItem = undefined;
        }
    }
}