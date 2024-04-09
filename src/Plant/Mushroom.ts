class Mushroom {

    public ijk: Nabu.IJK;
    public chunck: Kulla.Chunck;

    public height: number = 10;
    public radius: number = 5;

    public age: number = 0;
    public maxAge: number = 10;

    public currentHeadPos: Nabu.IJK;

    public headCone: Kulla.Cone;

    constructor(public game: Game) {
    }

    private _debugStepInterval: number;

    public instantiate(): void {
        this._debugStepInterval = setInterval(this.doStep, 2000);
    }

    public doStep = () => {
        if (this.ijk && this.chunck) {
            if (!this.currentHeadPos) {
                this.currentHeadPos = { i: this.ijk.i, j: this.ijk.j, k: this.ijk.k - 1 };
            }
            if (!this.headCone) {
                this.headCone = new Kulla.Cone(this.chunck.terrain, { });
            }
            if (this.age < this.maxAge) {
                if (this.age > 0) {
                    this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                }

                this.age++;
                this.currentHeadPos.k++;
                this.headCone.props.rFunc = (f: number) => { 
                    return 1 + Math.cos(Math.PI * 0.4 * f) * (1 + Math.floor(this.age / 2));
                }
                this.headCone.props.length = 2 + Math.floor(this.age / 4);
    
                if (Math.random() < 0.3) {
                    if (Math.random() < 0.5) {
                        this.currentHeadPos.i++;
                    }
                    else {
                        this.currentHeadPos.i--;
                    }
                }
                else if (Math.random() < 0.3) {
                    if (Math.random() < 0.5) {
                        this.currentHeadPos.j++;
                    }
                    else {
                        this.currentHeadPos.j--;
                    }
                }

                this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                this.game.terrainEditor.doAction(this.chunck, this.currentHeadPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 3, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });
            }
            else {
                clearInterval(this._debugStepInterval);
            }
        }
    }

}