class GameRouter extends Nabu.Router {

    public homePage: Nabu.PanelPage;
    public optionPage: Nabu.OptionPage;
    public propEditor: Nabu.DefaultPage;

    constructor(public game: Game) {
        super();
    }
    
    protected onFindAllPages(): void {
        this.homePage = document.getElementById("home-page") as Nabu.PanelPage;
        this.optionPage = document.getElementById("option-page") as Nabu.OptionPage;
        this.propEditor = document.getElementById("prop-editor-ui") as Nabu.DefaultPage;
    }

    protected onUpdate(): void {
        
    }

    protected async onHRefChange(page: string): Promise<void> {
        this.game.propEditor.dispose();
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#brick")) {
            this.hideAll();
            this.game.generateTerrainBrick();
        }
        else if (page.startsWith("#prop-creator")) {
            this.show(this.propEditor);
            this.game.generateTerrainSmall();
            this.game.propEditor.initialize();
        }
        else if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}