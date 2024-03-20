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
                0,
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
                1,
                {
                    displayName: "Can Lock Pointer"
                }
            ),
            new Nabu.ConfigurationElement(
                "godMode",
                Nabu.ConfigurationElementType.Boolean,
                0,
                {
                    displayName: "God Mode"
                },
                (newValue) => {
                    if (newValue === 1) {
                        this.game.freeCamera.speed = 1;
                    }
                    else {
                        this.game.freeCamera.speed = 0.2;
                    }
                }
            ),
            new Nabu.ConfigurationElement(
                "showRenderDistDebug",
                Nabu.ConfigurationElementType.Boolean,
                0,
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