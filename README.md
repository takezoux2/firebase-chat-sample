
## 環境構築

```
# NPMと、ionicのインストール
brew install node
sudo npm install -g cordova ionic
```

## プロジェクト作成

```
# プロジェクト作成
ionic start myChat sidemenu

# プロジェクトに移動
cd myChat
ionic serve

# Emulatorでも動作確認
ionic emulate ios

# 実機で実行
ionic run ios

```


# 実装


## firebaseの準備

### index.htmlを修正して、firebaseを追加

```www/index.html
# Firebaseの参照を追加
# www/index.htmlに追加
<script src="https://www.gstatic.com/firebasejs/3.3.0/firebase.js"></script>
```

### firebaseへ接続するための認証情報を設定

www/js/config.jsファイルを作成
```config.js
angular.module('starter.configs', [])

// 認証情報は、Firebaseのコンソールから取得
.constant("CONFIG", {
  ...
});
```

### index.htmlに認証情報も追加

```www/index.html
// configを追加
<script src="js/config.js"></script>
```

### モジュールに、config情報を使えるように依存を指定

```www/js/controllers.js
// 1行目にconfigsの依存を追加
angular.module('starter.controllers', ["starter.configs"])
// controllerの引数にCONFIGを追加
.controller('AppCtrl', function($scope, $ionicModal, $timeout, CONFIG, $ionicPopup) {
```

### firebaseの設定


```www/js/controllers.js

  // 初期化
  firebase.initializeApp(CONFIG);
```

## ログイン

### 事前準備

Firebaseでメールによる認証を有効化しておく


### サイドメニューを変更

{{_}}で囲むことで、表示のときにプログラムで設定した値を表示できる

ng-clickで、クリックしたときに実行するメソッドを指定

```www/templates/menu.html
  <ion-side-menu side="left">
    <ion-header-bar class="bar-stable">
      <h1 class="title">Menu</h1>
    </ion-header-bar>
    <ion-content>
      <ion-list>
        <ion-label>
          User:{{username}}
        </ion-label>
        <ion-item menu-close ng-click="login()">
          Login
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-side-menu>
```



### ログイン状態を取得する

```www/js/controller.js
  // 認証情報を取得
  // ログインした場合にもこれが実行される
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // ログインしている場合は、ユーザー名としてemailを設定
      $scope.username = user.email;
    } else {
      $scope.username = "未ログイン";
    }
  });
```

### ログイン処理


```
$scope.doLogin = function() {

    // 本当は、アカウント作成と、再ログインに分けたほうが良い
    // 今回は、とりあえずアカウント作成を試し、駄目ならログイン処理を行っている
    // アカウントの作成
    var loginData = $scope.loginData;
    firebase.auth().createUserWithEmailAndPassword(loginData.username, loginData.password).then(function(success) {
      // アカウント作成成功
      console.log("Success to create account")
      $scope.closeLogin();

    },function(error) {
      // アカウント作成失敗
      // エラーをログに出しておく
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode + ":" + errorMessage);

      // すでにアカウントが存在している
      if(errorCode == "auth/email-already-in-use"){
        // その場合は、ログインする
        firebase.auth().signInWithEmailAndPassword(loginData.username, loginData.password).then(function(success){
          // ログイン成功
          console.log("Success to login")
          $scope.closeLogin();

        }, function(error) {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(errorCode + ":" + errorMessage);
          $ionicPopup.alert({
            title: 'ログイン失敗',
            template: errorCode + ":" + errorMessage
          });

        });
      }else{
        // 他のゲインのエラーの場合は、メッセージを出す
        $ionicPopup.alert({
          title: 'ログイン失敗',
          template: errorCode + ":" + errorMessage
        });
      }
    });
  };
```


## チャット

### チャットメッセージの表示

www/templates/chat.htmlファイルを作成
ng-repeatで、配列の要素を並べて表示出来る

```www/templates/chat.html
<ion-view view-title="Chat">
  <ion-content>
    <ion-list>
      <ion-item ng-repeat="message in messages">
        {{message.user}}さん : {{message.text}}
      </ion-item>
    </ion-list>
    <!-- 書き込みボタン -->
    <div class="list">
      <div class="item item-input-inset">
        <label class="item-input-wrapper">
          <input type="text" placeholder="送信メッセージ" ng-model="sendData.text">
        </label>
        <button class="button button-small" ng-click="sendMessage()">
          送信
        </button>
      </div>
    </div>
  </ion-content>
</ion-view>
```

また、メニューでログイン以外は不要なので消しておき、デフォルトの画面を、今作ったchat.htmlにしておく

```www/js/app.js

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.chat', {
    url: '/chat',
    views: {
      'menuContent': {
        templateUrl: 'templates/chat.html'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/chat');
});
```


### 送信データと、チャットメッセージのための変数を用意

```www/js/controllers.js


  // チャットで送信するデータ
  $scope.sendData = {};
  // チャットのメッセージのリスト
  $scope.messages = [];

```

### メッセージを送信するメソッドを追加

```www/js/controllers.js

  // チャットの文章を送るメソッド
  $scope.sendMessage = function() {
    if($scope.sendData.text.length == 0){
      // 空の場合は、送信せずに終了
      return;
    }
    console.log("Send message:" + $scope.sendData.text);
    // pushは、リストに対して要素を追加するためのKeyを取得する
    var key = firebase.database().ref("chat/messages").push().key;

    // 生成したKeyを使用して、要素の追加をする
    firebase.database().ref("chat/messages/" + key).set({
      user: $scope.username,
      text: $scope.sendData.text
    });

    // 入力した文章をリセット
    $scope.sendData.text = "";
  };

```

## データを受け取る

データに変更があった場合に、その通知を受け取れるようにする

```www/js/controllers.js

  // データベースの変更を検知する
  // データが更新されるたびに呼び出される
  firebase.database().ref("chat/messages").limitToLast(10).on("child_added",function(snapshot){
    // 表示するコメントリストの末尾に追加
    $scope.messages.push(snapshot.val());

    // AngularJSに対して、画面の更新を通知する
    $scope.$applyAsync();
  });
```

## 完成

以上でシンプルなチャットの完成




