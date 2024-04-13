#version 300 es
precision highp float;
precision mediump sampler3D;
 
uniform vec3 terrainColors[13];
uniform vec3 lightInvDirW;
uniform int level;
uniform float blockSize_m;
uniform float blockHeight_m;
uniform sampler2D diffuseTexture;
uniform sampler3D noiseTexture;
uniform sampler3D lightTexture;
uniform vec3 debugColor;

in vec3 vPositionL;
in vec3 vPositionW;
in vec3 vNormalW;
in vec2 vUv;
in vec2 vUv2;
in vec4 vColor;

flat in int colorIndex1;
flat in int colorIndex2;
flat in int colorIndex3;

in vec3 color1;
in vec3 color2;
in vec3 color3;

out vec4 outColor;

float f1(float x, float y, float z) {
   float period1 = 2.;
   float period2 = 4.;
   float ampli1 = 0.05;
   float ampli2 = 0.;
   //x += 1.2 * y;
   //x += 1.3 * z;
   return sin(x / 0.333 * 3.1415 * period1) * ampli1 + sin(x / 0.333 * 3.1415 * period2) * ampli2;
}

float f2(float x) {
   return (1. - cos(x / 0.333 * 3.1415 * 6.)) * 0.5 * 0.05;
}

float f(float x, float y, float z) {
   return 0.;
}
 
