class GameRouter extends Nabu.Router {

    public homePage: Nabu.PanelPage;
    public optionPage: Nabu.OptionPage;
    public propEditor: Nabu.DefaultPage;
    public actionBar: Nabu.DefaultPage;

    public inPlayMode: boolean = false;

    constructor(public game: Game) {
        super();
    }
    
    protected onFindAllPages(): void {
        this.homePage = document.getElementById("home-page") as Nabu.PanelPage;
        this.optionPage = document.getElementById("option-page") as Nabu.OptionPage;
        this.propEditor = document.getElementById("prop-editor-ui") as Nabu.DefaultPage;
        this.actionBar = document.getElementById("action-bar") as Nabu.DefaultPage;
    }

    protected onUpdate(): void {
        
    }

    protected async onHRefChange(page: string): Promise<void> {
        this.inPlayMode = false;
        this.game.inputManager.deactivateAllKeyInputs = true;
        this.game.propEditor.dispose();
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#brick")) {
            this.inPlayMode = true;
            this.game.inputManager.deactivateAllKeyInputs = false;
            this.show(this.actionBar);
            this.game.generateTerrainBrick();
        }
        else if (page.startsWith("#prop-creator")) {
            this.show(this.propEditor);
            this.game.generateTerrainSmall();
            this.game.propEditor.initialize();
        }
        else if (page.startsWith("#miniatures")) {
            this.hideAll();
            //this.game.generateBrickMiniatures();
            this.game.generateBlockShapeMiniatures();
        }
        else if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}