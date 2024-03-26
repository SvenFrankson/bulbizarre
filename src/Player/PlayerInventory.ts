enum InventoryCategory {
    Block,
    Brick,
    Ingredient,
    End
}

class PlayerInventoryItem {

    public icon: string;
    public name: string;
    public count: number = 1;
    public category: InventoryCategory;

    constructor(name: string, category: InventoryCategory) {
        this.name = name;
        this.category = category;
        this.icon = "/datas/icons/empty.png";
        if (this.category === InventoryCategory.Brick) {
            this.icon = "/datas/icons/bricks/" + name + ".png";
        }
    }

    public getPlayerAction(player: Player): PlayerAction {
        if (this.category === InventoryCategory.Block) {
            let block = Kulla.BlockTypeNames.indexOf(this.name);
            if (block >= Kulla.BlockType.None && block < Kulla.BlockType.Unknown) {
                return PlayerActionTemplate.CreateBlockAction(player, block);
            }
        }
        else if (this.category === InventoryCategory.Brick) {
            return PlayerActionTemplate.CreateBrickAction(player, this.name);
        }
    }
}

class PlayerInventory {

    public items: PlayerInventoryItem[] = [];

    constructor(public player: Player) {
        
    }

    public addItem(item: PlayerInventoryItem): void {
        let existingItem = this.items.find(it => { return it.name === item.name; });
        if (existingItem) {
            existingItem.count += item.count;
        }
        else {
            this.items.push(item);
        }
    }
}