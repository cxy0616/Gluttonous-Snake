var sw=20,//一个方块的宽
sh=20,//一个方块的高度
tr=30,//行数
td=30;//列数

var snake=null;
//蛇的实例
var food=null;
//食物的实例
var game=null;
//游戏的实例

//方块构造函数
function Square(x,y,classname){
	//贪吃蛇和食物和活动的区域都是由小方块构成的，创建一个构造函数比较简单
	//x,y是小方块的位置坐标，classname是一些涉及到特殊样式的小方块

	//用户传进来的（x,y）是（0，0），（1，0）这种坐标，而我们需要换算成第几个格子对应的位置坐标，乘以20
	this.x=x*sw;
	this.y=y*sh;

	this.class=classname;
	//classname此时是变量而不是属性

	this.viewContent=document.createElement('div');
	//每一个方块对应的dom元素
	this.viewContent.className=this.class;
	this.parent=document.getElementById('snakeWrap');
	//获取方块的父级

}
Square.prototype.create=function(){
	//创建方块dom，并添加到页面里
	this.viewContent.style.position='absolute';
	this.viewContent.style.width=sw+'px';
	this.viewContent.style.height=sh+'px';
	this.viewContent.style.left=this.x+'px';
	this.viewContent.style.top=this.y+'px';
	this.parent.appendChild(this.viewContent);

};
Square.prototype.remove=function(){
	this.parent.removeChild(this.viewContent);
};

//创建蛇
function Snake(){
	this.head=null;//存蛇头的信息
	this.tail=null;//蛇尾的信息
	this.pos=[];//存储蛇身上的每一个方块的位置
	this.directionNum={
		//存储蛇的走的方向，用一个对象表示
		left:{
			x:-1,
			y:0,
			rotate:180//蛇头默认向右，往左旋转180度
		},
		right:{
			x:1,
			y:0,
			rotate:0
		},
		up:{
			x:0,
			y:-1,
			rotate:-90//顺时针为正角

		},
		down:{
			x:0,
			y:1,
			rotate:90
		}
	}
}
Snake.prototype.init=function(){
	//对蛇进行初始化，一个蛇头，两个身体

	//创建蛇头
	var snakeHead=new Square(2,0,'snakeHead');
	snakeHead.create();
	//此时位置不对，应该此时蛇头相对于content定位的，将snakeWrap开启相对定位

	//更新相关变量的信息
	this.head=snakeHead;//存储蛇头信息
	this.pos.push([2,0]);//把蛇头的位置存起来

	//创建蛇身体1
	var snakeBody1=new Square(1,0,'snakeBody');
	snakeBody1.create();
	this.pos.push([1,0]);//把蛇身1的坐标存起来
	
	//创建蛇身体2
	var snakeBody2=new Square(0,0,'snakeBody');
	snakeBody2.create();
	this.tail=snakeBody2;//存储蛇尾信息
	this.pos.push([0,0]);//把蛇身2的坐标存起来
	 
	//蛇的移动的关系构建，方法一把蛇的每一个方块的位置信息存在数组里，遍历每一个去移动，但是性能不好
	//方法二，让整条蛇每个块与前后产生关系，只动蛇头和蛇尾就可以。
	//形成链表关系，让元素前后互相联系
	
	//给每一个方块添加两个属性，next和last,各方块通过两个属性互相查询
	snakeHead.last=null;
	snakeHead.next=snakeBody1;
  
	snakeBody1.last=snakeHead;
	snakeBody1.next=snakeBody2;

	snakeBody2.last=snakeBody1;
	snakeBody2.next=null;

	//给蛇添加一个方向属性，用来表示蛇走的方向
	 this.direction=this.directionNum.right;//默认往右走
	
};

