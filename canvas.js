
const GETCANVAS = Symbol('#Canvas_GetObject');
const SETBACKGROUNDIMG = Symbol("#Canvas_SetBackGroundImg");
const SETCANVASHEIGHTANDWIDTH = Symbol("#Canvas_SetHeightAndWidth");

const DRAWING = Symbol("#Canvas_DRAWING");

const WINDOWTOCANVAS = Symbol("#Canvas_windowToCanvas");

const SETOPERATOR = Symbol("#Canvas_setOperator");

const RESTORE = Symbol("Canvas_Restore");
const CLEARCANVAS = Symbol("Canvas_CLEAR");

class MyCanvas {
  /**
   * 
   * @param {Object} canvas2D canvas画布的Dom 节点
   */
  constructor(canvas2D) {
    this.canvasObj = canvas2D;
    this.canvasObj.disableScroll = true;
    this.ctx = canvas2D.getContext('2d');//获取操作画布的事件

    this.preDrawAry = [];//当前绘图表面数组（模拟栈）
    this.middleAry = [];//撤销的动作存入数组

    this.ring = 0;//角度

    //如果画布的框高没设置的话就是默认的宽300，高150
    // this.canvasWidth = this.ctx.canvas.width;//记录画布的宽度
    // this.canvasHeight = this.ctx.canvas.height;//记录画布的高度

    this.beginX = 0;//鼠标或者触摸按下的时候的位置
    this.beginY = 0;

    this.downFlag = false;//按下去的标志位

    this.currentX = 0;//鼠标此时此刻的位置
    this.currentY = 0;

    //另一种记录涂鸦的方式，将每次移动的位置记录下来（可以用来做橡皮擦功能）
    this.moveLineArr = [];

    this.canvasStyleConfig = {
      eraserWidth: 10,//橡皮擦的大小 (n*n的正方形大小)
    };

    this.canvasConfig = {
      isEraser: false,//橡皮擦
      isHandWriter: true,//手写笔
    };

    //背景图片的宽高
    this.imgW = 0;
    this.imgH = 0;

  }

  /**
   * 清空画布上面的所有操作
   */
  clearCanvas () {
    this[CLEARCANVAS]();
  }
  [CLEARCANVAS] () {
    this.ctx.clearRect(
      0,
      0,
      this.ctx.canvas.width,
      this.ctx.canvas.height
    );
    this.preDrawAry = [];
  }

  /**
   * 撤销操作
   */
  restore () {
    this[RESTORE]();
  }
  [RESTORE] () {
    if (this.preDrawAry.length > 0) {
      const popData = this.preDrawAry.pop();
      this.ctx.putImageData(popData, 0, 0);
    }

  }

  /**
   * 设置操作的类型，{isEraser:false,isHandWriter: true}
   * @param {Object} configObj 
   */
  setOperator (configObj) {

    return this[SETOPERATOR](configObj);
  }
  [SETOPERATOR] (configObj) {
    //每个操作设置为0（false）或者1（true），由于操作之间为相互排出事件，所以其相加的结果只有0或者1
    let paramsCount = 0;//记录操作的值
    for (let property in configObj) {
      if (configObj[property]) {
        paramsCount++;
      }
    }
    if (paramsCount > 1) {
      return false;
    }

    for (let property in this.canvasConfig) {
      if (typeof configObj[property] != 'undefined' && configObj[property]) {
        this.canvasConfig[property] = configObj[property];
      } else {
        this.canvasConfig[property] = false;
      }
    }

    // this.canvasConfig = JSON.parse(JSON.stringify(this.canvasConfig));
    return true;
  }


