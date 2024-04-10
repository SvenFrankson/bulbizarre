class ChunckGridMaterial extends BABYLON.ShaderMaterial {

    constructor(name: string, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "chunckGrid",
                fragment: "chunckGrid",
            },
            {
                attributes: ["position", "normal", "uv", "color"],
                uniforms: [
                    "world", "worldView", "worldViewProjection", "view", "projection",
                    "lightInvDirW",
                    "alpha",
                ]
            }
        );
        this.alpha = 0.99;
        this.alphaMode = BABYLON.Material.MATERIAL_ALPHABLEND;

        this.setVector3("lightInvDirW", BABYLON.Vector3.Up());

        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean): void {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }

    private _update = () => {
        let lights = this.getScene().lights;
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            if (light instanceof BABYLON.HemisphericLight) {
                this.setVector3("lightInvDirW", light.direction);
            }
        }
    }
}