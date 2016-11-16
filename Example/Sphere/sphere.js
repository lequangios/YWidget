/*
	Name : Draw Sphere By WebGL
	Date : 28 Aug 2015
	Author : Le Viet Quang
	Email : levietquangt2@gmail.com
*/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
})();

var YWidget = {version:"1.0", description:"3D Widget"};
YWidget.YRendered = function ()
{

}


YWidget.Sphere = function () {
    var ui = this;

    this.canvas = null;
    this.ctx = null;
    this.vWidth = 1024;
    this.vHeight = 768;
    this.hasError = false;

    this.radius = 10.0;
    this.latitudeBands = 30;
    this.longitudeBands = 30;
    this.centerPoint = [0.0, 0.0, 0.0];
    this.textureName = "";

    this.vertexPositionData = [];
    this.normalData = [];
    this.textureCoordData = [];
    this.indexData = [];
    this.colorData = [];

    this.vertexPositionBuffer = null;
    this.normalBuffer = null;
    this.textureCoordBuffer = null;
    this.indexBuffer = null;
    this.colorBuffer = null;

    this.modelViewMatrix;
    this.projectionMatrix;
    this.normalMatrix;
    this.adjustedLD;

    this.vertextShaderSource;
    this.fragmentShaderSource;
    this.vertexShader;
    this.fragmentShader;
    this.shaderProgram;

    this.isMouseDown = false;
    this.isTextureLoaded = false;

    this.span = 0;
    this.tilt= 0;

    function update()
    {
        ui.span += 0.1;
        if(ui.span > 360) ui.span = 0;
    };

    function createSphereData()
    {
        // Vertex array
        for (var i = 0; i <= ui.latitudeBands; i++) {
            var theta = i * Math.PI / ui.latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var j = 0; j <= ui.longitudeBands; j++) {
                var phi = j * 2 * Math.PI / ui.longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (j / ui.longitudeBands);
                var v = 1 - (i / ui.latitudeBands);

                ui.normalData.push(x);
                ui.normalData.push(y);
                ui.normalData.push(z);
                ui.textureCoordData.push(u);
                ui.textureCoordData.push(v);
                ui.vertexPositionData.push(ui.radius * x);
                ui.vertexPositionData.push(ui.radius * y);
                ui.vertexPositionData.push(ui.radius * z);
            }
        }

        var colorArr = [
            [1.0, 0.0, 1.0],
            [0.0, 1.0, 1.0],
            [1.0, 0.0, 1.0],
            [0.0, 1.0, 1.0]
        ];

        // Index array
        for (var i = 0; i < ui.latitudeBands; i++) {
            for (var longNumber = 0; longNumber < ui.longitudeBands; longNumber++) {
                var first = (i * (ui.longitudeBands + 1)) + longNumber;
                var second = first + ui.longitudeBands + 1;

                var c = first%4;
                var ci = colorArr[c];

                ui.colorData.push(ci[0]);
                ui.colorData.push(ci[1]);
                ui.colorData.push(ci[2]);

                ui.indexData.push(first);
                ui.indexData.push(second);
                ui.indexData.push(first + 1);

                c = second%4;
                ci = colorArr[c];

                ui.colorData.push(ci[0]);
                ui.colorData.push(ci[1]);
                ui.colorData.push(ci[2]);

                ui.indexData.push(second);
                ui.indexData.push(second + 1);
                ui.indexData.push(first + 1);
            }
        }
    };

    function initWebGLContext()
    {
        try
        {
            ui.ctx = ui.canvas.getContext("experimental-webgl",{"antialias":true}) || ui.canvas.getContext("webgl",{"antialias":true});
        }
        catch(e)
        {
            ui.hasError = true;
            ui.ctx = null;
            throw Error(e.toString());
        }
    };

    function setupViewport()
    {
        if(ui.hasError == false)
        {
            ui.ctx.viewport(0,0, ui.canvas.width, ui.canvas.height);
            ui.vWidth = ui.canvas.width;
            ui.vHeight = ui.canvas.height;
        }
    };

    function setupWebGLBuffer()
    {
        createSphereData();

        ui.normalBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.normalBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(ui.normalData), ui.ctx.STATIC_DRAW);
        ui.normalBuffer.itemSize = 3;
        ui.normalBuffer.numItems = ui.normalData.length/3;

        ui.textureCoordBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.textureCoordBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(ui.textureCoordData), ui.ctx.STATIC_DRAW);
        ui.textureCoordBuffer.itemSize = 2;
        ui.textureCoordBuffer.numItems = ui.textureCoordData.length/2;

        ui.vertexPositionBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.vertexPositionBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(ui.vertexPositionData), ui.ctx.STATIC_DRAW);
        ui.vertexPositionBuffer.itemSize = 3;
        ui.vertexPositionBuffer.numItems = ui.vertexPositionData.length/3;

        ui.colorBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.colorBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(ui.colorData), ui.ctx.STATIC_DRAW);
        ui.colorBuffer.itemSize = 3;
        ui.colorBuffer.numItems = ui.colorData.length/3;

        ui.indexBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ELEMENT_ARRAY_BUFFER, ui.indexBuffer);
        ui.ctx.bufferData(ui.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(ui.indexData), ui.ctx.STATIC_DRAW);
        ui.indexBuffer.itemSize = 1;
        ui.indexBuffer.numItems = ui.indexData.length;
    };

    function setupWebGLMatrix()
    {
        var Vmatrix = mat4.create();
        var Mmatrix = mat4.create();

        // Create View-Model Matrix
        mat4.lookAt(Vmatrix, [0,0,-1], [0,0,0], [0,1,0]);

        // Create Transform Matrix
        var tmp = mat4.create();
        mat4.identity(tmp);
        mat4.rotate(Mmatrix,tmp,ui.span,[0.0,1.0,0.0]);
        mat4.rotate(Mmatrix,Mmatrix,ui.tilt,[1.0,0.0,0.0]);
        mat4.translate(Mmatrix,Mmatrix,[0.0,0.0,1.0]);

        // Create Model View matrix
        ui.modelViewMatrix = mat4.create();
        mat4.multiply(ui.modelViewMatrix, Mmatrix, Vmatrix);

        // Create Projection Matrix
        ui.projectionMatrix = mat4.create();
        mat4.perspective(45, ui.vWidth/ ui.vHeight, 0.1, 100.0, ui.projectionMatrix);

        // Create normal Matrix
        ui.normalMatrix = mat3.create();
        mat4.toInverseMat3(ui.modelViewMatrix, ui.normalMatrix);
        mat3.transpose(ui.normalMatrix);

        // Light Vector
        var lightingDirection = [0, 1, 1];
        ui.adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, ui.adjustedLD);
        vec3.scale(ui.adjustedLD, -1);
    };

    function makeShader(source,type)
    {
        if(ui.hasError == true) return null;

        // Create New Shader
        var shader = null;

        if(type == ui.ctx.VERTEX_SHADER)
        {
            shader = ui.ctx.createShader(ui.ctx.VERTEX_SHADER);
        }
        else if(type == ui.ctx.FRAGMENT_SHADER)
        {
            shader = ui.ctx.createShader(ui.ctx.FRAGMENT_SHADER);
        }

        // Add source and compile shader
        if(shader != null)
        {
            ui.ctx.shaderSource(shader, source);
            ui.ctx.compileShader(shader);

            if(!ui.ctx.getShaderParameter(shader, ui.ctx.COMPILE_STATUS))
            {
                var errorMessage = ui.ctx.getShaderInfoLog(shader);
                console.log(errorMessage);
                ui.hasError = true;
            }
        }
        else
        {
            if (type == ui.ctx.VERTEX_SHADER)
            {
                var errorMessage = "Can't create vertex shader";
                console.log(errorMessage);
                ui.hasError = true;
            }
            else if(type == ui.ctx.FRAGMENT_SHADER)
            {
                var errorMessage = "Can't create fragment shader";
                console.log(errorMessage);
                ui.hasError = true;
            }
            else
            {
                var errorMessage = "Unknown shader type";
                console.log(errorMessage);
                ui.hasError = true;
            }
        }

        return shader;

    }

    function initShader()
    {
        // Get Shader data
        ui.vertextShaderSource = document.getElementById("shader-vs").innerHTML;
        ui.fragmentShaderSource = document.getElementById("shader-fs").innerHTML;

        ui.vertexShader = makeShader(ui.vertextShaderSource,ui.ctx.VERTEX_SHADER);
        ui.fragmentShader = makeShader(ui.fragmentShaderSource, ui.ctx.FRAGMENT_SHADER);

        if (!ui.hasError) {
            ui.shaderProgram = ui.ctx.createProgram();

            ui.ctx.attachShader(ui.shaderProgram, ui.vertexShader);
            ui.ctx.attachShader(ui.shaderProgram, ui.fragmentShader);
            ui.ctx.linkProgram(ui.shaderProgram);

            if(!ui.ctx.getProgramParameter(ui.shaderProgram, ui.ctx.LINK_STATUS))
            {
                var errorMessage = "Could not initialise shaders";
                console.log(errorMessage);
                ui.hasError = true;
                return;
            }

            ui.ctx.useProgram(ui.shaderProgram);

            ui.shaderProgram.vertexPositionAttribute  = ui.ctx.getAttribLocation(ui.shaderProgram, "aVertexPosition");
            ui.ctx.enableVertexAttribArray(ui.shaderProgram.vertexPositionAttribute);

            ui.shaderProgram.textureCoordAttribute    = ui.ctx.getAttribLocation(ui.shaderProgram, "aTextureCoord");
            ui.ctx.enableVertexAttribArray(ui.shaderProgram.textureCoordAttribute);

            ui.shaderProgram.vertexNormalAttribute    = ui.ctx.getAttribLocation(ui.shaderProgram, "aVertexNormal");
            ui.ctx.enableVertexAttribArray(ui.shaderProgram.vertexNormalAttribute);

            ui.shaderProgram.vertexColorAttribute    = ui.ctx.getAttribLocation(ui.shaderProgram, "aVerticesColor");
            ui.ctx.enableVertexAttribArray(ui.shaderProgram.vertexColorAttribute);

            ui.shaderProgram.pMatrixUniform           = ui.ctx.getUniformLocation(ui.shaderProgram, "uPMatrix");
            ui.shaderProgram.mvMatrixUniform          = ui.ctx.getUniformLocation(ui.shaderProgram, "uMVMatrix");
            ui.shaderProgram.nMatrixUniform           = ui.ctx.getUniformLocation(ui.shaderProgram, "uNMatrix");
            ui.shaderProgram.samplerUniform           = ui.ctx.getUniformLocation(ui.shaderProgram, "uSampler");
            ui.shaderProgram.useLightingUniform       = ui.ctx.getUniformLocation(ui.shaderProgram, "uUseLighting");
            ui.shaderProgram.ambientColorUniform      = ui.ctx.getUniformLocation(ui.shaderProgram, "uAmbientColor");
            ui.shaderProgram.lightingDirectionUniform = ui.ctx.getUniformLocation(ui.shaderProgram, "uLightingDirection");
            ui.shaderProgram.directionalColorUniform  = ui.ctx.getUniformLocation(ui.shaderProgram, "uDirectionalColor");
        }
    };

    function setupShader()
    {
        if(ui.hasError == true) return;

        // Get-set Shader Uniform
        ui.ctx.uniformMatrix4fv(ui.shaderProgram.pMatrixUniform, false, ui.projectionMatrix);
        ui.ctx.uniformMatrix4fv(ui.shaderProgram.mvMatrixUniform, false, ui.modelViewMatrix);
        ui.ctx.uniformMatrix3fv(ui.shaderProgram.nMatrixUniform, false, ui.normalMatrix);

        // Get-set Shader Attribute
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.vertexPositionBuffer);
        ui.ctx.vertexAttribPointer(ui.shaderProgram.vertexPositionAttribute, ui.vertexPositionBuffer.itemSize, ui.ctx.FLOAT, false, 0, 0);

        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.textureCoordBuffer);
        ui.ctx.vertexAttribPointer(ui.shaderProgram.textureCoordAttribute, ui.textureCoordBuffer.itemSize, ui.ctx.FLOAT, false, 0, 0);

        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.normalBuffer);
        ui.ctx.vertexAttribPointer(ui.shaderProgram.vertexNormalAttribute, ui.normalBuffer.itemSize,ui.ctx.FLOAT, false, 0, 0);

        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, ui.colorBuffer);
        ui.ctx.vertexAttribPointer(ui.shaderProgram.vertexColorAttribute, ui.colorBuffer.itemSize,ui.ctx.FLOAT, false, 0, 0);

        // Set Light
        ui.ctx.uniform1i(ui.shaderProgram.useLightingUniform, false);
        ui.ctx.uniform3f(ui.shaderProgram.ambientColorUniform, 255, 255, 255);
        ui.ctx.uniform3fv(ui.shaderProgram.lightingDirectionUniform, ui.adjustedLD);
        ui.ctx.uniform3f(ui.shaderProgram.directionalColorUniform, 0, 200, 255);

    };

    function initTexture()
    {
        if(ui.hasError == true) return;

        ui.sphereTexture = ui.ctx.createTexture();

        // Asynchronously load an image
        ui.sphereTexture.image = new Image();
        ui.sphereTexture.image.crossOrigin = "anonymous";
        ui.sphereTexture.image.addEventListener("load",textureLoaded,false);
        ui.sphereTexture.image.src = ui.textureName;
    };

    function textureLoaded()
    {
        // Get-set Shader Texture
        ui.ctx.activeTexture(ui.ctx.TEXTURE0);
        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, ui.sphereTexture);
        ui.ctx.uniform1i(ui.shaderProgram.samplerUniform, 0);


        ui.ctx.pixelStorei(ui.ctx.UNPACK_FLIP_Y_WEBGL, true);
        ui.ctx.texImage2D(ui.ctx.TEXTURE_2D, 0, ui.ctx.RGBA, ui.ctx.RGBA, ui.ctx.UNSIGNED_BYTE, ui.sphereTexture.image);
        ui.ctx.texParameteri(ui.ctx.TEXTURE_2D, ui.ctx.TEXTURE_MAG_FILTER, ui.ctx.LINEAR);
        ui.ctx.texParameteri(ui.ctx.TEXTURE_2D, ui.ctx.TEXTURE_MIN_FILTER, ui.ctx.LINEAR_MIPMAP_NEAREST);
        ui.ctx.generateMipmap(ui.ctx.TEXTURE_2D);
        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, null);

        ui.isTextureLoaded = true;

        drawContext();

        requestAnimFrame(rendered,ui.canvas);
    };

    function applyDataForDrawn()
    {
        // Get-set Shader Texture
        ui.ctx.activeTexture(ui.ctx.TEXTURE0);
        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, ui.sphereTexture);
        ui.ctx.uniform1i(ui.shaderProgram.samplerUniform, 0);

        setupShader();

    }

    function drawContext()
    {
        if(ui.hasError == true) return;

        applyDataForDrawn();

        // Clear Context
        ui.ctx.clearColor(0.0,0.0,0.0,1.0);
        ui.ctx.clear(ui.ctx.COLOR_BUFFER_BIT | ui.ctx.DEPTH_BUFFER_BIT);
        ui.ctx.enable(ui.ctx.DEPTH_TEST);
        ui.ctx.lineWidth(2.5);

        // Draw
        ui.ctx.bindBuffer(ui.ctx.ELEMENT_ARRAY_BUFFER, ui.indexBuffer);
        ui.ctx.drawElements(ui.ctx.LINE_LOOP, ui.indexBuffer.numItems, ui.ctx.UNSIGNED_SHORT, 0);

    }

    function rendered()
    {
        setupWebGLMatrix();
        drawContext();
        update();

        requestAnimFrame(rendered,ui.canvas);
    }

    ui.initEarth = function (canvas, texture, radius)
    {
        ui.radius = radius;
        ui.textureName = texture;
        ui.canvas = canvas;

        initWebGLContext();
        setupViewport();
        setupWebGLBuffer();
        setupWebGLMatrix();
        initShader();
        initTexture();
    }

};

window.onload = function()
{
    var canvas = document.getElementById("canvas");
	var gl = new YWidget.Sphere();
    gl.initEarth(canvas,"Earth.png",1);
}