//该方法用来获取蛇头的下一个位置对应的元素，要根据下一个元素对应的情况做不同的事情
Snake.prototype.getNextPos=function(){
    var nextPos=[
		//下一个位置是根据蛇头的当前位置和方向所确定的
		this.head.x/sw+this.direction.x,
		// this.head=snakeHead，snakeHead是Square的实例化，有x属性，此时的x对应的是整十的关系
		//this.direction=this.directionNum.right,this.directionNum.right也是一个对象，有x属性
		this.head.y/sh+this.direction.y
	]
	// console.log(nextPos);

	//根据下一个点的状态对应不同的逻辑
	//下个点是自己，代表撞到了自己，游戏结束
	var selfCollied=false;//定义一个是否撞到了自己的变量，默认是false
	this.pos.forEach(function(value){
		if(value[0]==nextPos[0]&&value[1]==nextPos[1]){
			selfCollied=true;
			//下一个左边点在蛇身上面，代表撞到自己了
			//注意：value==nextPos是不对的，应该对象的比较==不仅考虑数值，还考虑引用地址！！
		}

	});
	if(selfCollied){
		console.log('撞到自己，游戏结束');
		this.strategies.die.call(this);
		return;
		// return有两个作用：结束这个流程和给函数一个返回值，没有的话返回undefined
		//第四种情况，下一步什么都不是的情况采用排除法，可以将前三种方法和最后一个方法弄一个ifelse嵌套，但是会造成结构的冗余
		//使用return的话出现四种情况之一就可以阻止后面的流程的进行，更高效，也没必要判断后面的代码，入股前三中国都不符合，就执行第四种情况
	}
	//是墙，游戏结束
	if(nextPos[0]<0||nextPos[0]>td-1||nextPos[1]<0||nextPos[1]>tr-1){
		console.log('撞墙上了');
		this.strategies.die.call(this);
		return;
	}
	//是苹果，吃掉
    if(food&&food.pos[0]==nextPos[0]&&food.pos[1]==nextPos[1]){
		//表示有食物，并且下一个食物的点是食物
		this.strategies.eat.call(this);
		return;
	}

	//什么都不是，接着走
	this.strategies.move.call(this);
	//将this.strategies.move方法中的this改成了实例对象

};

// 处理碰撞后要做的事
Snake.prototype.strategies={
	//接收/吃/走
	move:function(format){//这个参数用于决定要不要删除最后一个方块（蛇尾），只是在下一个动作是吃时不删除
		//当不传这个参数，format为undefined,!undefined为true,表示删除；传了参数表示吃的操作
		
		//console.log('move');
		//console.log(this);
		//对应上面的语句this.strategies.move();此时this指向的是this.strategies，{move: ƒ, eat: ƒ, die: ƒ}，此时this.head为undefined，不具备Snake的属性
		
		//创建新身体（在旧蛇头的位置）
		var newBody=new Square(this.head.x/sw,this.head.y/sh,'snakeBody');
		//更新链表关系
		// newBody.next=snakeBody1;snakeBody1在当前作用域用不了
		newBody.next=this.head.next;//通过this.head.next找到snakeBody1
		newBody.next.last=newBody;
		newBody.last=null;

        this.head.remove();//删除旧蛇头
		newBody.create();

		//创建一个新蛇头，新蛇头是蛇头下一个要走的位置nextpos
		var newHead=new Square(this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y,'snakeHead');
		
		//更新链表关系
		newBody.last=newHead;
		newHead.last=null;
		newHead.next=newBody;

		//在每次新建舌头的时候改变蛇头的角度
		//newHead是对象，但不是dom对象
		newHead.viewContent.style.transform='rotate('+this.direction.rotate+'deg)';
		newHead.create();

		//更新蛇身上的每一个方块的坐标,实际上就是在pos的第一个位置插入nextpos,也就是新的蛇头的坐标？
		this.pos.splice(0,0,[this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y]);
		this.head=newHead;//把this.head的信息更新一下
		
		
		if(!format){
			//format为false时，表示需要删除，表示除了吃之外的操作
			this.tail.remove();
			//更新链表关系
			this.tail=this.tail.last;//删掉的是dom，this.tail仍然存在
			//更新蛇身上的每一个方块的坐标
			this.pos.pop();//把body2删除，在pos中的位置是栈顶，pop掉栈顶元素
		}
	},
	eat:function(){
		// console.log('eat');
		//this.strategies.move()代码中的this指向this.strategies
		this.strategies.move.call(this,true)//this指向实例对象snake
		createFood();
		//算出得分
        game.score++;
	},
	die:function(){
	// console.log('die');
	  game.over();
	}

}
snake=new Snake();


