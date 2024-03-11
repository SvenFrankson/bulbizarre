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
                "godMode",
                Nabu.ConfigurationElementType.Boolean,
                0,
                {
                    displayName: "God Mode"
                },
                (newValue) => {
                    if (newValue === 1) {
                        this.game.camera.speed = 1;
                    }
                    else {
                        this.game.camera.speed = 0.2;
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