
var BRICK_S: number = 0.375;
var BRICK_H: number = 0.15;

class BrickVertexDataGenerator {

    private static _StudVertexData: BABYLON.VertexData;
    public static GetStudVertexData(): BABYLON.VertexData {
        if (!BrickVertexDataGenerator._StudVertexData) {
            BrickVertexDataGenerator._StudVertexData = new BABYLON.VertexData();
            BrickVertexDataGenerator._StudVertexData.positions = [
                0, 0.079, 0.1125, 0.0795, 0, 0.0795, 0, 0, 0.1125, 0.1125, 0.079, 0, 0.0795, 0, -0.0795, 0.1125, 0, 0, 0, 0.079, -0.1125, -0.0795, 0, -0.0795, 0, 0, -0.1125, -0.1125, 0.079, 0, -0.0795, 0, 0.0795, -0.1125, 0, 0, 0.0795, 0.079, 0.0795, 0.0795, 0.079, -0.0795, -0.0795, 0.079, -0.0795, -0.0795, 0.079, 0.0795, -0.1125, 0.079, 0, 0, 0.079, 0, -0.0795, 0.079, 0.0795, 0.0795, 0.079,
                0.0795, 0.1125, 0.079, 0, 0.0795, 0.079, -0.0795, 0, 0.079, -0.1125, -0.0795, 0.079, -0.0795, 0, 0.079, 0.1125,
            ];
            BrickVertexDataGenerator._StudVertexData.normals = [0, 0, 1, 0.707, 0, 0.707, 0, 0, 1, 1, 0, 0, 0.707, 0, -0.707, 1, 0, 0, 0, 0, -1, -0.707, 0, -0.707, 0, 0, -1, -1, 0, 0, -0.707, 0, 0.707, -1, 0, 0, 0.707, 0, 0.707, 0.707, 0, -0.707, -0.707, 0, -0.707, -0.707, 0, 0.707, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
            BrickVertexDataGenerator._StudVertexData.uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            BrickVertexDataGenerator._StudVertexData.indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 1, 13, 8, 4, 14, 11, 7, 15, 2, 10, 16, 17, 18, 19, 17, 20, 21, 17, 22, 23, 17, 16, 18, 17, 24, 24, 17, 19, 20, 17, 21, 22, 17, 23, 0, 12, 1, 3, 13, 4, 6, 14, 7, 9, 15, 10, 12, 3, 5, 13, 6, 8, 14, 9, 11, 15, 0, 2];
        }
        return BrickVertexDataGenerator._StudVertexData;
    }

    public static GetBoxVertexData(length: number, height: number, width: number): BABYLON.VertexData {
        let xMin = - BRICK_S * 0.5;
        let yMin = 0;
        let zMin = - BRICK_S * 0.5;
        let xMax = xMin + width * BRICK_S;
        let yMax = yMin + height * BRICK_H;
        let zMax = zMin + length * BRICK_S;

        let back = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMin)
        });
        let right = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMax),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMin)
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMax),
            p3: new BABYLON.Vector3(xMin, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMax)
        });
        let left = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMax)
        });
        let top = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMax, zMin),
            p2: new BABYLON.Vector3(xMax, yMax, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMin, yMax, zMax)
        });
        let bottom = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMin, zMax),
            p4: new BABYLON.Vector3(xMax, yMin, zMax)
        });

        return Mummu.MergeVertexDatas(back, right, front, left, top, bottom); 
    }

    public static GetStuddedBoxVertexData(length: number, height: number, width: number): BABYLON.VertexData {
        let boxData = BrickVertexDataGenerator.GetBoxVertexData(length, height, width);

        let yMax = height * BRICK_H;
        let studDatas: BABYLON.VertexData[] = [];
        for (let z = 0; z < length; z++) {
            for (let x = 0; x < width; x++) {
                let studData = Mummu.CloneVertexData(BrickVertexDataGenerator.GetStudVertexData());
                Mummu.TranslateVertexDataInPlace(studData, new BABYLON.Vector3(x * BRICK_S, yMax, z * BRICK_S));
                studDatas.push(studData);
            }
        }

        return Mummu.MergeVertexDatas(boxData, ...studDatas);
    }
}