//创建食物
function createFood(){
	//食物小方块的随机坐标
    var x=null;
	var y=null;
	 
	//食物出现在围墙上和蛇身上是不允许的
	var include=true;
	//循环跳出的条件，true表示食物的坐标在蛇身，需要继续循环，继续执行随机过程，false表示食物的坐标不在他身上，不循环
     while(include){
	   x=Math.round(Math.random()*(td-1));//产生0-29的数
	   y=Math.round(Math.random()*(tr-1));

	   snake.pos.forEach(function(value){
		   if(x!=value[0]&&y!=value[1]){
			// 这个关系成立说明现在随机出来的坐标在蛇身上没有找到
			include=false;
		   }

	   });
	 }
 
	  //生成食物
	  food=new Square(x,y,'food');
	  food.pos=[x,y];//存储生成食物的坐标，用于跟蛇头要走的下一个点做对比
	  //生成新食物之前删除旧食物
	//   food.remove();会报错，因为food没有使用create方法创建到页面上，不是dom节点，不能执行remove方法中的removeChild的操作
	var foodDom=document.querySelector('.food');
	
	//使用设计模式中的单例模式的思想，不是每次生成新的食物，而是只有一个食物，每次改变食物的left和top值
	if(foodDom){
		foodDom.style.left=x*sw+'px';
		foodDom.style.top=y*sh+'px';
	}else{
		food.create();
	}
	 

}

//创建游戏实例
function Game(){
	this.timer=null;
    this.score=0;
}
Game.prototype.init=function(){
	snake.init();
	//snake.getNextPos();
	createFood();
	document.onkeydown=function(event){
		if(event.which==37&&snake.direction!=snake.directionNum.right)
		// event.which属性返回的是输入的字符的Unicode值(相当于event.charCode)
		{   //用户按下左键时，这条蛇不能正在往右走
			// this.direction=this.directionNum.left;
			snake.direction=snake.directionNum.left;
		}else if(event.which==38&&snake.direction!=snake.directionNum.down){
			snake.direction=snake.directionNum.up;
		}else if(event.which==39&&snake.direction!=snake.directionNum.left){
			snake.direction=snake.directionNum.right;
		}else if(event.which==40&&snake.direction!=snake.directionNum.up){
			snake.direction=snake.directionNum.down;
		}
	}
	this.start();
}
Game.prototype.start=function(){//开始游戏
	 this.timer=setInterval(function(){
		 snake.getNextPos();
	 },200);

}
Game.prototype.pause=function(){
   //暂停游戏
   clearInterval(this.timer);
}
Game.prototype.over=function(){
	clearInterval(this.timer);//清除定时器，不再动了
	alert('你的得分为'+this.score);
	//游戏回到最初的状态
	var snakeWrap=document.getElementById('snakeWrap');
	snakeWrap.innerHTML='';//让蛇和食物不显示

	//但是实例属性还有，初始化他们的状态？
	snake=new Snake();
	game=new Game();
	var startBtnWrap=document.querySelector('.startBtn');
	startBtnWrap.style.display='block';


}
//开启游戏
game=new Game();
var startBtn=document.querySelector('.startBtn button');
startBtn.onclick=function(){
	startBtn.parentNode.style.display='none';
	game.init();
};

//暂停
var snakeWrap=document.getElementById('snakeWrap');
var pauseBtn=document.querySelector('.pauseBtn button');
snakeWrap.onclick=function(){
   game.pause();
   pauseBtn.parentNode.style.display='block';

}
pauseBtn.onclick=function(){
	game.start();
	pauseBtn.parentNode.style.display='none';
}