class GameRouter extends Nabu.Router {

    public homePage: Nabu.PanelPage;
    public optionPage: Nabu.OptionPage;

    constructor(public game: Game) {
        super();
    }
    
    protected onFindAllPages(): void {
        this.homePage = document.getElementById("home-page") as Nabu.PanelPage;
        this.optionPage = document.getElementById("option-page") as Nabu.OptionPage;
    }

    protected onUpdate(): void {
        
    }

    protected async onHRefChange(page: string): Promise<void> {
        if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}