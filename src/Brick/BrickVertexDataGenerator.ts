var BRICK_S: number = 0.375;
var BRICK_H: number = 0.15;

class BrickVertexDataGenerator {
    private static _StudVertexData: BABYLON.VertexData[] = [];
    public static GetStudVertexData(lod: number): BABYLON.VertexData {
        if (!BrickVertexDataGenerator._StudVertexData[lod]) {
            BrickVertexDataGenerator._StudVertexData[lod] = new BABYLON.VertexData();
            if (lod === 0) {
                BrickVertexDataGenerator._StudVertexData[lod].positions = [
                    -0.0795, 0, 0.0795, -0.1039, 0.079, 0.0431, -0.0795, 0.079, 0.0795, 0.0795, 0, -0.0795, 0.1039, 0.079, -0.0431, 0.0795, 0.079, -0.0795, -0.1039, 0, -0.0431, -0.1125, 0.079, 0, -0.1125, 0, 0, 0.1125, 0, 0, 0.1039, 0.079, 0.0431, 0.1125, 0.079, 0, -0.0795, 0, -0.0795, -0.0431, 0.079, -0.1039, -0.0795, 0.079, -0.0795, 0.0795, 0, 0.0795, 0.0431, 0.079, 0.1039, 0.0795, 0.079,
                    0.0795, 0.0431, 0, -0.1039, 0, 0.079, -0.1125, 0, 0, -0.1125, -0.0431, 0, 0.1039, 0, 0.079, 0.1125, 0, 0, 0.1125, 0.1039, 0, -0.0431, 0.0431, 0, 0.1039, -0.1039, 0.079, -0.0431, 0.0431, 0.079, -0.1039, 0.1039, 0, 0.0431, -0.0431, 0.079, 0.1039, -0.1039, 0, 0.0431, -0.0431, 0, -0.1039, -0.1039, 0.079, 0.0431, -0.1125, 0.079, 0, 0, 0.079, 0, 0.0795, 0.079, 0.0795, 0.0431, 0.079,
                    0.1039, -0.0795, 0.079, -0.0795, -0.0431, 0.079, -0.1039, 0.1039, 0.079, -0.0431, 0.1125, 0.079, 0, 0.0431, 0.079, -0.1039, 0, 0.079, -0.1125, -0.1039, 0.079, -0.0431, -0.0795, 0.079, 0.0795, 0, 0.079, 0.1125, -0.0431, 0.079, 0.1039, 0.1039, 0.079, 0.0431, 0.0795, 0.079, -0.0795,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].normals = [
                    -0.707, 0, 0.707, -0.924, 0, 0.383, -0.707, 0, 0.707, 0.707, 0, -0.707, 0.924, 0, -0.383, 0.707, 0, -0.707, -0.924, 0, -0.383, -1, 0, 0, -1, 0, 0, 1, 0, 0, 0.924, 0, 0.383, 1, 0, 0, -0.707, 0, -0.707, -0.383, 0, -0.924, -0.707, 0, -0.707, 0.707, 0, 0.707, 0.383, 0, 0.924, 0.707, 0, 0.707, 0.383, 0, -0.924, 0, 0, -1, 0, 0, -1, -0.383, 0, 0.924, 0, 0, 1, 0, 0, 1, 0.924, 0,
                    -0.383, 0.383, 0, 0.924, -0.924, 0, -0.383, 0.383, 0, -0.924, 0.924, 0, 0.383, -0.383, 0, 0.924, -0.924, 0, 0.383, -0.383, 0, -0.924, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                BrickVertexDataGenerator._StudVertexData[lod].indices = [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 11, 4, 25, 22, 16, 12, 26, 6, 3, 27, 18, 15, 10, 28, 0, 29, 21, 30, 7, 1, 31, 19, 13, 32, 33, 34, 35, 36, 34, 37, 38, 34, 39, 40, 34, 41, 34, 42, 37, 34, 43, 38, 42, 34, 44, 32, 34, 36, 45, 34, 46, 34, 45, 44, 34, 46, 35, 34, 47, 48, 39, 34, 48, 34, 41, 47, 34, 40, 43, 34, 33, 0, 30, 1, 3,
                    24, 4, 6, 26, 7, 9, 28, 10, 12, 31, 13, 15, 25, 16, 18, 27, 19, 21, 29, 22, 24, 9, 11, 25, 23, 22, 12, 14, 26, 3, 5, 27, 15, 17, 10, 0, 2, 29, 30, 8, 7, 31, 20, 19,
                ];
            } else {
                BrickVertexDataGenerator._StudVertexData[lod].positions = [
                    0, 0.079, 0.1125, 0.0795, 0, 0.0795, 0, 0, 0.1125, 0.1125, 0.079, 0, 0.0795, 0, -0.0795, 0.1125, 0, 0, 0, 0.079, -0.1125, -0.0795, 0, -0.0795, 0, 0, -0.1125, -0.1125, 0.079, 0, -0.0795, 0, 0.0795, -0.1125, 0, 0, 0.0795, 0.079, 0.0795, 0.0795, 0.079, -0.0795, -0.0795, 0.079, -0.0795, -0.0795, 0.079, 0.0795, -0.1125, 0.079, 0, 0, 0.079, 0, -0.0795, 0.079, 0.0795, 0.0795, 0.079,
                    0.0795, 0.1125, 0.079, 0, 0.0795, 0.079, -0.0795, 0, 0.079, -0.1125, -0.0795, 0.079, -0.0795, 0, 0.079, 0.1125,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].normals = [0, 0, 1, 0.707, 0, 0.707, 0, 0, 1, 1, 0, 0, 0.707, 0, -0.707, 1, 0, 0, 0, 0, -1, -0.707, 0, -0.707, 0, 0, -1, -1, 0, 0, -0.707, 0, 0.707, -1, 0, 0, 0.707, 0, 0.707, 0.707, 0, -0.707, -0.707, 0, -0.707, -0.707, 0, 0.707, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
                BrickVertexDataGenerator._StudVertexData[lod].uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                BrickVertexDataGenerator._StudVertexData[lod].indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 1, 13, 8, 4, 14, 11, 7, 15, 2, 10, 16, 17, 18, 19, 17, 20, 21, 17, 22, 23, 17, 16, 18, 17, 24, 24, 17, 19, 20, 17, 21, 22, 17, 23, 0, 12, 1, 3, 13, 4, 6, 14, 7, 9, 15, 10, 12, 3, 5, 13, 6, 8, 14, 9, 11, 15, 0, 2];
            }
        }
        return BrickVertexDataGenerator._StudVertexData[lod];
    }

    public static GetBoxVertexData(length: number, height: number, width: number): BABYLON.VertexData {
        let xMin = -BRICK_S * 0.5;
        let yMin = 0;
        let zMin = -BRICK_S * 0.5;
        let xMax = xMin + width * BRICK_S;
        let yMax = yMin + height * BRICK_H;
        let zMax = zMin + length * BRICK_S;

        let back = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMin),
        });
        let right = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMax),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMin),
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMax),
            p3: new BABYLON.Vector3(xMin, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMax),
        });
        let left = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMax),
        });
        let top = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMax, zMin),
            p2: new BABYLON.Vector3(xMax, yMax, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMin, yMax, zMax),
        });
        let bottom = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMin, zMax),
            p4: new BABYLON.Vector3(xMax, yMin, zMax),
        });

        return Mummu.MergeVertexDatas(back, right, front, left, top, bottom);
    }

    public static GetStuddedBoxVertexData(length: number, height: number, width: number, lod: number = 1): BABYLON.VertexData {
        let boxData = BrickVertexDataGenerator.GetBoxVertexData(length, height, width);

        let yMax = height * BRICK_H;
        let studDatas: BABYLON.VertexData[] = [];
        for (let z = 0; z < length; z++) {
            for (let x = 0; x < width; x++) {
                let studData = Mummu.CloneVertexData(BrickVertexDataGenerator.GetStudVertexData(lod));
                Mummu.TranslateVertexDataInPlace(studData, new BABYLON.Vector3(x * BRICK_S, yMax, z * BRICK_S));
                studDatas.push(studData);
            }
        }

        return Mummu.MergeVertexDatas(boxData, ...studDatas);
    }

    public static async GetStuddedCutBoxVertexData(cut: number, length: number, height: number, width: number, lod: number = 1): Promise<BABYLON.VertexData> {
        let datas = await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/plate-corner-cut.babylon");
        let cutBoxRawData = Mummu.CloneVertexData(datas[0]);
        let dx = (width - 2) * BRICK_S;
        let dxCut = (cut - 1) * BRICK_S;
        let dy = (height - 1) * BRICK_H;
        let dz = (length - 2) * BRICK_S;
        let dzCut = (cut - 1) * BRICK_S;
        let positions = cutBoxRawData.positions;
        for (let i = 0; i < positions.length / 3; i++) {
            let x = positions[3 * i];
            let y = positions[3 * i + 1];
            let z = positions[3 * i + 2];

            if (x > BRICK_S) {
                x += dx;
            }
            else if (x > 0) {
                x += dxCut;
            }

            if (y > BRICK_H * 0.5) {
                y += dy;
            }

            if (z > BRICK_S) {
                z += dz;
            }
            else if (z > 0) {
                z += dzCut;
            }
            positions[3 * i] = x;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;
        }

        cutBoxRawData.positions = positions;
        let normals = [];
        BABYLON.VertexData.ComputeNormals(cutBoxRawData.positions, cutBoxRawData.indices, normals);
        cutBoxRawData.normals = normals;
        cutBoxRawData.colors = undefined;
        
        let studDatas: BABYLON.VertexData[] = [];
        let yMax = height * BRICK_H;
        let lim = Math.max(length, width) + cut - 1;
        for (let z = 0; z < length; z++) {
            for (let x = 0; x < width; x++) {
                if (x + z < lim) {
                    let studData = Mummu.CloneVertexData(BrickVertexDataGenerator.GetStudVertexData(lod));
                    Mummu.TranslateVertexDataInPlace(studData, new BABYLON.Vector3(x * BRICK_S, yMax, z * BRICK_S));
                    studDatas.push(studData);
                }
            }
        }

        return Mummu.MergeVertexDatas(cutBoxRawData, ...studDatas);
    }
}
