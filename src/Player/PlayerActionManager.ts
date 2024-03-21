class PlayerActionManager {

    public linkedActions: PlayerAction[] = [];

    public get inventory(): Inventory {
        return this.player.inventory;
    }
    public get playerActionView(): PlayerActionView {
        return this.game.playerActionBar;
    }

    public equipedActionIndex: number = - 1;
    public prevActionIndex(): number {
        if (this.equipedActionIndex === 1) {
            return - 1;
        }
        if (this.equipedActionIndex === 0) {
            return 9;
        }
        if (this.equipedActionIndex === 10) {
            return 0;
        }
        return this.equipedActionIndex - 1;
    }
    public nextActionIndex(): number {
        if (this.equipedActionIndex === - 1) {
            return 1;
        }
        if (this.equipedActionIndex === 9) {
            return 0;
        }
        if (this.equipedActionIndex === 0) {
            return 10;
        }
        return this.equipedActionIndex + 1;
    }

    constructor(
        public player: Player,
        public game: Game
    ) {
        player.playerActionManager = this;
    }

    public initialize(): void {
        let savedPlayerActionString = window.localStorage.getItem("player-action-manager");
        if (savedPlayerActionString) {
            let savedPlayerAction = JSON.parse(savedPlayerActionString);
            this.deserializeInPlace(savedPlayerAction);
        }
        
        this.game.scene.onBeforeRenderObservable.add(this.update);
    }

    public update = () => {
        
    }

    public linkAction(action: PlayerAction, slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = action;
            this.playerActionView.onActionLinked(action, slotIndex);
            /*
            if (Config.saveConfiguration.useLocalStorage) {
                window.localStorage.setItem("player-action-manager", JSON.stringify(this.serialize()));
            }
            */
        }
    }

    public unlinkAction(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = undefined;
            this.playerActionView.onActionUnlinked(slotIndex);
            /*
            if (Config.saveConfiguration.useLocalStorage) {
                window.localStorage.setItem("player-action-manager", JSON.stringify(this.serialize()));
            }
            */
        }
    }

    public equipAction(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex <= 9) {
            // Unequip current action
            if (this.player.currentAction) {
                if (this.player.currentAction.onUnequip) {
                    this.player.currentAction.onUnequip();
                }
                this.playerActionView.onActionUnequiped(slotIndex);
            }
            // If request action was already equiped, remove it.
            if (this.player.currentAction === this.linkedActions[slotIndex]) {
                this.player.currentAction = undefined;
            }
            // Otherwise, equip new action.
            else {
                this.player.currentAction = this.linkedActions[slotIndex];
                if (this.player.currentAction) {
                    //(document.querySelector("#player-action-" + slotIndex + " .background") as HTMLImageElement).src ="/datas/images/inventory-item-background-highlit.svg";
                    if (this.player.currentAction.onEquip) {
                        this.player.currentAction.onEquip();
                    }
                }
            }
        }
        this.equipedActionIndex = Nabu.MinMax(slotIndex, - 1, 10);
        this.playerActionView.onActionEquiped(slotIndex);
    }

    public startHint(slotIndex: number): void {
        this.inventory.hintedSlotIndex.push(slotIndex);
        setTimeout(() => {
            if (this.inventory.hintedSlotIndex.contains(slotIndex)) {
                this.playerActionView.onHintStart(slotIndex);
            }
        }, 200);
    }

    public stopHint(slotIndex: number): void {
        this.inventory.hintedSlotIndex.remove(slotIndex) >= 0;
        this.playerActionView.onHintEnd(slotIndex);
    }

    public serialize(): IPlayerActionManagerData {
        let linkedActionsNames: string[] = [];
        for (let i = 0; i < this.linkedActions.length; i++) {
            if (this.linkedActions[i]) {
                linkedActionsNames[i] = this.linkedActions[i].item.name;
            }
        }
        return {
            linkedItemNames: linkedActionsNames
        }
    }

    public deserializeInPlace(data: IPlayerActionManagerData): void {
        if (data && data.linkedItemNames) {
            for (let i = 0; i < data.linkedItemNames.length; i++) {
                let linkedItemName = data.linkedItemNames[i];
                let item = this.player.inventory.getItemByName(linkedItemName);
                if (item) {
                    this.linkAction(item.playerAction, i);
                    item.timeUse = (new Date()).getTime();
                }
            }
        }
    }
}