  /**
   * 随手涂鸦功能
   */
  drawing () {
    this[DRAWING]();
  }
  /**
   * 画笔涂鸦分为鼠标和触控画画
   * 所以要区分是触屏还是鼠标操作
   */
  [DRAWING] () {
    const _this = this;

    if (typeof this.ctx.canvas.ontouchstart !== undefined) {
      this.ctx.canvas.ontouchstart = function (event) { _this.touchDown(event) };
      this.ctx.canvas.ontouchmove = function (event) { _this.touchMove(event); _this.operation(); };
      this.ctx.canvas.ontouchend = function (event) {
        _this.touchUp(event);
      }
    }
    if (typeof this.ctx.canvas.onmousedown !== undefined) {
      this.ctx.canvas.onmousedown = function (event) { _this.mouseDown(event); }
      this.ctx.canvas.onmousemove = function (event) {
        _this.mouseMove(event);
        _this.operation();
      }
      this.ctx.canvas.onmouseup = function (event) { _this.mouseup(event) };
      this.ctx.canvas.onmouseout = function (event) {
        _this.downFlag = false;//画笔移出画布就关闭绘画动作
      }
      this.ctx.canvas.onmouseover = function (event) {
        if (_this.canvasConfig.isEraser) {//橡皮擦
          _this.canvasObj.style.cursor = "pointer";
        } else if (_this.canvasConfig.isHandWriter) {//手写笔
          _this.canvasObj.style.cursor = "crosshair";
        }
      }
    }

  }

  //画线（涂鸦）
  operation () {
    const _this = this;
    if (_this.downFlag) {
      if (_this.canvasConfig.isHandWriter) {//随手画画
        _this.ctx.lineTo(Math.floor(_this.currentX), Math.floor(_this.currentY));
        _this.ctx.stroke();
        // console.log(_this.ctx.canvas.width, _this.ctx.canvas.height);
        // console.log(preData);
      } else if (_this.canvasConfig.isEraser) {//橡皮擦
        // console.log("橡皮擦");
        _this.ctx.clearRect(Math.floor(_this.currentX), Math.floor(_this.currentY), this.canvasStyleConfig.eraserWidth, this.canvasStyleConfig.eraserWidth)
      }
      //
    }
  }

  //保存涂鸦的页面
  /**
 * 
 * @param {Number} x 鼠标事件的clientX
 * @param {Number} y 鼠标事件的clientY
 */
  /*坐标转化*/
  windowToCanvas (x, y) {
    let box = this.canvasObj.getBoundingClientRect();
    return {
      x: x - box.left - (box.width - this.canvasObj.width) / 2,
      y: y - box.top - (box.height - this.canvasObj.height) / 2
    };
  }
  //鼠标点下去 mousedown
  mouseDown (e) {
    let obj = this.windowToCanvas(e.clientX, e.clientY);
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(obj.x), Math.floor(obj.y));
    this.beginX = obj.x;
    this.beginY = obj.y;
    this.downFlag = true;

