class GameConfiguration extends Mummu.Configuration {

    protected _buildElementsArray(): void {
        this.configurationElements = [
            new Mummu.ConfigurationElement("quality", Mummu.ConfigurationElementType.Enum, 0),
            new Mummu.ConfigurationElement("renderDist", Mummu.ConfigurationElementType.Number, 5)
        ]
    }
}