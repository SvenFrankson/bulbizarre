interface IPage {
    show(duration?: number): Promise<void>;
    hide(duration?: number): Promise<void>;
}

class Router {
    
    public pages: IPage[] = [];

    public homePage: MainMenu;
    public challengePage: MainMenu;

    public async wait(duration: number): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }

    public initialize(): void {
        this.pages = [];
        let mainMenus = document.querySelectorAll("menu-page");
        mainMenus.forEach(mainMenu => {
            if (mainMenu instanceof MainMenu) {
                this.pages.push(mainMenu);
            }
        });

        console.log("pages found " + this.pages.length);

        // Set all pages here
        
		this.homePage = document.getElementById("main-menu-page") as MainMenu;
		this.challengePage = document.getElementById("challenge-menu-page") as MainMenu;

        setInterval(this._update, 30);
    }

    public async show(page: IPage, dontCloseOthers?: boolean): Promise<void> {
        if (!dontCloseOthers) {
            for (let i = 0; i < this.pages.length; i++) {
                this.pages[i].hide(1);
            }
        }
        await page.show(1);
    }

    private _currentHRef: string;
    private _update = () => {
        let href = window.location.href;
        if (href != this._currentHRef) {
            this._currentHRef = href;
            this._onHRefChange();
        }
    }

    private _onHRefChange = async () => {
        let split = this._currentHRef.split("/");
        let page = split[split.length - 1];
        if (page.endsWith("#challenge")) {
            this.show(this.challengePage);
        }
        else if (page.endsWith("#home") || true){
            this.show(this.homePage);
        }
    }
}