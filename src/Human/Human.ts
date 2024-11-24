class Human {

    public body: HumanBody;
    public spinalCord: HumanSpinalCord;
    public brain: HumanBrain;

    constructor(public game: Game) {
        this.body = new HumanBody(this);
        this.spinalCord = new HumanSpinalCord(this);
        this.brain = new HumanBrain(this);
    }

    public async instantiate(): Promise<void> {
        await this.body.instantiate();
        await this.spinalCord.instantiate();
    }

    public update(): void {
        
    }
}