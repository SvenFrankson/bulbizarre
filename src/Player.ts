class Player extends BABYLON.Mesh {

    public controler: PlayerControler;

    public mass: number = 2;
    public height: number = 2;
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public frozen: boolean = true;
    public speed: number = 3;

    public inputZ: number = 0;
    public inputX: number = 0;

    public currentChunck: Kulla.Chunck;
    public currentChuncks: Kulla.Chunck[] = [];

    public head: BABYLON.Mesh;

    constructor(public game: Game) {
        super("player");
        let body = Mummu.CreateBeveledBox("body", { width: 1, height: this.height - 0.2, depth: 1 });
        body.position.y = - this.height * 0.5 - 0.1;
        body.parent = this;

        this.head = new BABYLON.Mesh("head");
        this.head.parent = this;
    }

    public update(dt: number): void {
        if (this.controler) {
            this.controler.update(dt);
        }

        let currentChunck = this.game.terrain.getChunckAtPos(this.position, 0);
        if (currentChunck != this.currentChunck) {
            this.currentChunck = currentChunck;
            this.updateCurrentChuncks();
        }

        let ray = new BABYLON.Ray(this.position, new BABYLON.Vector3(0, - 1, 0));
        let bestPick: BABYLON.PickingInfo;
        for (let i = 0; i < this.currentChuncks.length; i++) {
            let chunck = this.currentChuncks[i];
            if (chunck && chunck.mesh) {
                let pick = ray.intersectsMesh(chunck.mesh);
                if (pick.hit) {
                    bestPick = pick;
                    break;
                }
            }
        }

        this.velocity.x = 0;
        this.velocity.z = 0;
        let inputL = Math.sqrt(this.inputX * this.inputX + this.inputZ * this.inputZ);
        if (inputL > this.speed) {
            this.inputX /= inputL * this.speed;
            this.inputZ /= inputL * this.speed;
        }
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.X).scale(this.inputX).scale(this.speed));
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.Z).scale(this.inputZ).scale(this.speed));
        
        if (bestPick && bestPick.hit) {
            if (bestPick.distance <= this.height) {
                this.velocity.y = 0;
                this.position.copyFrom(bestPick.pickedPoint).addInPlaceFromFloats(0, this.height, 0);
            }
            else {
                this.velocity.y -= this.mass * 9.2 * dt;
            }
    
            this.position.addInPlace(this.velocity.scale(dt));
        }
        else {
            if (this.position.y < 100) {
                this.position.y += 0.1;
            }
            if (this.position.y < 0) {
                this.position.y = 100;
            }
        }
    }

    public updateCurrentChuncks(): void {
        this.currentChuncks = [];
        if (this.currentChunck) {
            for (let i = 0; i <= 2; i++) {
                for (let j = 0; j <= 2; j++) {
                    this.currentChuncks[i + 3 * j] = this.game.terrain.getChunck(0, this.currentChunck.iPos - 1 + i, this.currentChunck.jPos - 1 + j);
                }
            }
        }
    }
}