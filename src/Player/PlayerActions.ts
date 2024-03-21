interface IPlayerActionManagerData {
    linkedItemNames: string[];
}

class PlayerAction {
    public iconUrl: string;
    public backgroundColor: string = "#ffffff";
    public r: number = 0;
    public item: InventoryItem;

    public onUpdate: (chuncks?: Kulla.Chunck[]) => void;
    public onClick: (chuncks?: Kulla.Chunck[]) => void;
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