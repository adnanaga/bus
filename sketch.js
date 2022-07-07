//Screen Dimensions
const SCREEN_W = 960
const SCREEN_H = 672

const SCREEN_CX = 960/2
const SCREEN_CY = 672/2


let counter =0;

let leftAdjust = 20;
let rightVeer = 5;


// Road Data
let roadSegments = [];
let singleSegmentLength = 100;
let roadWidth = 3000;

// total road length
let roadLength = null;

let totalSegments = null;

let visibleSegments = 200;

let rumbleSegments = 4;

let lanes = 2

////////////////////////////

// Camera

let cameraXVal = 0;
let cameraYVal = 1000;
let cameraZVal = 0;

let distToPlayerVal = 100;

let distToPlaneVal = null;

////////////////////////////

// Player
let maxSpeed = singleSegmentLength/(1/60);
let speed = 0;

let playerX = 0;
let playerY = 1000;
let playerZ = 100;

let steeringVal = 0;
let rotationVal = 0;


////////////////////////////

// Game Styling
let sky = '#3EC5D2'
let inside;
let sand;
let curb;

////////////////////////////


function preload(){
  inside = loadImage('assets/desertbus_Sprites.png');
  sand = loadImage('assets/sand.png');
  curb = loadImage('assets/curb.png');
}

function setup() {
  createCanvas(960, 672, WEBGL);
  // createCanvas(960, 672);
  // clear Arrays
  roadSegments = [];

  // Create the road
  createRoad();

    // Store total Segments
  totalSegments = roadSegments.length;

  roadLength = totalSegments * singleSegmentLength;

  distToPlaneVal = 1 / (cameraYVal / distToPlayerVal);
  
  
}

function draw() {
  background(sky);

  let dt = Math.min(1, deltaTime/1000)
  updatePlayer(dt)
  updateCamera();
  render3D();

  if(speed > 5){
    image(inside, 0, (sin(counter/20)*5), 1100, 770, 0, 0, 320, 224);

  } else {
    image(inside, 0, 0, 1100, 770, 0, 0, 320, 224);
  }
  
  // Lets increase our distance anytime the speed is positive

  if (speed > 0 ){
    counter+=4;
    // updateSteering()
    if (!(keyIsDown(LEFT_ARROW) || keyIsDown(65))){
      steeringVal+= rightVeer
      if(rotationVal > 0){
        rotationVal--;
      }
    }
    
  }

  if(rotationVal >= 0 && rotationVal < 15){
        image(inside, -300, (sin(counter/20)*5)+290, 85*3.43, 56*3.43, 250, 368, 85, 56);

  }

  else if(rotationVal >= 15 && rotationVal < 30){
        image(inside, -310, (sin(counter/20)*5)+280, 80*3.43, 59*3.43, 160, 365, 80, 59);

  }

  else if(rotationVal >= 30 && rotationVal < 45){
        image(inside, -322, (sin(counter/20)*5)+275, 72*3.43, 63*3.43, 80, 361, 72, 63);

  }

  else if(rotationVal >= 45){
    image(inside, -285, (sin(counter/20)*5)+260, 59*3.43, 65*3.43, 8, 359, 65, 59);
  }


    // image(inside, -300, (sin(counter/20)*5)+290, 85*3.43, 56*3.43, 250, 368, 85, 56);
    // image(inside, -310, (sin(counter/20)*5)+280, 80*3.43, 59*3.43, 160, 365, 80, 59);
    // image(inside, -322, (sin(counter/20)*5)+275, 72*3.43, 63*3.43, 80, 361, 72, 63);
    // image(inside, -285, (sin(counter/20)*5)+260, 59*3.43, 65*3.43, 8, 359, 65, 59);



  // How do we compare counter to the actual driving value

  
  if (keyIsDown(UP_ARROW) || keyIsDown(87)){
    if(speed < maxSpeed){
      speed+=10;
      
    }
  } else {
    if(speed >0)
      speed-=10;
  }

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)){
    updateSteering('left');
  }

  console.log(rotationVal)
  
  imageMode(CENTER)
}


function createRoad() {
  createSection(1000);
}

function createSection(numSegments) {
  for (let i =0; i<numSegments; i++){
    createSegment();
  }
}

function createSegment() {

  // Define Colors

  const COLORS = {
    LIGHT: {road:'#717171', wheat: '#D7921B', rumble: '#704F03'},
    DARK: {road:'#717171', wheat: '#D7921B', rumble: '#704F03', lane: '#E6CC50'},
  }

  let n = roadSegments.length;

  roadSegments.push({
    index:n,

    point: {
      world: {x:0,y:-1000,z:n*singleSegmentLength},
      screen: {x:0,y:0,w:0},
      scale: -1
    },
    color: Math.floor(n/rumbleSegments)%2 ? COLORS.DARK : COLORS.LIGHT  })
}

