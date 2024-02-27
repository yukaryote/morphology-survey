export const controls_html = `<div id="{q}">
<div id="{q}-render" class="render"></div>
<div id="{q}-sensor-render" class="sensor-render"></div>
<div id="{q}-controls" class="controls">
    <button id="{q}-add-sensor">Add sensor</button>
    <button id="{q}-disable-viz">Disable visualization</button>
    <br>
    <label for="{q}-x-slider">X:</label>
    <input type="range" id="{q}-x-slider" min="-1" max="1" step="0.001" value="0" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-x-input" oninput="this.previousSibling.value = this.value"> meters
    <br>
    <label for="{q}-y-slider">Y:</label>
    <input type="range" id="{q}-y-slider" min="0" max="2.5" step="0.001" value="0" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-y-input"> meters
    <br>
    <label for="{q}-z-slider">Z:</label>
    <input type="range" id="{q}-z-slider" min="-1" max="1" step="0.001" value="1" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-z-input"> meters
    <br>
    <label for="{q}-pitch-slider">Pitch:</label>
    <input type="range" id="{q}-pitch-slider" min="-3.1415" max="3.1415" step="0.1" value="0" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-pitch-input"> radians
    <br>
    <label for="{q}-yaw-slider">Yaw:</label>
    <input type="range" id="{q}-yaw-slider" min="-3.1415" max="3.1415" step="0.1" value="0" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-yaw-input"> radians
    <br>
    <label for="{q}-fov-slider">FOV:</label>
    <input type="range" id="{q}-fov-slider" min="0" max="180" step="1" value="90" oninput="this.nextElementSibling.value = this.value">
    <input type="text" class="text-input" id="{q}-fov-input"> degrees
    <br>
</div>
</div>`;

export const lvl_2_html = `<p>The robot's goal and action space remains the same as the previous level, but now its environment could be any of the 90 homes from the <a href="https://arxiv.org/pdf/1709.06158.pdf">Matterport3D dataset</a>. Please take some time to familiarize yourself with the layout <a href="https://aspis.cmpt.sfu.ca/scene-toolkit/scans/simple-viewer?condition=mpr3d&modelId=mpr3d.1pXnuDYAj8r_14">here</a>.
These homes have standard, human-friendly room dimensions. The green ball will still be 1.5m above the ground, but if the house has multiple floors, the ball could be on any of the floors. </p>
<p>In this question, the robot again has 1 RGB camera outputting a 256 x 256 RGB image. Your task is to optimize the camera parameters below to allow the robot to autonomously find the ball as quickly as possible. </p>
<p><b>Robot details: </b>
<ul>
    <li>The robot is on the ground and has actions {move forward 0.1 meters, turn left 10 degrees, turn right 10 degrees}.</li>
    <li>The robot will be controlled by a reinforcement learning (RL) algorithm with your design's sensor output as its input. The RL algorithm has memory of the robot's past actions.</li>
    <li>The robot's forward direction is the positive Z axis.</li>
    <li>The robot has height 4 meters, so the max height of a sensor is 4 meters.</li>
</ul>
</p>
<p><b>Environment details: </b>
<ul>
    <li>The houses may range in size from a studio apartment to a large single family home.</li>
    <li>The ball will spawn inside the home in a reachable area on one of the floors. The ball may spawn in the same floor and room as the robot, or in a different floor or room.</li>
    <li>The ball is positioned at 1.5 meters above the ground and has radius 0.5 meters.</li>
</ul>
</p>

<p><b>Camera controls: </b>Adjust the XYZ position and pitch/yaw of the camera shown in the viewport. All parameters except for pitch are in the robot's coordinates; pitch is local to the sensor. X = red, Y = green, Z = blue.</p>
<p><b>Viewport controls: </b>Click on the camera to edit it. The editable, "active" camera will be pink. You can rotate the view of the robot by holding left-click in the viewport and dragging. Pan by holding ctrl/cmd and dragging.</p>`;


export function applyTemplate(template, properties) {
    var returnValue = "";

    var templateFragments = template.split("{");

    returnValue += templateFragments[0];

    for (var i = 1; i < templateFragments.length; i++) {
        var fragmentSections = templateFragments[i].split("}", 2);
        returnValue += properties[fragmentSections[0]];
        returnValue += fragmentSections[1];
    }

    return returnValue;
}