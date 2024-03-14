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
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#prop-creator")) {
            this.show(this.propEditor);
            this.game.generateTerrainSmall();
        }
        else if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}