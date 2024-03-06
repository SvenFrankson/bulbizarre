class GameRouter extends Nabu.Router {

    public homePage: Nabu.PanelPage;

    constructor(public game: Game) {
        super();
    }
    
    protected onFindAllPages(): void {
        this.homePage = document.getElementById("home-page") as Nabu.PanelPage;
    }

    protected onUpdate(): void {
        
    }

    protected async onHRefChange(page: string): Promise<void> {
        if (page.startsWith("#home") || true) {

            this.show(this.homePage);
        }
    }
}