void main() {
   int colorIndex = 0;
   vec3 color = vec3(0., 0., 0.);
   vec3 baryPos = vColor.rgb;

   float sunLightFactor = (dot(vNormalW, lightInvDirW) + 1.) * 0.5;
   float lightFactor = sunLightFactor / 1.3;

   float period = 1.;
   float ampli = 0.1;

   vec3 uvrNoise = vec3(vPositionW.x * 0.4, vPositionW.z * 0.4, vPositionW.y * 0.4);
   float noise = 2. * (texture(noiseTexture, uvrNoise).r - 0.5);

   float offset = noise * 0.2;
   offset = 0.;
   // case all same
   if (colorIndex1 == colorIndex2 && colorIndex2 == colorIndex3) {
      color = color1;
      colorIndex = colorIndex1;
   }
   // case one pair
   else if (colorIndex1 == colorIndex2) {
      if (colorIndex1 > colorIndex3) {
         offset *= -1.;
      }

      if (baryPos.b > 0.5 + offset) {
         color = color3;
         colorIndex = colorIndex3;
      }
      else {
         color = color1;
         colorIndex = colorIndex1;
      }
   }
   else if (colorIndex1 == colorIndex3) {
      if (colorIndex1 > colorIndex2) {
         offset *= -1.;
      }

      if (baryPos.g > 0.5 + offset) {
         color = color2;
         colorIndex = colorIndex2;
      }
      else {
         color = color1;
         colorIndex = colorIndex1;
      }
   }
   else if (colorIndex2 == colorIndex3) {
      if (colorIndex1 < colorIndex2) {
         offset *= -1.;
      }

      if (baryPos.r > 0.5 + offset) {
         color = color1;
         colorIndex = colorIndex1;
      }
      else {
         color = color2;
         colorIndex = colorIndex2;
      }
   }
   // case all different
   else {
      float factor1 = 10.;
      float factor2 = 9.;
      float factor3 = 11.;

      //float offset1 = (cos(vPositionW.x * factor1 + vPositionW.y * factor1 * 0.5) + cos(vPositionW.y * factor1 + vPositionW.z * factor1 * 0.5) + cos(vPositionW.z * factor1 + vPositionW.x * factor1 * 0.5)) * 0.1;
      //float offset2 = (cos(vPositionW.x * factor2 + vPositionW.y * factor2 * 0.5) + cos(vPositionW.y * factor2 + vPositionW.z * factor2 * 0.5) + cos(vPositionW.z * factor2 + vPositionW.x * factor2 * 0.5)) * 0.1;
      //float offset3 = (cos(vPositionW.x * factor3 + vPositionW.y * factor3 * 0.5) + cos(vPositionW.y * factor3 + vPositionW.z * factor3 * 0.5) + cos(vPositionW.z * factor3 + vPositionW.x * factor3 * 0.5)) * 0.1;

      float offsetRG = offset;
      if (colorIndex1 > colorIndex2) {
         offsetRG *= -1.;
      }

      float offsetRB = offset;
      if (colorIndex1 > colorIndex3) {
         offsetRB *= -1.;
      }

      float offsetGB = offset;
      if (colorIndex2 > colorIndex3) {
         offsetGB *= -1.;
      }

      if (baryPos.r + offsetRG >= baryPos.g && baryPos.r + offsetRB >= baryPos.b) {
         color = color1;
         colorIndex = colorIndex1;
      }
      else if (baryPos.g - offsetRG >= baryPos.r && baryPos.g + offsetGB >= baryPos.b) {
         color = color2;
         colorIndex = colorIndex2;
      }
      else if (baryPos.b - offsetRB >= baryPos.r && baryPos.b - offsetGB >= baryPos.g) {
         color = color3;
         colorIndex = colorIndex3;
      }
      else {
         color = color1;
         colorIndex = colorIndex1;
      }
   }

   /*
   // Turn Grass into Dirt on vertical surfaces
   if (colorIndex == 2) {
      if (vNormalW.y < 0.75 + noise * 0.1) {
         color = terrainColors[3];
      }
   }
   */

   // show triangles
   /*
   if (baryPos.r < 0.001) {
      color = vec3(0., 0., 0.);
   }
   if (baryPos.g < 0.001) {
      color = vec3(0., 0., 0.);
   }
   if (baryPos.b < 0.001) {
      color = vec3(0., 0., 0.);
   }
   */

   // show Chunck Parts
   /*
   float dh = blockSize_m * 0.5;
   float dv = blockHeight_m * 0.5;
   float dx = (vPositionL.x + dh) - floor((vPositionL.x + dh) / blockSize_m) * blockSize_m;
   float dy = (vPositionL.y + dv) - floor((vPositionL.y + dv) / blockHeight_m) * blockHeight_m;
   float dz = (vPositionL.z + dh) - floor((vPositionL.z + dh) / blockSize_m) * blockSize_m;

   if (dx < 0.003 || dx > 0.997) {
      color = vec3(1., 0., 1.);
   }
   if (dy < 0.003 || dy > 0.997) {
      color = vec3(1., 0., 1.);
   }
   if (dz < 0.003 || dz > 0.997) {
      color = vec3(1., 0., 1.);
   }
   */

   // show grid
   /*
   float dx = vPositionW.x - floor(vPositionW.x);
   float dz = vPositionW.z - floor(vPositionW.z);

   if (dx < 0.005 || dx > 0.995) {
      color = vec3(0.1, 0., 0.1);
   }
   if (dz < 0.005 || dz > 0.995) {
      color = vec3(0.1, 0., 0.1);
   }
   */
   
   /*
   // show chunck borders
   float dx = vPositionW.x - floor(vPositionW.x / 24.) * 24.;
   float dz = vPositionW.z - floor(vPositionW.z / 24.) * 24.;

   if (dx < 0.05 || dx > 23.95) {
      color = vec3(0.1, 0., 0.1);
   }
   if (dz < 0.05 || dz > 23.95) {
      color = vec3(0.1, 0., 0.1);
   }
   */

   vec2 diffuseUV = vec2(0., 0.);
   if (abs(vNormalW.x) >= abs(vNormalW.y) && abs(vNormalW.x) >= abs(vNormalW.z)) {
      diffuseUV.x = vPositionW.z * 0.5;
      diffuseUV.y = vPositionW.y * 0.5;
   }
   else if (abs(vNormalW.y) >= abs(vNormalW.z)) {
      diffuseUV.x = vPositionW.x * 0.5;
      diffuseUV.y = vPositionW.z * 0.5;
   }
   else {
      diffuseUV.x = vPositionW.x * 0.5;
      diffuseUV.y = vPositionW.y * 0.5;
   }

   color *= texture(diffuseTexture, diffuseUV).rgb;

   if (colorIndex == 2 || colorIndex == 3) {
      // Case dirt and grass > no tall flat surfaces
      float dy = vPositionW.y / blockHeight_m - floor(vPositionW.y / blockHeight_m) + noise * 0.15;
      if ((dy > 0.15 && dy < 0.85)) {
         lightFactor *= 0.7;
      }
   }
   else {
      // Case dirt with potential tall flat surfaces
      float dy = vPositionW.y / blockHeight_m - floor(vPositionW.y / blockHeight_m);
      if ((dy < 0.01 || dy > 0.99) && abs(vNormalW.y) > 0.5) {
         lightFactor *= 1.1;
      }
      else {
         lightFactor *= 0.9;
      }
   }
   
   vec3 uvr = vec3(vPositionL.x / 26. / blockSize_m, vPositionL.z / 26. / blockSize_m, vPositionL.y / 257. / blockHeight_m);
   float gi = texture(lightTexture, uvr).r;
   gi = round(gi * 3.) / 3. + 0.25;
   lightFactor = round(lightFactor * 12.) / 12.;
   lightFactor = lightFactor * gi;

   /*
   if (dx < 0.02 || dx > 0.98) {
      lightFactor *= 0.6;
   }
   if (dz < 0.02 || dz > 0.98) {
      lightFactor *= 0.6;
   }
   */

   
   outColor = vec4(color * debugColor * lightFactor, 1.);
}