    const preData = this.ctx.getImageData(
      0,
      0,
      this.ctx.canvas.width,
      this.ctx.canvas.height
    );
    // 当前绘图表面进栈
    this.preDrawAry.push(preData);
  }
  //鼠标移动
  mouseMove (e) {
    // console.log("移动中");
    let obj = this.windowToCanvas(e.clientX, e.clientY);
    this.currentX = obj.x;
    this.currentY = obj.y;
  }
  //鼠标抬起
  mouseup (e) {
    // console.log("抬起了");
    // console.log("开始的位置", this.beginX, this.beginY);
    // console.log("此时的位置", this.currentX, this.currentY);

    // const preaData = this.ctx.getImageData(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
    // if(this.beginX !== this.currentX && this.beginY !== this.currentY){
    //   //当前鼠标的起始位置与当前位置不一致 表明鼠标按下移动了， 那么这个动作应该要记录下来
    // }
    this.downFlag = false;

  }
  //触摸 touchstart
  /**
   * 
   * @param {Obkect} e 触控对象
   */
  touchDown (e) {
    //只有一个触控点的时候才记录下画布的情况
    if (e.changedTouches.length == 1) {

      let obj = this.windowToCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      this.ctx.beginPath();
      this.ctx.moveTo(Math.floor(obj.x), Math.floor(obj.y));
      this.beginX = obj.x;
      this.beginY = obj.y;
      this.downFlag = true;


      const preData = this.ctx.getImageData(
        0,
        0,
        this.ctx.canvas.width,
        this.ctx.canvas.height
      );
      // 当前绘图表面进栈
      this.preDrawAry.push(preData);
    }
  }
  //触控移动
  touchMove (e) {
    if (e.changedTouches.length == 1 && this.downFlag) {
      e.preventDefault();//关闭滚动
      e.stopPropagation();//适配UC浏览器
      let obj = this.windowToCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      this.currentX = obj.x;
      this.currentY = obj.y;
    }
  }
  //触控抬起
  touchUp (e) {
    // console.log("抬起了");
    this.downFlag = false;
  }
  /**
   * 
   * @param {Number} width 
   * @param {Number} height 
   */
  setCanvasHeightAndWidth (height, width) {
    this[SETCANVASHEIGHTANDWIDTH](height, width);
  }
  [SETCANVASHEIGHTANDWIDTH] (height, width) {
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
  }
  /**
   * 
   * @param {String} url img的地址
   */
  setBackGroundImg (url) {
    this[SETBACKGROUNDIMG](url);
  }
  [SETBACKGROUNDIMG] (url) {
    const _this = this;
    console.log(this.canvasObj.parentNode);
    _this.ctx.clearRect(
      0,
      0,
      _this.ctx.canvas.width,
      _this.ctx.canvas.height
    );
    this.preDrawAry = [];
    this.middleAry = [this.middleAry[0]];
    this.rang = 0;

    let image = new Image();
    //下面两步设置主要是为了解决图片跨域问题(如果你的服务器上的图片提示跨域，注释2号方案，)
    // image.setAttribute("crossOrigin", "anonymous");
    // image.src = url + "?time=" + new Date().valueOf();

    //2、方案
    image.src = url;
    image.onload = () => {
      this.ctx.save();//存储一下现在的画布状态

      if (image.naturalWidth > image.naturalHeight) {
        //将画布的宽高设定死了
        // canvas.width=image.naturalWidth>1000?1000:image.naturalWidth < 500?500:image.naturalWidth;//注意：没有单位
        // canvas.height =image.naturalWidth>1000?image.naturalHeight * 1000 / image.naturalWidth>1000?image.naturalHeight * 1000 / image.naturalWidth:1000 : image.naturalHeight<500?500:image.naturalHeight;//注意：没有单位
        if (image.naturalWidth > this.ctx.canvas.width) {
          this.ctx.translate(0, (this.ctx.canvas.height - ((image.naturalHeight * this.ctx.canvas.width) / image.naturalWidth)) / 2);
          this.ctx.drawImage(
            image,
            0,
            0,
            this.ctx.canvas.width,
            (image.naturalHeight * this.ctx.canvas.width) / image.naturalWidth
          );
          this.imgW = this.ctx.canvas.width;
          this.imgH =
            (image.naturalHeight * this.ctx.canvas.width) / image.naturalWidth;
        } else {
          this.ctx.translate((this.ctx.canvas.width - image.naturalWidth) / 2, (this.ctx.canvas.height - image.naturalHeight) / 2);
          this.ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
          );
          this.imgW = image.naturalWidth;
          this.imgH = image.naturalHeight;
        }
      } else {
        if (image.naturalHeight > this.ctx.canvas.height) {

          this.ctx.translate((this.ctx.canvas.width - ((image.naturalWidth * this.ctx.canvas.height) / image.naturalHeight)) / 2, 0);
          this.ctx.drawImage(
            image,
            0,
            0,
            (image.naturalWidth * this.ctx.canvas.height) / image.naturalHeight,
            this.ctx.canvas.height
          );
          this.imgW =
            (image.naturalWidth * this.ctx.canvas.height) / image.naturalHeight;
          this.imgH = this.ctx.canvas.height;
        } else {
          this.ctx.translate((this.ctx.canvas.width - image.naturalWidth) / 2, (this.ctx.canvas.height - image.naturalHeight) / 2);
          this.ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
          );
          this.imgW = image.naturalWidth;
          this.imgH = image.naturalHeight;
        }
      }
      // console.log(this.imgW, this.imgH);
      this.ctx.restore();//还原画布状态
    }
  }

  /**
   * 获取画布
   */
  getCanvas () {
    this[GETCANVAS]();
  }
  [GETCANVAS] () {
    console.log(this.ctx);
  }


}
