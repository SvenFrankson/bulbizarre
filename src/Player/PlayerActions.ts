class PlayerAction {
    private _iconUrl: string;
    public get iconUrl(): string {
        return this._iconUrl;
    }
    public set iconUrl(url: string) {
        this._iconUrl = url;
        if (this._onIconUrlChanged) {
            this._onIconUrlChanged();
        }
    }
    public _onIconUrlChanged: () => void;
    public backgroundColor: string = "#ffffff";
    public r: number = 0;
    public item: PlayerInventoryItem;

    public onUpdate: (chuncks?: Kulla.Chunck[]) => void;
    public onPointerDown: (chuncks?: Kulla.Chunck[]) => void;
    public onRightPointerDown: (chuncks?: Kulla.Chunck[]) => void;
    public onPointerUp: (duration?: number, distance?: number, chuncks?: Kulla.Chunck[]) => void;
    public onRightPointerUp: (duration?: number, distance?: number, chuncks?: Kulla.Chunck[]) => void;
    public onWheel: (e: WheelEvent) => void;
    public onKeyDown: (e: KeyboardEvent) => void;
    public onKeyUp: (e: KeyboardEvent) => void;
    public onEquip: () => void;
    public onUnequip: () => void;

    constructor(    
        public name: string,
        public player: Player
    ) {

    }
}