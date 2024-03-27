interface IBrickManagerData {
    bricks: IBrickData[];
}

class BrickManager {

    public bricks: Nabu.UniqueList<Brick> = new Nabu.UniqueList<Brick>();

    constructor(public game: Game) {

    }

    public registerBrick(brick: Brick): void {
        this.bricks.push(brick);
        console.log("BrickManager holds " + this.bricks.length + " bricks");
    } 

    public unregisterBrick(brick: Brick): void {
        this.bricks.remove(brick);
        console.log("BrickManager holds " + this.bricks.length + " bricks");
    }

    public serialize(): IBrickManagerData {
        let data = {
            bricks: []
        }

        for (let i = 0; i < this.bricks.length; i++) {
            data.bricks[i] = this.bricks.get(i).serialize();
        }

        return data;
    }

    public deserialize(data: IBrickManagerData): void {
        while (this.bricks.length > 0) {
            this.bricks.get(0).dispose();
        }

        for (let i = 0; i < data.bricks.length; i++) {
            let brick = new Brick(this, 0, 0);
            brick.deserialize(data.bricks[i]);
            brick.updateMesh();
        }
    }

    public saveToLocalStorage(): void {
        let data = this.serialize();
        window.localStorage.setItem("brick-manager", JSON.stringify(data));
    }

    public loadFromLocalStorage(): void {
        let dataString = window.localStorage.getItem("brick-manager");
        if (dataString) {
            let data = JSON.parse(dataString);
            if (data) {
                this.deserialize(data);
            }
        }
    }
}