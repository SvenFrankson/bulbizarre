class GameConfiguration extends Nabu.Configuration {

    protected _buildElementsArray(): void {
        this.configurationElements = [
            new Nabu.ConfigurationElement("quality", Nabu.ConfigurationElementType.Enum, 0),
            new Nabu.ConfigurationElement("renderDist", Nabu.ConfigurationElementType.Number, 5)
        ]
    }
}