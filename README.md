# 計網socket programming作業 - 多人貪吃蛇

## 壹. 作品介紹

這是一款一個多人連線的貪吃蛇遊戲，在遊戲中，玩家操控一條細長的蛇，它會不停前進，玩家可以操控蛇的走向，觸碰到自身或者其他玩家就輸了。玩家一路上要盡量去吃紅色的食物才能得分，但在吃掉食物的同時蛇也會跟著變長，觸碰的機率也就越來越大，因此遊戲越玩到後期就必須想辦法在不會撞到的情況下吃到食物。

| ![screenshot1](/assets/screenshot1.png) |
|:--:|
| **貪吃蛇遊戲(左-server 右-client)** |

和一般的貪吃蛇不同與創新的地方，這個作品加入了多人連線的機制，最多有4人可以同時遊玩。隨時連上伺服器遇到不一樣的人數也會有不一樣的遊戲體驗。當只有1人時，你可以體驗傳統貪吃蛇的樂趣，看著蛇慢慢長大占滿整個螢幕十分有成就感。越多人加入時，就必須和其他玩家爭奪食物，想辦法讓別人撞到自己，也要小心不要撞到別人，十分刺激。


| ![screenshot2](/assets/screenshot2.png) |
|:--:|
| **最多4人同時連線，越多人玩越刺激** |

## 貳. 使用技術

本作品使用node.js當作主要開發語言

### 一. net - TCP clients & servers

node.js本身提供net模組，協助建立TCP server和client並與OS底層的socket api進行串接。

* TCP伺服器端接口
  * Step 1 : 使用net模組建TCP server

  ```javascript=
  // 引入net模組，並創建server
  const server = require('net').createServer();

  // 監聽PORT，並設定最大連線數backlog
  server.listen({
      port: PORT, 
      backlog: 4
  }, console.log("listening to port", PORT));
  ```

  * Step 2: 事件綁定

  ```javascript=
  // TCP 3方交握第2階段
  server.on('connection', client => {
  // client傳送資料來時觸發
      client.on('data', (data) => {
  // 傳送資料給client，與client互動
        client.write('hi!');
      });
  // 連線完全終止時觸發	
      client.once('close', () => {
          console.log("connection closed");
      })
  // 對方中斷連線時觸發
      client.on('end', () => {
          console.log("connection end");
      })
  // 出現錯誤時觸發
      client.on('error', (err) => {
      console.log("connection error");
      })
  });
  ```

* TCP client端接口
  * Step 1 : 使用net模組建TCP client

  ```javascript=
  var net = require('net');
  // 建立client socket
  let socket = new net.Socket();

  // TCP 3次交握第一階段，client端請求連線
  socket.connect(PORT, HOST, function() {
  console.log('client端：向 server端 請求連線')
  });
  ```

  * Step 2: 事件綁定

  ```javascript=
  // client接收到server資料時觸發
  socket.on('data', function(payload) {
  // 傳輸資料給server
      socket.write('hi!');
  })
  ```

### 二. blessed - 實作終端機遊戲介面

這次為了實現在終端機環境就能玩遊戲的目標而找到了blessed這款第三方套件。Blessed是Node.js 構建終端應用介面的函式庫。提供多元的widget包含像是各種表單輸入元件、列表、表格、提示框…等ui元件，幫助開發者建立多元的終端機應用。基本的使用方法如下:

* 建立screen

  Blessed使用screen物件去渲染其中的ui元件，底下的程式會建立一個使用smart CSR(change-scroll-region)的screen，幫助渲染更有效率。

  ```javascript=
  const blessed = require('blessed');
  // client接收到server資料時觸發
  let screen = blessed.screen({ smartCSR: true })
  // 設定應用程式名稱
  screen.title = '107403551 邱士權'
  ```

* screen綁定鍵盤按鍵

  以下程式示範當玩家按下ESC、q、Ctrl+C時會結束程式，這個方法也用來偵測WASD和方向鍵讓玩家可以控制蛇

  ```javascript=
  screen.key(['escape', 'q', 'C-c', 'enter'], () => {
      process.exit();
  });
  ```

* 加入Widgets

  雖然blessed有提供很多像是 text inputs, checkboxes, radio buttons的UI元件，但這次我只有用到建立方形視窗的元件box，計分狀態條、遊戲視窗、和蛇的本體與食物都是用這個畫的，程式如下:

  ```javascript=
  // 主要遊戲視窗，放在screen上
  let gameContainer = blessed.box({
      parent: this.screen,
      top: 1,
      left: 0,
      width: GRID_SIZE*2,
      height: GRID_SIZE,
      style: {
          fg: 'black',
          bg: '#f0f0f0',
      }
  })

  // 在遊戲視窗繪製一格方塊的函式，用於繪製食物和蛇
  draw(coord, color) { 
    blessed.box({
        parent: this.gameContainer,
        top: coord.y,
        left: coord.x*2,
        width: 2,
        height: 1,
        style: {
        fg: color,
            bg: color,
        }
    })
  }
  ```

* 渲染所有東西
  
  最後使用screen的render函數把東西都印出來，當從伺服器接收到新的遊戲狀態時也會使用這個函式重新渲染

  ```javascript=
  screen.render();
  ```
