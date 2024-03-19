class Player extends BABYLON.Mesh {

    public controler: PlayerControler;
    public inventory: Inventory;
    public playerActionManager: PlayerActionManager;
    public currentAction: PlayerAction;

    public mass: number = 2;
    public height: number = 2;
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public frozen: boolean = true;
    public speed: number = 3;
    public rSpeed: number = Math.PI;

    public inputZ: number = 0;
    public inputX: number = 0;
    public inputRY: number = 0;
    public inputRX: number = 0;
    public inputDeltaX: number = 0;
    public inputDeltaY: number = 0;

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

        if (this.currentAction) {
            this.currentAction.onUpdate(this.currentChuncks);
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

        this.rotation.y += this.rSpeed * this.inputRY * dt;
        this.head.rotation.x += this.rSpeed * this.inputRX * dt;
        this.head.rotation.x = Nabu.MinMax(this.head.rotation.x, - Math.PI * 0.5, Math.PI * 0.5);

        if (this.inputDeltaX != 0) {
            this.rotation.y += this.inputDeltaX / 500;
            this.inputDeltaX = 0;
        }
        if (this.inputDeltaY != 0) {
            this.head.rotation.x += this.inputDeltaY / 500;
            this.inputDeltaY = 0;
        }
        
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