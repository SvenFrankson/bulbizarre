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
    PLAYER_ACTION_EQUIP,
    PLAYER_ACTION_INC,
    PLAYER_ACTION_DEC,
    INVENTORY,
    INVENTORY_PREV_CAT,
    INVENTORY_NEXT_CAT,
    INVENTORY_EQUIP_ITEM,
    NEXT_SHAPE,
    ROTATE_SELECTED,
    DELETE_SELECTED,
    MOVE_FORWARD,
    MOVE_LEFT,
    MOVE_BACK,
    MOVE_RIGHT,
    JUMP,
    MAIN_MENU,
    WORKBENCH,

}

class GameConfiguration extends Nabu.Configuration {

    constructor(configName: string, public game: Game) {
        super(configName);
    }

    protected _buildElementsArray(): void {
        this.configurationElements = [
            new Nabu.ConfigurationElement(
                "quality",
                Nabu.ConfigurationElementType.Enum,
                0,
                Nabu.ConfigurationElementCategory.Graphic,
                {
                    displayName: "Graphic Quality",
                    min: 0,
                    max: 2,
                    toString: (v) => {
                        if (v === 0) {
                            return "LOW";
                        }
                        if (v === 1) {
                            return "MEDIUM";
                        }
                        if (v === 2) {
                            return "HIGH";
                        }
                    }
                }
            ),
            new Nabu.ConfigurationElement(
                "renderDist",
                Nabu.ConfigurationElementType.Number,
                8,
                Nabu.ConfigurationElementCategory.Graphic,
                {
                    displayName: "Render Distance",
                    min: 1,
                    max: 15,
                    toString: (v) => {
                        return v.toFixed(0);
                    }
                },
                (newValue) => {
                    this.game.terrain.chunckManager.setDistance(newValue * this.game.terrain.chunckLengthIJ);
                }
            ),
            new Nabu.ConfigurationElement(
                "canLockPointer",
                Nabu.ConfigurationElementType.Boolean,
                0,
                Nabu.ConfigurationElementCategory.Control,
                {
                    displayName: "Can Lock Pointer"
                }
            ),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION", KeyInput.PLAYER_ACTION, "GamepadBtn0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION_DEC", KeyInput.PLAYER_ACTION_DEC, "GamepadBtn12"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION_INC", KeyInput.PLAYER_ACTION_INC, "GamepadBtn13"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY.0", KeyInput.INVENTORY, "GamepadBtn2"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY.1", KeyInput.INVENTORY, "KeyI"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_PREV_CAT", KeyInput.INVENTORY_PREV_CAT, "GamepadBtn4"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_NEXT_CAT", KeyInput.INVENTORY_NEXT_CAT, "GamepadBtn5"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_EQUIP_ITEM", KeyInput.INVENTORY_EQUIP_ITEM, "GamepadBtn0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "NEXT_SHAPE", KeyInput.NEXT_SHAPE, "KeyZ"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ROTATE_SELECTED", KeyInput.ROTATE_SELECTED, "KeyR"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "DELETE_SELECTED", KeyInput.DELETE_SELECTED, "KeyX"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_FORWARD", KeyInput.MOVE_FORWARD, "KeyW"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_LEFT", KeyInput.MOVE_LEFT, "KeyA"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_BACK", KeyInput.MOVE_BACK, "KeyS"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_RIGHT", KeyInput.MOVE_RIGHT, "KeyD"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_0", KeyInput.ACTION_SLOT_0, "Digit0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_1", KeyInput.ACTION_SLOT_1, "Digit1"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_2", KeyInput.ACTION_SLOT_2, "Digit2"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_3", KeyInput.ACTION_SLOT_3, "Digit3"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_4", KeyInput.ACTION_SLOT_4, "Digit4"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_5", KeyInput.ACTION_SLOT_5, "Digit5"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_6", KeyInput.ACTION_SLOT_6, "Digit6"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_7", KeyInput.ACTION_SLOT_7, "Digit7"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_8", KeyInput.ACTION_SLOT_8, "Digit8"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_9", KeyInput.ACTION_SLOT_9, "Digit9"),
            new Nabu.ConfigurationElement(
                "godMode",
                Nabu.ConfigurationElementType.Boolean,
                0,
                Nabu.ConfigurationElementCategory.Dev,
                {
                    displayName: "God Mode"
                },
                (newValue) => {
                    this.game.player.godMode = newValue === 1 ? true : false;
                }
            ),
            new Nabu.ConfigurationElement(
                "showRenderDistDebug",
                Nabu.ConfigurationElementType.Boolean,
                0,
                Nabu.ConfigurationElementCategory.Dev,
                {
                    displayName: "Show Render Distance Debug"
                },
                (newValue) => {
                    if (newValue === 1) {
                        this.game.terrain.chunckManager.setShowDebugRenderDist(true);
                    }
                    else {
                        this.game.terrain.chunckManager.setShowDebugRenderDist(false);
                    }
                }
            )
        ]
    }

    public getValue(property: string): number {
        let configElement = this.configurationElements.find(e => { return e.property === property; });
        if (configElement) {
            return configElement.value;
        }
    }
}