function getSegment(positionZ) {
  if(positionZ<0) {
    positionZ += roadLength;
  }
  let index = Math.floor(positionZ / singleSegmentLength) % totalSegments
  return roadSegments[index]

}

function project3D(point, cameraX, cameraY, cameraZ, cameraDepth){

// translating world coordiantes to camera coordinates
  var transX = point.world.x - cameraX
  var transY = point.world.y - cameraY
  var transZ = point.world.z - cameraZ

// scaling factor based on the law of similar triangles
 point.scale = cameraDepth/transZ;
 
// projecting camera coordinates onto a normalized prjection plane
 var projectedX = point.scale * transX - 1
 var projectedY = point.scale * transY +1
 var projectedW = point.scale * roadWidth

 // projecting camera coordinates onto a normalized prjection plane
 point.screen.x = Math.round((1 + projectedX) * SCREEN_CX);
 point.screen.y = Math.round((1 - projectedY) * SCREEN_CY);
 point.screen.w = Math.round(projectedW * SCREEN_CX);
}

function render3D(){

  let clipBottomLine = SCREEN_H

  let baseSegment = getSegment(cameraZVal);
  let baseIndex = baseSegment.index

  for(let n = 0; n < visibleSegments; n++){

    let currIndex = (baseIndex + n) % totalSegments;
    let currSegment = roadSegments[currIndex]

    project3D(currSegment.point, cameraXVal, cameraYVal, cameraZVal, distToPlaneVal);

    let currBottomLine = currSegment.point.screen.y

    if (n > 0 && currBottomLine < clipBottomLine){
      let prevIndex = (currIndex>0) ? currIndex -1: totalSegments-1;
      let prevSegment = roadSegments[prevIndex]

      var p1 = prevSegment.point.screen;
      var p2 = currSegment.point.screen;

      drawSegment(
        p1.x, p1.y, p1.w,
        p2.x, p2.y, p2.w,
        currSegment.color
      );

      clipBottomLine = currBottomLine
    }
  }
}

function drawSegment(x1, y1, w1, x2, y2, w2, color){

  // Draw Wheat
  // fill(color.wheat);
  texture(sand);
  // textureMode(NORMAL);
  rect(-480,y2,SCREEN_W, y1-y2)

  this.drawPolygon(x1-w1, y1,	x1+w1, y1, x2+w2, y2, x2-w2, y2, color.road);

  var rumble_w1 = w1;
  var rumble_w2 = w2;
  this.drawPolygon(x1-w1-rumble_w1, y1, x1-w1, y1, x2-w2, y2, x2-w2-rumble_w2, y2, 'rumble');
  this.drawPolygon(x1+w1+rumble_w1, y1, x1+w1, y1, x2+w2, y2, x2+w2+rumble_w2, y2, 'rumble');


  if(color.lane){

    let lineW1 = (w1/10)/2;
    let lineW2 = (w2/10)/2;

    let laneW1 = (w1*2)/lanes;
    let laneW2 = (w2*2)/lanes;

    let laneX1 = x1-w1;
    let laneX2 = x2-w2;

    for (let i =1; i<lanes; i++){
      laneX1 += laneW1;
      laneX2 += laneW2;

      // console.log(laneX1)
      this.drawPolygon(
        laneX1-lineW1, y1, 
        laneX1+lineW1, y1, 
        laneX2+lineW2, y2, 
        laneX2-lineW2, y2, 
        color.lane
      );
    }
  }
}

function drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, whatColor){
  if(whatColor === 'rumble'){
    texture(curb);
  } else {
    fill(whatColor);
  }
  noStroke();
  beginShape();
  vertex(x1,y1)
  vertex(x2,y2)
  vertex(x3,y3)
  vertex(x4,y4)  
  endShape();
}


// Player Functions

function restartPlayer(){
  playerX = 0;
  playerY = 0;
  playerZ = 0;

  speed = maxSpeed;
}

function updatePlayer(dt){
  playerZ +=speed*dt

  if (playerZ > roadLength) {
      playerZ -= (roadLength-100);
  }
}

function updateCamera(){

  cameraXVal = (playerX * roadWidth) + steeringVal

  cameraZVal = playerZ - distToPlayerVal
  

  if (cameraZVal < 0) {
    cameraZVal += roadLength;
  }
}

function updateSteering(direction){
  if(direction === 'left'){
    steeringVal -= leftAdjust
    rotationVal = rotationVal + 1
  } else {
    steeringVal+= rightVeer
    rotationVal = 0;
  }
}