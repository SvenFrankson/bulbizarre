class PlayerActionManager {

    public alwaysEquip: boolean = true;
    public linkedActions: PlayerAction[] = [];

    public get playerActionView(): PlayerActionView {
        return this.game.playerActionView;
    }

    public currentActionIndex: number = - 1;
    public prevActionIndex(): number {
        if (this.currentActionIndex === 1) {
            return - 1;
        }
        if (this.currentActionIndex === 0) {
            return 9;
        }
        if (this.currentActionIndex === 10) {
            return 0;
        }
        return this.currentActionIndex - 1;
    }
    public nextActionIndex(): number {
        if (this.currentActionIndex === - 1) {
            return 1;
        }
        if (this.currentActionIndex === 9) {
            return 0;
        }
        if (this.currentActionIndex === 0) {
            return 10;
        }
        return this.currentActionIndex + 1;
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

    public setActionIndex(slotIndex: number): void {
        this.playerActionView.unlight(this.currentActionIndex);
        this.currentActionIndex = Nabu.MinMax(slotIndex, - 1, 10);
        if (this.alwaysEquip || this.player.currentAction) {
            this.unEquipAction();
            this.equipAction();
        }
        this.playerActionView.highlight(this.currentActionIndex);
    }

    public toggleEquipAction(): void {
        if (this.player.currentAction) {
            this.unEquipAction();
        }
        else {
            this.equipAction();
        }
    }

    public equipAction(): void {
        this.player.currentAction = this.linkedActions[this.currentActionIndex];
        if (this.player.currentAction) {
            if (this.player.currentAction.onEquip) {
                this.player.currentAction.onEquip();
            }
            this.playerActionView.onActionEquiped(this.currentActionIndex);
        }
        else {
            this.playerActionView.onActionEquiped(-1);
        }
    }

    public unEquipAction(): void {
        if (this.player.currentAction) {
            if (this.player.currentAction.onUnequip) {
                this.player.currentAction.onUnequip();
            }
            this.player.currentAction = undefined;
            this.playerActionView.onActionEquiped(-1);
        }
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
            }
        }
    }
}