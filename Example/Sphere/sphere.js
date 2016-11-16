/*
	Name : Draw Sphere By WebGL
	Date : 28 Aug 2015
	Author : Le Viet Quang
	Email : levietquangt2@gmail.com
*/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame   ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
})();

var YWidget = {version:"1.0", description:"3D Widget"};
YWidget.YRendered = function ()
{

};

YWidget.Sphere = function ()
{
    var ui = this;
    var vsh_txt = "attribute vec3 aVertexPosition;\n";
    vsh_txt    += "attribute vec2 aTextureCoord;\n";
    vsh_txt    += "attribute vec3 aVertexColor;\n";
    vsh_txt    += "uniform mat4 uMVMatrix;\n";
    vsh_txt    += "uniform mat4 uPMatrix;\n";
    vsh_txt    += "varying vec2 vTextureCoord;\n";
    vsh_txt    += "varying highp vec4 vColor;\n";
    vsh_txt    += "void main(void) {\n";
    vsh_txt    += "    gl_Position = uMVMatrix * uPMatrix *  vec4(aVertexPosition, 1.0);\n";
    vsh_txt    += "    vTextureCoord = aTextureCoord;\n";
    vsh_txt    += "    vColor = vec4(aVertexColor,1.0);\n";
    vsh_txt    += "}\n";

    var fsh_txt = "precision mediump float;\n";
    fsh_txt     += "varying vec2 vTextureCoord;\n";
    fsh_txt     += "uniform sampler2D uSampler;\n";
    fsh_txt     += "varying highp vec4 vColor;\n";
    fsh_txt     += "void main(void) {\n";
    fsh_txt     += "    vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n";
    fsh_txt     += "    //gl_FragColor = textureColor;\n";
    fsh_txt     += "    gl_FragColor = vColor;\n";
    fsh_txt     += "}\n";

    var verticesPosition = [];
    var verticesColor = [];
    var textureCoordData = [];
    var verticesIndexData = [];
    var modelViewMatrix = null;
    var projectionMatrix = null;

    var verticesPositionBuffer = null;
    var verticesColorBuffer = null;
    var textureCoordBuffer = null;
    var verticesIndexBuffer = null;

    var textureName = "";
    var glTexture = null;
    var glProgram = null;
    var hasError = false;

    var vertexShader = null;
    var fragmentShader = null;

    ui.canvas = null;
    ui.ctx = null;
    ui.vWidth = 0;
    ui.vHeight = 0;
    ui.span = 0;
    ui.tilt = 0;
    ui.zoom = 1;
    ui.isMouseDown = false;
    ui.latitudeBands = 30;
    ui.longitudeBands = 30;

    ui.radius = 0.8;
    ui.center = [0,0,0];

    function update()
    {
        if(ui.isMouseDown == false)
        {
            ui.span += 0.5;
            if(ui.span > 360) ui.span = 360 - ui.span;
        }
    }

    function makeShereData()
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

                textureCoordData.push(u);
                textureCoordData.push(v);
                verticesPosition.push(ui.radius * x);
                verticesPosition.push(ui.radius * y);
                verticesPosition.push(ui.radius * z);
                verticesColor.push(255.0);
                verticesColor.push(200.0);
                verticesColor.push(155.0);
            }
        }

        // Index array
        for (var i = 0; i < ui.latitudeBands; i++) {
            for (var longNumber = 0; longNumber < ui.longitudeBands; longNumber++) {
                var first = (i * (ui.longitudeBands + 1)) + longNumber;
                var second = first + ui.longitudeBands + 1;

                verticesIndexData.push(first);
                verticesIndexData.push(second);
                verticesIndexData.push(first + 1);

                verticesIndexData.push(second);
                verticesIndexData.push(second + 1);
                verticesIndexData.push(first + 1);
            }
        }
    }

    function makeShader(source,type)
    {
        if(hasError == true) return null;

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
                hasError = true;
            }
        }
        else
        {
            if (type == ui.ctx.VERTEX_SHADER)
            {
                var errorMessage = "Can't create vertex shader";
                console.log(errorMessage);
                hasError = true;
            }
            else if(type == ui.ctx.FRAGMENT_SHADER)
            {
                var errorMessage = "Can't create fragment shader";
                console.log(errorMessage);
                hasError = true;
            }
            else
            {
                var errorMessage = "Unknown shader type";
                console.log(errorMessage);
                hasError = true;
            }
        }
        return shader;
    }

    function initWebGLContext()
    {
        try
        {
            ui.ctx = ui.canvas.getContext("experimental-webgl",{"antialias":true}) || ui.canvas.getContext("webgl",{"antialias":true});
        }
        catch(e)
        {
            hasError = true;
            ui.ctx = null;
            throw Error(e.toString());
        }
    }

    function setupWebGLViewport()
    {
        ui.ctx.viewport(0,0, ui.canvas.width, ui.canvas.height);
        ui.vWidth = ui.canvas.width;
        ui.vHeight = ui.canvas.height;
    }

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
        modelViewMatrix = mat4.create();
        mat4.identity(modelViewMatrix);
        mat4.multiply(modelViewMatrix, Mmatrix, Vmatrix);

        // Create Projection Matrix
        projectionMatrix = mat4.create();
        mat4.perspective(45, ui.vWidth/ ui.vHeight, 0.1, 100.0, projectionMatrix);
    }

    function setupWebGLBuffer()
    {
        makeShereData();

        verticesPositionBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, verticesPositionBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(verticesPosition), ui.ctx.STATIC_DRAW);
        verticesPositionBuffer.itemSize = 3;
        verticesPositionBuffer.numItems = verticesPosition.length/3;

        verticesColorBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, verticesColorBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(verticesColor), ui.ctx.STATIC_DRAW);
        verticesColorBuffer.itemSize = 3;
        verticesColorBuffer.numItems = verticesColor.length/3;

        textureCoordBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, textureCoordBuffer);
        ui.ctx.bufferData(ui.ctx.ARRAY_BUFFER, new Float32Array(textureCoordData), ui.ctx.STATIC_DRAW);
        textureCoordBuffer.itemSize = 2;
        textureCoordBuffer.numItems = textureCoordData.length/2;

        verticesIndexBuffer = ui.ctx.createBuffer();
        ui.ctx.bindBuffer(ui.ctx.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
        ui.ctx.bufferData(ui.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndexData), ui.ctx.STATIC_DRAW);
        verticesIndexBuffer.itemSize = 1;
        verticesIndexBuffer.numItems = verticesIndexData.length;
    }

    function initWebGLShader()
    {
        // Get Shader data
        vertexShader = makeShader(vsh_txt,ui.ctx.VERTEX_SHADER);
        fragmentShader = makeShader(fsh_txt, ui.ctx.FRAGMENT_SHADER);

        if (hasError == false)
        {
            try
            {
                glProgram = ui.ctx.createProgram();

                ui.ctx.attachShader(glProgram, vertexShader);
                ui.ctx.attachShader(glProgram, fragmentShader);
                ui.ctx.linkProgram(glProgram);

                if(!ui.ctx.getProgramParameter(glProgram, ui.ctx.LINK_STATUS))
                {
                    var errorMessage = "Could not initialise shaders";
                    console.log(errorMessage);
                    ui.hasError = true;
                    return;
                }

                ui.ctx.useProgram(glProgram);
            }
            catch (e)
            {
                hasError = true;
                ui.ctx = null;
                throw Error(e.toString());
            }
        }
    }

    function setupShader()
    {
        if(hasError == true) return;

        // Get-set Shader Uniform
        glProgram.pMatrixUniform = ui.ctx.getUniformLocation(glProgram, "uPMatrix");
        ui.ctx.uniformMatrix4fv(glProgram.pMatrixUniform, false, projectionMatrix);

        glProgram.mvMatrixUniform = ui.ctx.getUniformLocation(glProgram, "uMVMatrix");
        ui.ctx.uniformMatrix4fv(glProgram.mvMatrixUniform, false, modelViewMatrix);

        // Get-set Shader Attribute
        glProgram.vertexPositionAttribute  = ui.ctx.getAttribLocation(glProgram, "aVertexPosition");
        ui.ctx.enableVertexAttribArray(glProgram.vertexPositionAttribute);
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, verticesPositionBuffer);
        ui.ctx.vertexAttribPointer(glProgram.vertexPositionAttribute, verticesPositionBuffer.itemSize, ui.ctx.FLOAT, false, 0, 0);

        glProgram.textureCoordAttribute    = ui.ctx.getAttribLocation(glProgram, "aTextureCoord");
        ui.ctx.enableVertexAttribArray(glProgram.textureCoordAttribute);
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, textureCoordBuffer);
        ui.ctx.vertexAttribPointer(glProgram.textureCoordAttribute, textureCoordBuffer.itemSize, ui.ctx.FLOAT, false, 0, 0);

        glProgram.vertexColorAttribute    = ui.ctx.getAttribLocation(glProgram, "aVertexColor");
        ui.ctx.enableVertexAttribArray(glProgram.vertexColorAttribute);
        ui.ctx.bindBuffer(ui.ctx.ARRAY_BUFFER, verticesColorBuffer);
        ui.ctx.vertexAttribPointer(glProgram.vertexColorAttribute, verticesColorBuffer.itemSize, ui.ctx.FLOAT, false, 0, 0);

        // Get set for Texture
        ui.ctx.activeTexture(ui.ctx.TEXTURE0);
        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, glTexture);
        glProgram.samplerUniform = ui.ctx.getUniformLocation(glProgram, "uSampler");
        ui.ctx.uniform1i(glProgram.samplerUniform, 0);
    }

    function initWebGLTexture()
    {
        glTexture = ui.ctx.createTexture();
        glTexture.image = new Image();
        glTexture.image.onload = function () {
            setupWebGLTexture()
        };
        glTexture.image.src = textureName;
    }

    function setupWebGLTexture()
    {
        ui.ctx.pixelStorei(ui.ctx.UNPACK_FLIP_Y_WEBGL, true);
        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, glTexture);
        ui.ctx.texImage2D(ui.ctx.TEXTURE_2D, 0, ui.ctx.RGBA, ui.ctx.RGBA, ui.ctx.UNSIGNED_BYTE, glTexture.image);
        ui.ctx.texParameteri(ui.ctx.TEXTURE_2D, ui.ctx.TEXTURE_MAG_FILTER, ui.ctx.LINEAR);
        ui.ctx.texParameteri(ui.ctx.TEXTURE_2D, ui.ctx.TEXTURE_MIN_FILTER, ui.ctx.LINEAR_MIPMAP_NEAREST);
        ui.ctx.generateMipmap(ui.ctx.TEXTURE_2D);

        ui.ctx.bindTexture(ui.ctx.TEXTURE_2D, null);

        rendered();
    }

    function drawWebGLContext()
    {
        if(hasError == true) return;

        // Clear Context
        ui.ctx.clearColor(0.0,0.0,0.0,1.0);
        ui.ctx.clear(ui.ctx.COLOR_BUFFER_BIT | ui.ctx.DEPTH_BUFFER_BIT);
        ui.ctx.enable(ui.ctx.DEPTH_TEST);

        // Draw
        ui.ctx.bindBuffer(ui.ctx.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
        ui.ctx.drawElements(ui.ctx.TRIANGLES, verticesIndexBuffer.number_vertex_points, ui.ctx.UNSIGNED_SHORT, 0);
    }

    function rendered()
    {
        setupWebGLMatrix();
        setupShader();
        drawWebGLContext();
        update();
        requestAnimationFrame(rendered,ui.canvas);
    }

    this.initSphere = function (canvas, radius, texturename, center)
    {
        ui.canvas = canvas;
        ui.radius = radius;
        ui.center = center;
        textureName = texturename;

        initWebGLContext();
        setupWebGLViewport();
        setupWebGLBuffer();
        initWebGLShader();
        initWebGLTexture();
    }

};

window.onload = function()
{
    var canvas = document.getElementById("canvas");
	var gl = new YWidget.Sphere();
    gl.initSphere(canvas, 0.8, "Earth.png", [0,0,0]);
}
